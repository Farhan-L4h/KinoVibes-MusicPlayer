import { supabase } from '../config/supabase';
import { transformMusicData } from './supabaseMusicApi';
import { createPlaylist, addTrackToPlaylist, getUserPlaylists } from './supabasePlaylistApi';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const TOKEN_KEY = 'kv-spotify';
const PKCE_KEY = 'kv-sp-pkce';
const REDIRECT_PATH = '/profile';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');
const SPOTIFY_PATH_PREFIX = 'spotify:';

export const isSpotifyConfigured = () => !!CLIENT_ID;
export const spotifyRedirectUri = () => `${window.location.origin}${REDIRECT_PATH}`;

const loadTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch {
    return null;
  }
};

const saveTokens = (tokens) => {
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
};

export const isSpotifyConnected = () => !!loadTokens()?.refreshToken;

export const disconnectSpotify = () => {
  saveTokens(null);
  try {
    sessionStorage.removeItem(PKCE_KEY);
  } catch { /* ignore */ }
};

const base64url = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomVerifier = () => {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
};

const challengeFor = async (verifier) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
};

// Authorization Code + PKCE: public client, no secret anywhere in the frontend.
export const beginSpotifyLogin = async () => {
  if (!CLIENT_ID) throw new Error('Spotify belum dikonfigurasi.');
  const verifier = randomVerifier();
  const state = randomVerifier().slice(0, 24);
  const challenge = await challengeFor(verifier);
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, createdAt: Date.now() }));
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: spotifyRedirectUri(),
    scope: SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
};

const tokenRequest = async (body) => {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token Spotify gagal.');
  return data;
};

// Handles ?code=… on the redirect target. Returns true when a login completed.
export const completeSpotifyLogin = async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (!code && !error) return false;
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  if (error) throw new Error(error === 'access_denied' ? 'Izin Spotify dibatalkan.' : `Spotify: ${error}`);

  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PKCE_KEY) || 'null');
    sessionStorage.removeItem(PKCE_KEY);
  } catch { /* ignore */ }
  if (!pending || pending.state !== state || Date.now() - pending.createdAt > 10 * 60_000) {
    throw new Error('Sesi login Spotify tidak valid. Coba hubungkan lagi.');
  }
  const data = await tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyRedirectUri(),
    code_verifier: pending.verifier,
  });
  saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  });
  return true;
};

let refreshPromise = null;

export const getSpotifyToken = async () => {
  const tokens = loadTokens();
  if (!tokens?.refreshToken) return null;
  if (tokens.accessToken && Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  if (!refreshPromise) {
    refreshPromise = tokenRequest({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken })
      .then((data) => {
        const next = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || tokens.refreshToken,
          expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
        };
        saveTokens(next);
        return next.accessToken;
      })
      .catch((err) => {
        // Refresh token revoked/expired: force a fresh connect.
        if (/invalid_grant|revoked/i.test(err.message || '')) saveTokens(null);
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const spotifyFetch = async (path, { method = 'GET', body, retried = false } = {}) => {
  const token = await getSpotifyToken();
  if (!token) throw new Error('Spotify belum terhubung.');
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !retried) {
    const tokens = loadTokens();
    if (tokens) saveTokens({ ...tokens, expiresAt: 0 });
    return spotifyFetch(path, { method, body, retried: true });
  }
  if (res.status === 429) {
    const wait = res.headers.get('Retry-After');
    throw new Error(`Spotify sedang membatasi permintaan. Coba lagi ${wait ? `${wait} detik` : 'sebentar'}.`);
  }
  if (res.status === 204 || res.status === 202) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = data?.error?.message || `Spotify error ${res.status}`;
    if (res.status === 403) {
      if (/premium/i.test(message)) {
        throw new Error('Fitur ini butuh Spotify Premium.');
      }
      message = 'Spotify error 403: Email Spotify Anda perlu didaftarkan di "Users and Access" pada dashboard Spotify Developer.';
    }
    throw new Error(message);
  }
  return data;
};

export const getSpotifyProfile = () => spotifyFetch('/me');

export const getSpotifyTrackPreview = async (id) => {
  const data = await spotifyFetch(`/tracks/${id}`);
  return data?.preview_url || null;
};

export const spotifyItemToTrack = (item) => ({
  id: `sp:${item.id}`,
  source: 'spotify',
  spotifyId: item.id,
  uri: item.uri,
  title: item.name,
  artist: (item.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist',
  album: item.album?.name || null,
  duration: Math.round((item.duration_ms || 0) / 1000),
  albumArt: item.album?.images?.[0]?.url || null,
  audioUrl: item.preview_url || null,
  isFullTrack: true,
});

export const searchSpotify = async (query, limit = 20, { signal } = {}) => {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  const token = await getSpotifyToken();
  if (!token) return [];
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throw new Error('Pencarian Spotify gagal.');
  const data = await res.json();
  return (data.tracks?.items || []).filter(Boolean).map(spotifyItemToTrack);
};

const savedTracksPage = (offset) => spotifyFetch(`/me/tracks?limit=50&offset=${offset}`);

export const getSpotifyPlaylists = async () => {
  const data = await spotifyFetch('/me/playlists?limit=50');
  return (data?.items || []).filter(Boolean);
};

export const getSpotifyPlaylistTracks = async (playlistId, cap = 100) => {
  const out = [];
  let path = `/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,uri,duration_ms,preview_url,artists(name),album(name,images))),next`;
  while (path && out.length < cap) {
    const data = await spotifyFetch(path.replace('https://api.spotify.com/v1', ''));
    for (const row of data?.items || []) {
      if (row?.track?.id) out.push(row.track);
      if (out.length >= cap) break;
    }
    path = data?.next || null;
  }
  return out;
};

export const ensureSpotifyTrack = async (track, userId) => {
  const audioPath = `${SPOTIFY_PATH_PREFIX}${track.spotifyId}`;
  const { data: existing, error: findError } = await supabase
    .from('music_library')
    .select('*')
    .eq('user_id', userId)
    .eq('audio_path', audioPath)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return transformMusicData(existing);

  const { data, error } = await supabase
    .from('music_library')
    .insert({
      user_id: userId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      source: 'spotify',
      audio_url: '',
      audio_path: audioPath,
      album_art: track.albumArt,
      file_name: `${track.spotifyId}.spotify`,
      file_size: 0,
      is_full_track: true,
    })
    .select()
    .single();
  if (error) throw error;
  return transformMusicData(data);
};

// Imports saved tracks into the library and Spotify playlists as local
// playlists. Deduplicates by spotify id; safe to run repeatedly.
export const importSpotifyLibrary = async (userId, { includePlaylists = true, onProgress } = {}) => {
  const report = { tracks: 0, playlists: 0, skipped: 0 };
  let offset = 0;
  const imported = new Map();
  let trackError = null;

  try {
    for (;;) {
      const page = await savedTracksPage(offset);
      const items = (page?.items || []).map((r) => r?.track).filter((t) => t?.id);
      for (const item of items) {
        const track = spotifyItemToTrack(item);
        const row = await ensureSpotifyTrack(track, userId);
        imported.set(track.spotifyId, row.id);
        report.tracks += 1;
        onProgress?.(`Mengimpor lagu… ${report.tracks}`);
      }
      if (!page?.next || items.length === 0 || report.tracks >= 500) break;
      offset += 50;
    }
  } catch (err) {
    trackError = err;
    console.warn('Gagal membaca lagu tersimpan Spotify:', err);
  }

  let playlistError = null;
  if (includePlaylists) {
    try {
      const existing = await getUserPlaylists(userId);
      const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));
      const lists = await getSpotifyPlaylists();
      for (const list of lists) {
        if (!list?.id || existingNames.has((list.name || '').toLowerCase())) {
          report.skipped += 1;
          continue;
        }
        onProgress?.(`Mengimpor playlist "${list.name}"…`);
        const items = await getSpotifyPlaylistTracks(list.id, 100);
        if (!items.length) continue;
        const created = await createPlaylist(userId, {
          name: list.name,
          description: list.description ? String(list.description).replace(/<[^>]*>/g, '').slice(0, 200) : 'Diimpor dari Spotify',
          coverImage: list.images?.[0]?.url || null,
        });
        for (const item of items) {
          const track = spotifyItemToTrack(item);
          const row = imported.get(track.spotifyId) || (await ensureSpotifyTrack(track, userId));
          imported.set(track.spotifyId, row.id);
          await addTrackToPlaylist(created.id, row.id).catch(() => {});
        }
        report.playlists += 1;
      }
    } catch (err) {
      playlistError = err;
      console.warn('Gagal membaca playlist Spotify:', err);
    }
  }

  if (report.tracks === 0 && report.playlists === 0) {
    if (trackError) throw trackError;
    if (playlistError) throw playlistError;
  }

  return report;
};

export const spotifyPathId = (audioPath) =>
  audioPath?.startsWith(SPOTIFY_PATH_PREFIX) ? audioPath.slice(SPOTIFY_PATH_PREFIX.length) : null;
import { getSignedUrl, uploadFile, BUCKETS } from '../config/supabase';
import { supabase } from '../config/supabase';
import { parseLrc, isLrcFormat } from '../lib/lrc';
import { cleanTitle } from '../lib/utils';
import { ensureYouTubeTrack } from './supabaseMusicApi';

const lyricsCache = new Map();
const pendingLyrics = new Map();
const MAX_LYRICS = 100;
const CACHE_TTL = 15 * 60_000;
let authSubject;

supabase.auth.onAuthStateChange((event, session) => {
  const subject = session?.user?.id || null;
  if (event === 'SIGNED_OUT' || subject !== authSubject) {
    authSubject = subject;
    lyricsCache.clear();
    for (const entry of pendingLyrics.values()) entry.controller.abort();
    pendingLyrics.clear();
  }
});

const abortable = (promise, signal) => new Promise((resolve, reject) => {
  const abort = () => reject(signal.reason || new DOMException('Aborted', 'AbortError'));
  if (signal.aborted) {
    abort();
    return;
  }
  signal.addEventListener('abort', abort, { once: true });
  promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
});

const offsetKey = (trackId) => `kv-lyrics-offset:${trackId}`;
const offsetCache = new Map();

export const getLyricsOffset = (trackId) => {
  if (offsetCache.has(trackId)) return offsetCache.get(trackId);
  const raw = localStorage.getItem(offsetKey(trackId));
  const value = raw ? parseInt(raw, 10) || 0 : 0;
  if (offsetCache.size >= 200) offsetCache.delete(offsetCache.keys().next().value);
  offsetCache.set(trackId, value);
  return value;
};

export const setLyricsOffset = (trackId, ms) => {
  offsetCache.set(trackId, ms);
  localStorage.setItem(offsetKey(trackId), String(ms));
};

const fetchUserLyrics = async (track, signal) => {
  const url = track.lyricsPath
    ? await abortable(getSignedUrl(BUCKETS.LYRICS, track.lyricsPath), signal)
    : track.lyricsUrl;
  if (!url) {
    if (track.lyricsPath) throw new Error('URL lirik tidak tersedia');
    return null;
  }
  if (signal.aborted) throw signal.reason;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Gagal memuat lirik (${res.status})`);
  const text = await res.text();
  if (!text.trim()) return null;

  if (isLrcFormat(text)) {
    const { lines, offsetMs } = parseLrc(text);
    return { synced: lines, plain: null, source: 'user', baseOffsetMs: offsetMs };
  }
  return { synced: null, plain: text, source: 'user', baseOffsetMs: 0 };
};

const fetchLrclib = async (track, signal) => {
  const params = new URLSearchParams({
    title: cleanTitle(track.title),
    artist: track.artist || '',
    album: track.album || '',
    duration: String(track.duration || 0),
  });
  const res = await fetch(`/api/lyrics?${params}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gagal mencari lirik (${res.status})`);
  const body = await res.json();
  if (!body.syncedLyrics && !body.plainLyrics) return null;
  return {
    synced: body.syncedLyrics ? parseLrc(body.syncedLyrics).lines : null,
    plain: body.plainLyrics || null,
    source: 'lrclib',
    baseOffsetMs: 0,
    trackName: body.trackName,
    artistName: body.artistName,
  };
};

export const fetchLyrics = async (track, { force = false, signal } = {}) => {
  if (!track) return null;
  if (signal?.aborted) throw signal.reason;
  if (force) invalidateLyricsCache(track.id);
  const key = JSON.stringify([track.id, track.userId, track.lyricsPath, track.lyricsUrl,
    track.title, track.artist, track.album, track.duration, track.updatedAt]);
  for (const [id, entry] of lyricsCache) {
    if (entry.expiresAt <= Date.now()) lyricsCache.delete(id);
  }
  const hit = lyricsCache.get(key);
  if (hit) {
    lyricsCache.delete(key);
    lyricsCache.set(key, hit);
    return hit.result;
  }

  let entry = pendingLyrics.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = { trackId: track.id, controller };
    const timeout = setTimeout(() => controller.abort(new DOMException('Lyrics timeout', 'TimeoutError')), 12_000);
    const request = async () => {
      const userLyrics = await fetchUserLyrics(track, controller.signal);
      if (controller.signal.aborted) throw controller.signal.reason;
      return userLyrics || fetchLrclib(track, controller.signal);
    };
    entry.promise = abortable(request(), controller.signal).then((result) => {
      if (controller.signal.aborted || pendingLyrics.get(key) !== entry) {
        throw controller.signal.reason || new DOMException('Lyrics invalidated', 'AbortError');
      }
      if (result) {
        lyricsCache.set(key, { trackId: track.id, result, expiresAt: Date.now() + CACHE_TTL });
        while (lyricsCache.size > MAX_LYRICS) lyricsCache.delete(lyricsCache.keys().next().value);
      }
      return result;
    }).finally(() => {
      clearTimeout(timeout);
      if (pendingLyrics.get(key) === entry) pendingLyrics.delete(key);
    });
    pendingLyrics.set(key, entry);
    while (pendingLyrics.size > MAX_LYRICS) {
      const oldest = pendingLyrics.keys().next().value;
      pendingLyrics.get(oldest).controller.abort();
      pendingLyrics.delete(oldest);
    }
  }
  // A caller can stop waiting without cancelling another view's shared request.
  return signal ? abortable(entry.promise, signal) : entry.promise;
};

export const invalidateLyricsCache = (trackId) => {
  for (const [key, entry] of lyricsCache) {
    if (entry.trackId === trackId) lyricsCache.delete(key);
  }
  for (const [key, entry] of pendingLyrics) {
    if (entry.trackId === trackId) {
      entry.controller.abort();
      pendingLyrics.delete(key);
    }
  }
};

export const saveManualLyrics = async (track, text, userId) => {
  let target = track;
  if (track.source === 'youtube' && !track.userId) {
    target = await ensureYouTubeTrack(track, userId);
  }
  if (!target.id || target.id.startsWith('yt:')) {
    throw new Error('Lagu belum tersimpan di library.');
  }

  const path = `${userId}/${Date.now()}_manual.lrc`;
  const blob = new Blob([text], { type: 'text/plain' });
  const file = new File([blob], 'manual.lrc', { type: 'text/plain' });
  const uploaded = await uploadFile(BUCKETS.LYRICS, path, file);

  const { error } = await supabase
    .from('music_library')
    .update({
      lyrics_path: uploaded.path,
      lyrics_url: uploaded.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', target.id);
  if (error) throw error;

  invalidateLyricsCache(target.id);
  invalidateLyricsCache(track.id);
  return { ...target, lyricsPath: uploaded.path, lyricsUrl: uploaded.publicUrl };
};
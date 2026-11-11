import { getSignedUrl, uploadFile, BUCKETS } from '../config/supabase';
import { supabase } from '../config/supabase';
import { parseLrc, isLrcFormat } from '../lib/lrc';
import { cleanTitle } from '../lib/utils';
import { ensureYouTubeTrack } from './supabaseMusicApi';

const lyricsCache = new Map();

const offsetKey = (trackId) => `kv-lyrics-offset:${trackId}`;

export const getLyricsOffset = (trackId) => {
  const raw = localStorage.getItem(offsetKey(trackId));
  return raw ? parseInt(raw, 10) || 0 : 0;
};

export const setLyricsOffset = (trackId, ms) => {
  localStorage.setItem(offsetKey(trackId), String(ms));
};

const fetchUserLyrics = async (track) => {
  let url = null;
  if (track.lyricsPath) {
    try {
      url = await getSignedUrl(BUCKETS.LYRICS, track.lyricsPath);
    } catch {
      url = track.lyricsUrl || null;
    }
  } else if (track.lyricsUrl) {
    url = track.lyricsUrl;
  }
  if (!url) return null;

  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.trim()) return null;

  if (isLrcFormat(text)) {
    const { lines, offsetMs } = parseLrc(text);
    return { synced: lines, plain: null, source: 'user', baseOffsetMs: offsetMs };
  }
  return { synced: null, plain: text, source: 'user', baseOffsetMs: 0 };
};

const fetchLrclib = async (track) => {
  const params = new URLSearchParams({
    title: cleanTitle(track.title),
    artist: track.artist || '',
    album: track.album || '',
    duration: String(track.duration || 0),
  });
  const res = await fetch(`/api/lyrics?${params}`);
  if (!res.ok) return null;
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

export const fetchLyrics = async (track, { force = false } = {}) => {
  if (!track) return null;
  if (!force && lyricsCache.has(track.id)) return lyricsCache.get(track.id);

  let result = null;
  try {
    result = await fetchUserLyrics(track);
  } catch {
    result = null;
  }
  if (!result) {
    try {
      result = await fetchLrclib(track);
    } catch {
      result = null;
    }
  }
  lyricsCache.set(track.id, result);
  return result;
};

export const invalidateLyricsCache = (trackId) => {
  lyricsCache.delete(trackId);
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
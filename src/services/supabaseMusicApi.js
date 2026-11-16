import { supabase, uploadFile, deleteFile, getSignedUrl, BUCKETS } from '../config/supabase';
import { ytArt } from './ytApi';

const YT_PATH_PREFIX = 'youtube:';
const SPOTIFY_PATH_PREFIX = 'spotify:';

export const transformMusicData = (dbRow) => {
  if (!dbRow) return null;
  const isYt = dbRow.source === 'youtube';
  const isSp = dbRow.source === 'spotify';
  const videoId = isYt ? (dbRow.audio_path || '').replace(YT_PATH_PREFIX, '') : null;
  const spotifyId = isSp ? (dbRow.audio_path || '').replace(SPOTIFY_PATH_PREFIX, '') : null;
  return {
    id: dbRow.id,
    userId: dbRow.user_id,
    title: dbRow.title,
    artist: dbRow.artist,
    album: dbRow.album,
    albumId: dbRow.album_id,
    genre: dbRow.genre,
    duration: dbRow.duration,
    audioUrl: isSp ? null : dbRow.audio_url,
    // Spotify ids are catalog references, not storage paths — never sign them.
    audioPath: isSp ? null : dbRow.audio_path,
    // Older YouTube rows stored a 120px sliver; the video frame is canonical.
    albumArt: isYt ? (ytArt(videoId) || dbRow.album_art) : dbRow.album_art,
    albumArtPath: dbRow.album_art_path,
    lyricsUrl: dbRow.lyrics_url,
    lyricsPath: dbRow.lyrics_path,
    fileName: dbRow.file_name,
    fileSize: dbRow.file_size,
    source: isYt ? 'youtube' : isSp ? 'spotify' : 'upload',
    videoId,
    spotifyId,
    uri: spotifyId ? `spotify:track:${spotifyId}` : null,
    playCount: dbRow.play_count || 0,
    isFullTrack: dbRow.is_full_track,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
};

export const resolveAudioUrl = async (track) => {
  if (!track || track.source === 'youtube') return null;
  if (track.audioPath) {
    return getSignedUrl(BUCKETS.MUSIC, track.audioPath);
  }
  return track.audioUrl || null;
};

export const uploadMusic = async (audioFile, albumArtFile, lyricsFile, metadata, userId, onStage) => {
  if (!audioFile) throw new Error('File audio wajib ada.');
  const timestamp = Date.now();
  const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');

  const audioPath = `${userId}/${timestamp}_${sanitizedFileName}`;
  const albumArtPath = albumArtFile
    ? `${userId}/${timestamp}_${albumArtFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    : null;
  const lyricsPath = lyricsFile
    ? `${userId}/${timestamp}_${lyricsFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    : null;

  onStage?.('audio');
  const audioUpload = await uploadFile(BUCKETS.MUSIC, audioPath, audioFile);

  let albumArtUpload = null;
  if (albumArtFile) {
    onStage?.('cover');
    albumArtUpload = await uploadFile(BUCKETS.ALBUM_ART, albumArtPath, albumArtFile);
  }

  let lyricsUpload = null;
  if (lyricsFile) {
    onStage?.('lyrics');
    lyricsUpload = await uploadFile(BUCKETS.LYRICS, lyricsPath, lyricsFile);
  }

  onStage?.('save');
  const { data, error } = await supabase
    .from('music_library')
    .insert({
      user_id: userId,
      title: metadata.title || 'Untitled',
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      album_id: metadata.albumId || null,
      genre: metadata.genre || 'Unknown',
      duration: metadata.duration || 0,
      audio_url: audioUpload.publicUrl,
      audio_path: audioUpload.path,
      album_art: albumArtUpload?.publicUrl || null,
      album_art_path: albumArtUpload?.path || null,
      lyrics_url: lyricsUpload?.publicUrl || null,
      lyrics_path: lyricsUpload?.path || null,
      file_name: sanitizedFileName,
      file_size: audioFile.size,
      source: 'upload',
      is_full_track: true,
    })
    .select()
    .single();

  if (error) throw error;
  return transformMusicData(data);
};

export const getUserMusic = async (userId) => {
  const { data, error } = await supabase
    .from('music_library')
    .select('*')
    .eq('user_id', userId)
    .neq('source', 'youtube')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformMusicData);
};

// Seeds the "frequently played" row and the recommendation matcher. Includes
// YouTube rows so saved streams can be recommended too.
export const getTopPlayed = async (userId, limit = 12) => {
  const { data, error } = await supabase
    .from('music_library')
    .select('*')
    .eq('user_id', userId)
    .gt('play_count', 0)
    .order('play_count', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(transformMusicData);
};

export const getAllMusic = async (userId) => {
  if (userId) return getUserMusic(userId);
  const { data, error } = await supabase
    .from('music_library')
    .select('*')
    .neq('source', 'youtube')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformMusicData);
};

export const searchMusic = async (searchTerm, userId, limit = 30) => {
  const term = (searchTerm || '').trim().slice(0, 200);
  if (!term) return getAllMusic(userId);
  // Escape LIKE backslashes, then PostgREST's quoted-value syntax.
  const pattern = `%${term.replace(/\\/g, '\\\\')}%`;
  const quotedPattern = `"${pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  let query = supabase
    .from('music_library')
    .select('*')
    .neq('source', 'youtube')
    .or(
      `title.ilike.${quotedPattern},artist.ilike.${quotedPattern},album.ilike.${quotedPattern},genre.ilike.${quotedPattern}`
    )
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformMusicData);
};

export const getRecentMusic = async (userId, limit = 12) => {
  let query = supabase
    .from('music_library')
    .select('*')
    .neq('source', 'youtube')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformMusicData);
};

// YouTube tracks live in music_library with source='youtube' so favorites &
// playlists work through the same foreign keys as uploads.
export const ensureYouTubeTrack = async (ytTrack, userId) => {
  const audioPath = `${YT_PATH_PREFIX}${ytTrack.videoId}`;
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
      title: ytTrack.title,
      artist: ytTrack.artist || 'Unknown Artist',
      album: ytTrack.album || 'YouTube Music',
      duration: ytTrack.duration || 0,
      audio_url: '',
      audio_path: audioPath,
      album_art: ytTrack.albumArt || null,
      file_name: `${ytTrack.videoId}.youtube`,
      file_size: 0,
      source: 'youtube',
      is_full_track: true,
    })
    .select()
    .single();
  if (error) throw error;
  return transformMusicData(data);
};

export const deleteMusic = async (track) => {
  if (track.source !== 'youtube' && track.source !== 'spotify') {
    if (track.audioPath) await deleteFile(BUCKETS.MUSIC, track.audioPath).catch(() => {});
    if (track.albumArtPath) await deleteFile(BUCKETS.ALBUM_ART, track.albumArtPath).catch(() => {});
    if (track.lyricsPath) await deleteFile(BUCKETS.LYRICS, track.lyricsPath).catch(() => {});
  }
  const { error } = await supabase.from('music_library').delete().eq('id', track.id);
  if (error) throw error;
  return true;
};

export const updateMusic = async (musicId, updates) => {
  const { data, error } = await supabase
    .from('music_library')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', musicId)
    .select()
    .single();
  if (error) throw error;
  return transformMusicData(data);
};

export const getMusicById = async (musicId) => {
  const { data, error } = await supabase
    .from('music_library')
    .select('*')
    .eq('id', musicId)
    .single();
  if (error) throw error;
  return transformMusicData(data);
};

export const incrementPlayCount = async (musicId) => {
  const { data } = await supabase
    .from('music_library')
    .select('play_count')
    .eq('id', musicId)
    .maybeSingle();
  await supabase
    .from('music_library')
    .update({ play_count: (data?.play_count || 0) + 1 })
    .eq('id', musicId);
};

export const downloadTrack = async (track) => {
  if (track.source === 'youtube') {
    throw new Error('Lagu YouTube hanya bisa distreaming, tidak diunduh.');
  }
  if (track.source === 'spotify') {
    throw new Error('Lagu Spotify hanya bisa distreaming, tidak diunduh.');
  }
  const url = await resolveAudioUrl(track);
  if (!url) throw new Error('URL audio tidak tersedia.');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil file audio.');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  const ext = (track.fileName || 'audio.mp3').split('.').pop();
  a.download = `${track.artist} - ${track.title}.${ext}`.replace(/[\\/:*?"<>|]/g, '_');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
};

export const isValidAudioFile = (file) => {
  const valid = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const ext = file.name.split('.').pop().toLowerCase();
  return valid.includes(ext);
};

export const isValidImageFile = (file) => {
  const valid = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const ext = file.name.split('.').pop().toLowerCase();
  return valid.includes(ext);
};

export const isValidLyricsFile = (file) => {
  const valid = ['lrc', 'txt'];
  const ext = file.name.split('.').pop().toLowerCase();
  return valid.includes(ext);
};
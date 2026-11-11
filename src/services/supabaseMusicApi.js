import { supabase, uploadFile, deleteFile, getSignedUrl, BUCKETS } from '../config/supabase';

const YT_PATH_PREFIX = 'youtube:';

export const transformMusicData = (dbRow) => {
  if (!dbRow) return null;
  const isYt = dbRow.source === 'youtube';
  return {
    id: dbRow.id,
    userId: dbRow.user_id,
    title: dbRow.title,
    artist: dbRow.artist,
    album: dbRow.album,
    albumId: dbRow.album_id,
    genre: dbRow.genre,
    duration: dbRow.duration,
    audioUrl: dbRow.audio_url,
    audioPath: dbRow.audio_path,
    albumArt: dbRow.album_art,
    albumArtPath: dbRow.album_art_path,
    lyricsUrl: dbRow.lyrics_url,
    lyricsPath: dbRow.lyrics_path,
    fileName: dbRow.file_name,
    fileSize: dbRow.file_size,
    source: isYt ? 'youtube' : 'upload',
    videoId: isYt ? (dbRow.audio_path || '').replace(YT_PATH_PREFIX, '') : null,
    playCount: dbRow.play_count || 0,
    isFullTrack: dbRow.is_full_track,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
};

export const resolveAudioUrl = async (track) => {
  if (!track || track.source === 'youtube') return null;
  if (track.audioPath) {
    try {
      return await getSignedUrl(BUCKETS.MUSIC, track.audioPath);
    } catch {
      // fall through to legacy public URL
    }
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
  if (!searchTerm || !searchTerm.trim()) return getAllMusic(userId);
  let query = supabase
    .from('music_library')
    .select('*')
    .neq('source', 'youtube')
    .or(
      `title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%,album.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`
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
  if (track.source !== 'youtube') {
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
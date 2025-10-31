// Music Library Service - 100% Supabase (Storage + Database)
import { supabase } from '../config/supabase';
import { 
  uploadFile, 
  deleteFile, 
  BUCKETS 
} from '../config/supabase';

// Upload music to Supabase
export const uploadMusic = async (audioFile, albumArtFile, lyricsFile, metadata, userId) => {
  try {
    if (!audioFile) throw new Error('Audio file is required');
    
    console.log('🎵 Starting music upload to Supabase...');
    const timestamp = Date.now();
    const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Generate file paths
    const audioPath = `${userId}/${timestamp}_${sanitizedFileName}`;
    const albumArtPath = albumArtFile 
      ? `${userId}/${timestamp}_${albumArtFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}` 
      : null;
    const lyricsPath = lyricsFile
      ? `${userId}/${timestamp}_${lyricsFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : null;
    
    // Upload audio file
    console.log('📤 Uploading audio...');
    const audioUpload = await uploadFile(BUCKETS.MUSIC, audioPath, audioFile);
    
    // Upload album art if provided
    let albumArtUpload = null;
    if (albumArtFile) {
      console.log('📤 Uploading album art...');
      albumArtUpload = await uploadFile(BUCKETS.ALBUM_ART, albumArtPath, albumArtFile);
    }
    
    // Upload lyrics if provided
    let lyricsUpload = null;
    if (lyricsFile) {
      console.log('📤 Uploading lyrics...');
      lyricsUpload = await uploadFile(BUCKETS.LYRICS, lyricsPath, lyricsFile);
    }
    
    console.log('💾 Saving metadata to Supabase Database...');
    // Save metadata to Supabase Database
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
        source: 'supabase',
        is_full_track: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Music uploaded successfully!', data);
    return data;
  } catch (error) {
    console.error('❌ Error uploading music:', error);
    throw error;
  }
};

// Get all music from library
export const getAllMusic = async () => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting music library:', error);
    return [];
  }
};

// Get user's music
export const getUserMusic = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user music:', error);
    return [];
  }
};

// Search music
export const searchMusic = async (searchTerm, limit = 20) => {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return getAllMusic();
    }

    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%,album.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching music:', error);
    return [];
  }
};

// Get music by genre
export const getMusicByGenre = async (genre) => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .ilike('genre', `%${genre}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting music by genre:', error);
    return [];
  }
};

// Get artist's tracks
export const getArtistTopTracks = async (artistName) => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .ilike('artist', `%${artistName}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting artist tracks:', error);
    return [];
  }
};

// Get trending music (most recent)
export const getTrendingMusic = async (limit = 15) => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting trending music:', error);
    return [];
  }
};

// Delete music
export const deleteMusic = async (musicId, audioPath, albumArtPath, lyricsPath) => {
  try {
    // Delete files from Storage
    if (audioPath) {
      await deleteFile(BUCKETS.MUSIC, audioPath);
    }
    if (albumArtPath) {
      await deleteFile(BUCKETS.ALBUM_ART, albumArtPath);
    }
    if (lyricsPath) {
      await deleteFile(BUCKETS.LYRICS, lyricsPath);
    }

    // Delete from database
    const { error } = await supabase
      .from('music_library')
      .delete()
      .eq('id', musicId);

    if (error) throw error;
    
    console.log('🗑️ Music deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting music:', error);
    throw error;
  }
};

// Update music metadata
export const updateMusic = async (musicId, updates) => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', musicId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Music updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating music:', error);
    throw error;
  }
};

// Get single music by ID
export const getMusicById = async (musicId) => {
  try {
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .eq('id', musicId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting music:', error);
    return null;
  }
};

// Utility functions
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

export const isValidAudioFile = (file) => {
  const validTypes = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension) && file.type.startsWith('audio/');
};

export const isValidImageFile = (file) => {
  const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension) && file.type.startsWith('image/');
};

export const isValidLyricsFile = (file) => {
  const validTypes = ['lrc', 'txt', 'json'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension);
};

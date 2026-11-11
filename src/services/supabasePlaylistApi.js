// Playlist Service - 100% Supabase
import { supabase } from '../config/supabase';

// Create new playlist
export const createPlaylist = async (userId, playlistData) => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name: playlistData.name,
        description: playlistData.description || null,
        cover_image: playlistData.coverImage || null,
        is_public: playlistData.isPublic || false,
        track_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Playlist created:', data);
    return data;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

// Get user's playlists
export const getUserPlaylists = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_tracks(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      trackCount: row.playlist_tracks?.[0]?.count ?? row.track_count ?? 0
    }));
  } catch (error) {
    console.error('Error getting playlists:', error);
    return [];
  }
};

// Get all public playlists
export const getPublicPlaylists = async () => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting public playlists:', error);
    return [];
  }
};

// Update playlist
export const updatePlaylist = async (playlistId, updates) => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', playlistId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Playlist updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

// Delete playlist
export const deletePlaylist = async (playlistId) => {
  try {
    // First delete all tracks in playlist
    await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId);

    // Then delete the playlist
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;
    console.log('✅ Playlist deleted');
    return true;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};

// Add track to playlist
export const addTrackToPlaylist = async (playlistId, musicId) => {
  try {
    // Get current track count
    const { data: playlist } = await supabase
      .from('playlists')
      .select('track_count')
      .eq('id', playlistId)
      .single();

    const position = (playlist?.track_count || 0) + 1;

    // Add track
    const { data, error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        music_id: musicId,
        position: position,
        added_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update playlist track count
    await supabase
      .from('playlists')
      .update({
        track_count: position,
        updated_at: new Date().toISOString()
      })
      .eq('id', playlistId);

    console.log('✅ Track added to playlist');
    return data;
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    throw error;
  }
};

// Remove track from playlist
export const removeTrackFromPlaylist = async (playlistId, musicId) => {
  try {
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('music_id', musicId);

    if (error) throw error;

    // Update track count
    const { data: tracks } = await supabase
      .from('playlist_tracks')
      .select('id')
      .eq('playlist_id', playlistId);

    await supabase
      .from('playlists')
      .update({
        track_count: tracks?.length || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', playlistId);

    console.log('✅ Track removed from playlist');
    return true;
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    throw error;
  }
};

// Get playlist with tracks
export const getPlaylistWithTracks = async (playlistId) => {
  try {
    // Get playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (playlistError) throw playlistError;

    // Get tracks
    const { data: playlistTracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        *,
        music:music_library(*)
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (tracksError) throw tracksError;

    return {
      ...playlist,
      tracks: playlistTracks?.map(pt => pt.music) || []
    };
  } catch (error) {
    console.error('Error getting playlist with tracks:', error);
    throw error;
  }
};

// Reorder tracks in playlist
export const reorderPlaylistTracks = async (playlistId, trackIds) => {
  try {
    // Update positions
    const updates = trackIds.map((musicId, index) => ({
      playlist_id: playlistId,
      music_id: musicId,
      position: index + 1
    }));

    // Delete existing tracks
    await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId);

    // Insert with new positions
    const { error } = await supabase
      .from('playlist_tracks')
      .insert(updates);

    if (error) throw error;

    console.log('✅ Playlist tracks reordered');
    return true;
  } catch (error) {
    console.error('Error reordering tracks:', error);
    throw error;
  }
};

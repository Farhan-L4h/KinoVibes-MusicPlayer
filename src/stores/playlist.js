import { create } from 'zustand';
import { supabase } from '../config/supabase';
import {
  createPlaylist as createPlaylistApi,
  getUserPlaylists,
  updatePlaylist as updatePlaylistApi,
  deletePlaylist as deletePlaylistApi,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getPlaylistWithTracks
} from '../services/supabasePlaylistApi';

const usePlaylistStore = create((set, get) => ({
  playlists: [],
  loading: false,
  error: null,

  // Create a new playlist
  createPlaylist: async (userId, playlistData) => {
    try {
      set({ loading: true, error: null });
      
      const newPlaylist = await createPlaylistApi(userId, playlistData);
      
      set(state => ({
        playlists: [newPlaylist, ...state.playlists],
        loading: false
      }));

      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update playlist
  updatePlaylist: async (playlistId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const updatedPlaylist = await updatePlaylistApi(playlistId, updates);

      set(state => ({
        playlists: state.playlists.map(playlist =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating playlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete playlist
  deletePlaylist: async (playlistId) => {
    try {
      set({ loading: true, error: null });
      
      await deletePlaylistApi(playlistId);
      
      set(state => ({
        playlists: state.playlists.filter(playlist => playlist.id !== playlistId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting playlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add song to playlist
  addSongToPlaylist: async (playlistId, musicId) => {
    try {
      set({ loading: true, error: null });
      
      await addTrackToPlaylist(playlistId, musicId);
      
      // Reload playlist to get updated track count
      const playlist = await getPlaylistWithTracks(playlistId);
      
      set(state => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId ? playlist : p
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Remove song from playlist
  removeSongFromPlaylist: async (playlistId, musicId) => {
    try {
      set({ loading: true, error: null });
      
      await removeTrackFromPlaylist(playlistId, musicId);
      
      // Reload playlist to get updated track count
      const playlist = await getPlaylistWithTracks(playlistId);
      
      set(state => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId ? playlist : p
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Load user's playlists
  loadUserPlaylists: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const playlists = await getUserPlaylists(userId);

      set({ playlists, loading: false });
      return playlists;
    } catch (error) {
      console.error('Error loading playlists:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Subscribe to user's playlists (Supabase Realtime)
  subscribeToUserPlaylists: (userId) => {
    const channel = supabase
      .channel('playlists-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlists',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Playlist changed:', payload);
          // Reload playlists
          const playlists = await getUserPlaylists(userId);
          set({ playlists });
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get playlist by ID
  getPlaylistById: (playlistId) => {
    return get().playlists.find(playlist => playlist.id === playlistId);
  },

  // Clear playlists (for logout)
  clearPlaylists: () => {
    set({ playlists: [], loading: false, error: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export { usePlaylistStore };
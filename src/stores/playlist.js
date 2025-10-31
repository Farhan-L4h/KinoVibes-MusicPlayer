import { create } from 'zustand';
// TODO: Migrate to Supabase PostgreSQL
// import { supabase } from '../config/supabase';

const usePlaylistStore = create((set, get) => ({
  playlists: [],
  loading: false,
  error: null,

  // Create a new playlist (TODO: Migrate to Supabase)
  createPlaylist: async (userId, playlistData) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    set({ loading: false, error: 'Playlist feature coming soon' });
    throw new Error('Playlist feature not yet migrated to Supabase');
  },

  // Update playlist (TODO: Migrate to Supabase)
  updatePlaylist: async (playlistId, updates) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    set({ loading: false });
  },

  // Delete playlist (TODO: Migrate to Supabase)
  deletePlaylist: async (playlistId) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    set({ loading: false });
  },

  // Add song to playlist (TODO: Migrate to Supabase)
  addSongToPlaylist: async (playlistId, song) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    set({ loading: false });
  },

  // Remove song from playlist (TODO: Migrate to Supabase)
  removeSongFromPlaylist: async (playlistId, songId) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    set({ loading: false });
  },

  // Load user's playlists (TODO: Migrate to Supabase)
  loadUserPlaylists: async (userId) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    set({ playlists: [], loading: false });
    return [];
  },

  // Subscribe to user's playlists (TODO: Migrate to Supabase)
  subscribeToUserPlaylists: (userId) => {
    console.warn('Playlist feature not yet migrated to Supabase');
    return () => {}; // Return empty unsubscribe function
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
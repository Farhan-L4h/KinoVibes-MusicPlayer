import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const usePlaylistStore = create((set, get) => ({
  playlists: [],
  loading: false,
  error: null,

  // Create a new playlist
  createPlaylist: async (userId, playlistData) => {
    try {
      set({ loading: true, error: null });
      
      const playlistDoc = {
        ...playlistData,
        userId,
        songs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'playlists'), playlistDoc);
      
      const newPlaylist = {
        id: docRef.id,
        ...playlistDoc
      };

      set(state => ({
        playlists: [...state.playlists, newPlaylist],
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
      
      const playlistRef = doc(db, 'playlists', playlistId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(playlistRef, updateData);

      set(state => ({
        playlists: state.playlists.map(playlist =>
          playlist.id === playlistId
            ? { ...playlist, ...updateData }
            : playlist
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
      
      await deleteDoc(doc(db, 'playlists', playlistId));
      
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
  addSongToPlaylist: async (playlistId, song) => {
    try {
      set({ loading: true, error: null });
      
      const playlist = get().playlists.find(p => p.id === playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check if song already exists in playlist
      const songExists = playlist.songs.some(s => s.id === song.id);
      if (songExists) {
        throw new Error('Song already exists in playlist');
      }

      const updatedSongs = [...playlist.songs, song];
      
      const playlistRef = doc(db, 'playlists', playlistId);
      await updateDoc(playlistRef, {
        songs: updatedSongs,
        updatedAt: new Date()
      });

      set(state => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId
            ? { ...p, songs: updatedSongs, updatedAt: new Date() }
            : p
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
  removeSongFromPlaylist: async (playlistId, songId) => {
    try {
      set({ loading: true, error: null });
      
      const playlist = get().playlists.find(p => p.id === playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      const updatedSongs = playlist.songs.filter(song => song.id !== songId);
      
      const playlistRef = doc(db, 'playlists', playlistId);
      await updateDoc(playlistRef, {
        songs: updatedSongs,
        updatedAt: new Date()
      });

      set(state => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId
            ? { ...p, songs: updatedSongs, updatedAt: new Date() }
            : p
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
      
      const playlistsQuery = query(
        collection(db, 'playlists'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(playlistsQuery);
      const playlists = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      set({ playlists, loading: false });
      return playlists;
    } catch (error) {
      console.error('Error loading playlists:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Subscribe to user's playlists (real-time updates)
  subscribeToUserPlaylists: (userId) => {
    const playlistsQuery = query(
      collection(db, 'playlists'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(playlistsQuery, (snapshot) => {
      const playlists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      set({ playlists, loading: false });
    }, (error) => {
      console.error('Error in playlist subscription:', error);
      set({ error: error.message, loading: false });
    });
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
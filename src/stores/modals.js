import { create } from 'zustand';

const useModalStore = create((set) => ({
  addToPlaylistTrack: null,
  openAddToPlaylist: (track) => set({ addToPlaylistTrack: track }),
  closeAddToPlaylist: () => set({ addToPlaylistTrack: null }),
}));

export { useModalStore };
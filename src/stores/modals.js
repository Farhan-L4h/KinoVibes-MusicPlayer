import { create } from 'zustand';

const useModalStore = create((set) => ({
  addToPlaylistTrack: null,
  openAddToPlaylist: (track) => set({ addToPlaylistTrack: track }),
  closeAddToPlaylist: () => set({ addToPlaylistTrack: null }),
  editTrack: null,
  openEditTrack: (track) => set({ editTrack: track }),
  closeEditTrack: () => set({ editTrack: null }),
}));

export { useModalStore };
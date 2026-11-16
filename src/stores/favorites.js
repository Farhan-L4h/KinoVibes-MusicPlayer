import { create } from 'zustand';
import { addToFavorites, removeFromFavorites, getUserFavorites } from '../services/supabaseFavoritesApi';
import { ensureYouTubeTrack, transformMusicData } from '../services/supabaseMusicApi';
import { ensureSpotifyTrack } from '../services/spotifyApi';

const useFavoritesStore = create((set, get) => ({
  tracks: [],
  ids: new Set(),
  videoIds: new Set(),
  spotifyIds: new Set(),
  loading: false,
  loadedFor: null,

  load: async (userId, { force = false } = {}) => {
    if (!userId) return;
    if (get().loadedFor === userId && !force) return;
    set({ loading: true });
    try {
      const rows = await getUserFavorites(userId);
      const tracks = rows.map(transformMusicData).filter(Boolean);
      set({
        tracks,
        ids: new Set(tracks.map((t) => t.id)),
        videoIds: new Set(tracks.map((t) => t.videoId).filter(Boolean)),
        spotifyIds: new Set(tracks.map((t) => t.spotifyId).filter(Boolean)),
        loading: false,
        loadedFor: userId,
      });
    } catch {
      set({ loading: false });
    }
  },

  isFavorite: (track) => {
    if (!track) return false;
    const { ids, videoIds, spotifyIds } = get();
    return ids.has(track.id) || (!!track.videoId && videoIds.has(track.videoId)) || (!!track.spotifyId && spotifyIds.has(track.spotifyId));
  },

  toggle: async (track, userId) => {
    if (!track || !userId) return false;
    let resolved = track;
    if (track.source === 'youtube' && String(track.id).startsWith('yt:')) {
      resolved = await ensureYouTubeTrack(track, userId);
    } else if (track.source === 'spotify' && String(track.id).startsWith('sp:')) {
      resolved = await ensureSpotifyTrack(track, userId);
    }
    const wasFav = get().ids.has(resolved.id);
    if (wasFav) {
      await removeFromFavorites(userId, resolved.id);
    } else {
      await addToFavorites(userId, resolved.id);
    }
    set((state) => {
      const ids = new Set(state.ids);
      const videoIds = new Set(state.videoIds);
      const spotifyIds = new Set(state.spotifyIds);
      let tracks;
      if (wasFav) {
        ids.delete(resolved.id);
        if (resolved.videoId) videoIds.delete(resolved.videoId);
        if (resolved.spotifyId) spotifyIds.delete(resolved.spotifyId);
        tracks = state.tracks.filter((t) => t.id !== resolved.id);
      } else {
        ids.add(resolved.id);
        if (resolved.videoId) videoIds.add(resolved.videoId);
        if (resolved.spotifyId) spotifyIds.add(resolved.spotifyId);
        tracks = [resolved, ...state.tracks];
      }
      return { ids, videoIds, spotifyIds, tracks };
    });
    return !wasFav;
  },

  clear: () => set({ tracks: [], ids: new Set(), videoIds: new Set(), spotifyIds: new Set(), loadedFor: null }),
}));

export { useFavoritesStore };
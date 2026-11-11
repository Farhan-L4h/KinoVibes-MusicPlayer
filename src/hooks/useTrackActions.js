import { useAuthStore } from '../stores/auth';
import { useMusicStore } from '../stores/music';
import { useFavoritesStore } from '../stores/favorites';
import { useModalStore } from '../stores/modals';
import { downloadTrack, deleteMusic } from '../services/supabaseMusicApi';
import { toast } from '../stores/toast';

export const useTrackActions = () => {
  const user = useAuthStore((s) => s.user);
  const playTrack = useMusicStore((s) => s.playTrack);
  const addToQueue = useMusicStore((s) => s.addToQueue);
  const playNext = useMusicStore((s) => s.playNext);
  const openAddToPlaylist = useModalStore((s) => s.openAddToPlaylist);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const play = (track, list) => {
    if (!track) return;
    playTrack(track, list && list.length > 0 ? list : [track]);
  };

  const playAll = (tracks) => {
    if (!tracks?.length) return;
    playTrack(tracks[0], tracks);
  };

  const shuffleAll = (tracks) => {
    if (!tracks?.length) return;
    const state = useMusicStore.getState();
    if (!state.shuffle) state.toggleShuffle();
    const start = tracks[Math.floor(Math.random() * tracks.length)];
    playTrack(start, tracks);
  };

  const toggleLike = async (track) => {
    if (!user || !track) return;
    try {
      const nowFav = await toggleFavorite(track, user.id);
      toast.success(nowFav ? 'Ditambahkan ke Favorit' : 'Dihapus dari Favorit');
    } catch (err) {
      console.error('toggleLike error:', err);
      toast.error('Gagal memperbarui favorit');
    }
  };

  const download = async (track) => {
    try {
      toast.info('Menyiapkan unduhan…');
      await downloadTrack(track);
      toast.success('Unduhan dimulai');
    } catch (err) {
      toast.error(err.message || 'Gagal mengunduh lagu');
    }
  };

  const remove = async (track) => {
    try {
      await deleteMusic(track);
      const music = useMusicStore.getState();
      if (music.currentTrack?.id === track.id) music.stopAndClear();
      toast.success('Lagu dihapus');
      return true;
    } catch (err) {
      console.error('delete error:', err);
      toast.error('Gagal menghapus lagu');
      return false;
    }
  };

  return {
    play,
    playAll,
    shuffleAll,
    toggleLike,
    addToQueue,
    playNext,
    openAddToPlaylist,
    download,
    remove,
  };
};
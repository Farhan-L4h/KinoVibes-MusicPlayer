import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { useMusicStore } from '../../stores/music';
import { useFavoritesStore } from '../../stores/favorites';
import { usePlaylistStore } from '../../stores/playlist';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import MiniPlayer from '../player/MiniPlayer';
import NowPlaying from '../player/NowPlaying';
import VideoDock from '../player/VideoDock';
import AddToPlaylistModal from '../AddToPlaylistModal';
import PageTransition from '../PageTransition';
import Toaster from '../ui/Toaster';

const Layout = () => {
  const user = useAuthStore((s) => s.user);
  const hasTrack = useMusicStore((s) => !!s.currentTrack);
  useKeyboardShortcuts();

  useEffect(() => {
    useMusicStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    useFavoritesStore.getState().load(user.id);
    usePlaylistStore.getState().loadUserPlaylists(user.id).catch(() => {});
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-kv-bg font-body text-kv-ink">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-kv-sidebar">
        <TopBar />
        <main
          className="flex-1 px-4 pt-5 sm:px-6 lg:px-8"
          style={{
            paddingBottom: hasTrack
              ? 'calc(var(--kv-miniplayer-h) + var(--kv-bottomnav-h) + 24px)'
              : 'calc(var(--kv-bottomnav-h) + 24px)',
          }}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <MiniPlayer />
      <MobileNav />
      <NowPlaying />
      <VideoDock />
      <AddToPlaylistModal />
      <Toaster />
    </div>
  );
};

export default Layout;
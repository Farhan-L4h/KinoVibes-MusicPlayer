import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { useMusicStore } from '../../stores/music';
import { useFavoritesStore } from '../../stores/favorites';
import { usePlaylistStore } from '../../stores/playlist';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import MiniPlayer from '../player/MiniPlayer';
const NowPlaying = lazy(() => import('../player/NowPlaying'));
import VideoDock from '../player/VideoDock';
import VideoDeckCard from '../player/VideoDeckCard';
import AddToPlaylistModal from '../AddToPlaylistModal';
import PageTransition from '../PageTransition';
import Toaster from '../ui/Toaster';
import GlobalAmbient from '../GlobalAmbient';

const Layout = () => {
  const user = useAuthStore((s) => s.user);
  const nowPlayingOpen = useMusicStore((s) => s.nowPlayingOpen);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const { pathname } = useLocation();
  const showDeckCard = currentTrack?.source === 'youtube' && !nowPlayingOpen && pathname !== '/';
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
    <div className="kv-canvas fixed inset-0 flex p-0 sm:p-4 lg:p-6">
      <GlobalAmbient />
      <div className="kv-panel relative flex min-h-0 w-full flex-col overflow-hidden sm:rounded-kv-panel" inert={nowPlayingOpen}>
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="kv-scroll min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 sm:px-7 sm:pt-3">
            {showDeckCard && <VideoDeckCard />}
            <PageTransition>
              <Suspense fallback={<p role="status" className="py-12 text-center">Memuat halaman…</p>}><Outlet /></Suspense>
            </PageTransition>
          </main>
        </div>
        <MiniPlayer />
        <MobileNav />
      </div>
      {nowPlayingOpen && <Suspense fallback={<div role="status" className="fixed inset-x-4 bottom-24 z-50 rounded-kv bg-kv-surface p-4">Memuat pemutar…</div>}><NowPlaying /></Suspense>}
      <VideoDock />
      <AddToPlaylistModal />
      <Toaster />
    </div>
  );
};

export default Layout;
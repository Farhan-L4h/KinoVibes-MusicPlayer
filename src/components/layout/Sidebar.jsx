import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Mic2,
  ListMusic,
  Heart,
  Upload,
  LogOut,
  Plus,
  Music2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { usePlaylistStore } from '../../stores/playlist';
import { useMusicStore } from '../../stores/music';
import { useFavoritesStore } from '../../stores/favorites';
import { signOut } from '../../services/supabaseAuth';
import { initials, cn } from '../../lib/utils';
import { toast } from '../../stores/toast';

const NAV = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/search', label: 'Cari', icon: Search },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/lyrics', label: 'Lirik', icon: Mic2 },
  { to: '/favorites', label: 'Favorit', icon: Heart },
  { to: '/playlists', label: 'Playlist', icon: ListMusic },
  { to: '/upload', label: 'Upload', icon: Upload },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { playlists } = usePlaylistStore();
  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  const handleLogout = async () => {
    try {
      useMusicStore.getState().stopAndClear();
      useFavoritesStore.getState().clear();
      usePlaylistStore.getState().clearPlaylists();
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Gagal keluar. Coba lagi.');
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-kv-sidebar flex-col border-r-3 border-kv-ink bg-kv-surface lg:flex">
      <Link to="/" className="flex items-center gap-3 border-b-3 border-kv-ink bg-kv-yellow px-4 py-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-pink shadow-kv">
          <Music2 size={22} className="text-[#0a0a0a]" />
        </span>
        <span>
          <span className="block font-display text-xl uppercase leading-none tracking-tight text-[#0a0a0a]">
            KinoVibe
          </span>
          <span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a0a0a]/70">
            Music Player
          </span>
        </span>
      </Link>

      <nav className="space-y-1.5 p-3" aria-label="Navigasi utama">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] items-center gap-3 rounded-kv border-3 px-3 py-2 font-bold transition-colors duration-150',
                isActive
                  ? 'border-kv-ink bg-kv-yellow text-[#0a0a0a] shadow-kv'
                  : 'border-transparent text-kv-ink hover:border-kv-ink hover:bg-kv-muted'
              )
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-1 flex min-h-0 flex-1 flex-col border-t-3 border-kv-ink">
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-kv-ink-muted">
            Playlist kamu
          </span>
          <Link
            to="/playlists"
            aria-label="Buat playlist baru"
            title="Buat playlist baru"
            className="flex h-7 w-7 items-center justify-center rounded border-2 border-kv-ink bg-kv-green hover:bg-kv-yellow"
          >
            <Plus size={14} className="text-[#0a0a0a]" />
          </Link>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {playlists.length === 0 && (
            <p className="px-1 py-2 text-xs text-kv-ink-muted">Belum ada playlist.</p>
          )}
          {playlists.map((p) => (
            <NavLink
              key={p.id}
              to={`/playlists/${p.id}`}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[40px] items-center gap-2.5 rounded-kv border-2 px-2.5 py-1.5 text-sm font-semibold',
                  isActive
                    ? 'border-kv-ink bg-kv-purple text-[#0a0a0a] shadow-kv'
                    : 'border-transparent text-kv-ink hover:border-kv-ink hover:bg-kv-muted'
                )
              }
            >
              <ListMusic size={15} className="shrink-0" />
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t-3 border-kv-ink bg-kv-muted p-3">
        <Link
          to="/profile"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-kv border-2 border-transparent px-1 py-1 hover:border-kv-ink"
          aria-label="Buka profil"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-blue font-display text-sm text-[#0a0a0a]">
            {initials(displayName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{displayName}</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-kv-ink-muted">Profil</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar"
          title="Keluar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-surface shadow-kv hover:bg-kv-red hover:text-white"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
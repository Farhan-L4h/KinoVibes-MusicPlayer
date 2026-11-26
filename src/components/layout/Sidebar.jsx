import { NavLink, Link } from 'react-router-dom';
import { Home, Search, Music2, Heart, ListMusic, Mic2, UploadCloud, ShieldCheck, Settings } from 'lucide-react';
import { useAuthStore, selectIsAdmin } from '../../stores/auth';
import { initials, cn } from '../../lib/utils';

const NAV = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/search', label: 'Cari', icon: Search },
  { to: '/library', label: 'Library', icon: Music2 },
  { to: '/favorites', label: 'Favorit', icon: Heart },
  { to: '/playlists', label: 'Playlist', icon: ListMusic },
  { to: '/lyrics', label: 'Lirik', icon: Mic2 },
];

const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore(selectIsAdmin);
  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  const items = isAdmin
    ? [...NAV, { to: '/upload', label: 'Upload', icon: UploadCloud }, { to: '/admin', label: 'Admin', icon: ShieldCheck }]
    : NAV;

  return (
    <aside
      className="hidden w-kv-rail shrink-0 flex-col items-center gap-1.5 border-r border-kv-line py-5 lg:flex"
      aria-label="Navigasi utama"
    >
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          aria-label={label}
          className={({ isActive }) =>
            cn(
              'kv-press flex h-11 w-11 items-center justify-center rounded-full',
              isActive
                ? 'bg-kv-ink text-kv-panel shadow-kv'
                : 'text-kv-ink-muted hover:bg-kv-muted hover:text-kv-ink'
            )
          }
        >
          <Icon size={19} strokeWidth={2.2} />
        </NavLink>
      ))}

      <NavLink
        to="/settings"
        title="Pengaturan"
        aria-label="Pengaturan"
        className={({ isActive }) =>
          cn(
            'kv-press mt-auto flex h-11 w-11 items-center justify-center rounded-full',
            isActive
              ? 'bg-kv-ink text-kv-panel shadow-kv'
              : 'text-kv-ink-muted hover:bg-kv-muted hover:text-kv-ink'
          )
        }
      >
        <Settings size={19} strokeWidth={2.2} />
      </NavLink>

      <Link
        to="/profile"
        title="Profil"
        aria-label="Buka profil"
        className="kv-press flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-kv-line-strong bg-kv-surface font-display text-xs text-kv-ink hover:bg-kv-muted"
      >
        {initials(displayName)}
      </Link>
    </aside>
  );
};

export default Sidebar;

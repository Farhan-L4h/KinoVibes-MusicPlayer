import { NavLink } from 'react-router-dom';
import { Home, Search, Music2, Heart, ListMusic } from 'lucide-react';
import { cn } from '../../lib/utils';

const ITEMS = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/search', label: 'Cari', icon: Search },
  { to: '/library', label: 'Library', icon: Music2 },
  { to: '/favorites', label: 'Favorit', icon: Heart },
  { to: '/playlists', label: 'Playlist', icon: ListMusic },
];

const MobileNav = () => (
  <nav
    className="flex shrink-0 items-stretch border-t border-kv-line bg-kv-panel lg:hidden"
    style={{
      minHeight: 'calc(var(--kv-bottomnav-h) + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}
    aria-label="Navigasi bawah"
  >
    {ITEMS.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors',
            isActive ? 'text-kv-ink' : 'text-kv-ink-muted'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={19} strokeWidth={isActive ? 2.6 : 2} />
            {label}
            <span
              className={cn('h-1 w-1 rounded-full', isActive ? 'bg-kv-ink' : 'bg-transparent')}
              aria-hidden="true"
            />
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default MobileNav;
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Heart, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const ITEMS = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/search', label: 'Cari', icon: Search },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/favorites', label: 'Favorit', icon: Heart },
  { to: '/profile', label: 'Profil', icon: User },
];

const MobileNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-40 flex h-kv-bottomnav items-stretch border-t-3 border-kv-ink bg-kv-surface lg:hidden"
    aria-label="Navigasi bawah"
  >
    {ITEMS.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 border-r-2 border-kv-ink/20 font-mono text-[9px] font-bold uppercase tracking-wider last:border-r-0',
            isActive ? 'bg-kv-yellow text-[#0a0a0a]' : 'text-kv-ink-muted'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
            {label}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default MobileNav;
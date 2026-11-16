import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { initials } from '../../lib/utils';
import ThemeToggle from './ThemeToggle';
import QuickSearch from './QuickSearch';

const TopBar = () => {
  const user = useAuthStore((s) => s.user);
  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  return (
    <header className="flex shrink-0 items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
      <Link
        to="/"
        className="font-display text-base font-bold tracking-tight text-kv-ink sm:text-lg"
        aria-label="KinoVibe beranda"
      >
        KINOVIBE
      </Link>

      <QuickSearch />

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Link
          to="/profile"
          aria-label="Buka profil"
          title="Profil"
          className="kv-press flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-kv-line-strong bg-kv-ink font-display text-xs text-kv-panel lg:hidden"
        >
          {initials(displayName)}
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
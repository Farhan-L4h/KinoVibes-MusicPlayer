import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { initials } from '../../lib/utils';
import ThemeToggle from './ThemeToggle';

const TopBar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  return (
    <header className="flex shrink-0 items-center gap-3 px-4 py-4 sm:px-6">
      <Link
        to="/"
        className="font-display text-base font-bold tracking-tight text-kv-ink sm:text-lg"
        aria-label="KinoVibe beranda"
      >
        KINOVIBE
      </Link>

      <button
        type="button"
        onClick={() => navigate('/search')}
        className="kv-press ml-1 hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-full border-[1.5px] border-kv-line-strong bg-kv-surface px-4 text-left text-kv-ink-muted sm:flex"
      >
        <Search size={15} />
        <span className="flex-1 truncate font-mono text-xs">Cari lagu, artis…</span>
        <kbd className="rounded border border-kv-line px-1.5 font-mono text-[10px] font-bold">/</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigate('/search')}
          aria-label="Cari lagu"
          className="kv-press flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-kv-line bg-kv-surface text-kv-ink hover:bg-kv-muted sm:hidden"
        >
          <Search size={17} />
        </button>
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
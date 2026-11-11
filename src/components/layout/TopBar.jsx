import { Link, useNavigate } from 'react-router-dom';
import { Search, Music2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { initials } from '../../lib/utils';
import ThemeToggle from './ThemeToggle';

const TopBar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  return (
    <header className="sticky top-0 z-30 border-b-3 border-kv-ink bg-kv-bg/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="KinoVibe beranda">
          <span className="flex h-9 w-9 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-yellow shadow-kv">
            <Music2 size={17} className="text-[#0a0a0a]" />
          </span>
          <span className="font-display text-lg uppercase tracking-tight">KinoVibe</span>
        </Link>

        <button
          type="button"
          onClick={() => navigate('/search')}
          className="hidden h-11 max-w-md flex-1 items-center gap-2.5 rounded-kv border-3 border-kv-ink bg-kv-surface px-3 text-left text-kv-ink-muted shadow-kv transition-colors hover:bg-kv-muted lg:flex"
        >
          <Search size={17} />
          <span className="flex-1 text-sm font-semibold">Cari lagu di YouTube Music atau library kamu…</span>
          <kbd className="rounded border-2 border-kv-ink bg-kv-muted px-1.5 font-mono text-xs font-bold">/</kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/search')}
            aria-label="Cari lagu"
            className="kv-press flex h-11 w-11 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-surface shadow-kv lg:hidden"
          >
            <Search size={18} />
          </button>
          <ThemeToggle />
          <Link
            to="/profile"
            aria-label="Buka profil"
            className="flex h-11 w-11 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-blue font-display text-sm text-[#0a0a0a] shadow-kv lg:hidden"
          >
            {initials(displayName)}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
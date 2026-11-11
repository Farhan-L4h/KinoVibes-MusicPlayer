import { Link } from 'react-router-dom';
import { Home, Music2 } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => (
  <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
    <span className="flex h-20 w-20 -rotate-3 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-pink shadow-kv-lg">
      <Music2 size={36} className="text-[#0a0a0a]" />
    </span>
    <h1 className="mt-6 font-display text-7xl uppercase">404</h1>
    <p className="mt-2 font-display text-lg uppercase">Halaman tidak ditemukan</p>
    <p className="mt-2 text-sm text-kv-ink-muted">
      Lagu ini mungkin sudah pindah kunci. Balik ke beranda dan lanjut dengar.
    </p>
    <Link to="/" className="mt-6">
      <Button><Home size={17} /> Ke beranda</Button>
    </Link>
  </div>
);

export default NotFound;
import { Link } from 'react-router-dom';
import { Home, Music2 } from 'lucide-react';

const NotFound = () => (
  <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
    <span className="flex h-20 w-20 items-center justify-center rounded-full border border-kv-line bg-kv-muted"><Music2 size={32} className="text-kv-ink-muted" /></span>
    <h1 className="mt-6 font-display text-5xl">404</h1>
    <p className="mt-4 font-display text-base leading-relaxed">Halaman tidak ditemukan</p>
    <p className="mt-2 text-sm text-kv-ink-muted">Kembali ke beranda untuk melanjutkan musikmu.</p>
    <Link to="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-kv-ink px-5 py-2 text-sm font-semibold text-kv-panel hover:opacity-80"><Home size={17} /> Ke beranda</Link>
  </div>
);

export default NotFound;

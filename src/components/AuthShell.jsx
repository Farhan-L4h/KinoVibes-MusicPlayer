import { Link } from 'react-router-dom';
import { Music2, Mic2, Youtube, Upload, Heart } from 'lucide-react';
import Toaster from './ui/Toaster';
import GlobalAmbient from './GlobalAmbient';

const FEATURES = [
  { icon: Youtube, text: 'Streaming dari YouTube Music' },
  { icon: Mic2, text: 'Lirik tersinkron realtime' },
  { icon: Upload, text: 'Upload lagu & unduh kapan saja' },
  { icon: Heart, text: 'Favorit, playlist, dan album' },
];

const AuthShell = ({ children }) => (
  <div className="relative min-h-screen bg-kv-bg p-3 font-body text-kv-ink sm:p-6">
    <GlobalAmbient />
    <div className="relative mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl overflow-hidden rounded-kv-lg bg-kv-panel lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-kv-line p-10 lg:flex">
        <Link to="/" className="flex min-h-11 items-center gap-3 self-start" aria-label="KinoVibe, beranda">
          <Music2 size={26} aria-hidden="true" />
          <span className="font-display text-xl">KinoVibe</span>
        </Link>
        <div className="py-12">
          <p className="mb-4 font-mono text-xs text-kv-ink-muted">Ruang untuk musikmu</p>
          <h1 className="font-display text-3xl leading-relaxed xl:text-4xl">Putar.<br />Rasakan.<br />Ulangi.</h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-kv-ink-muted">Koleksi pribadi dan YouTube Music dalam satu pemutar, dengan lirik yang mengikuti lagumu.</p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm"><Icon size={17} className="shrink-0 text-kv-ink-muted" aria-hidden="true" />{text}</li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-xs text-kv-ink-muted">KinoVibe · Music Player</p>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Link to="/" className="mb-8 flex min-h-11 items-center gap-2.5 lg:hidden" aria-label="KinoVibe, beranda"><Music2 size={24} /><span className="font-display text-xl">KinoVibe</span></Link>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 font-mono text-[11px] text-kv-ink-muted lg:hidden">KinoVibe · Music Player</p>
        <Toaster />
      </div>
    </div>
  </div>
);

export default AuthShell;

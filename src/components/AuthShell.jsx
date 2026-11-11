import { Link } from 'react-router-dom';
import { Music2, Mic2, Youtube, Upload, Heart } from 'lucide-react';
import Marquee from './ui/Marquee';
import Toaster from './ui/Toaster';

const FEATURES = [
  { icon: Youtube, text: 'Streaming dari YouTube Music', tone: 'bg-kv-pink' },
  { icon: Mic2, text: 'Lirik tersinkron realtime', tone: 'bg-kv-blue' },
  { icon: Upload, text: 'Upload lagu & unduh kapan saja', tone: 'bg-kv-green' },
  { icon: Heart, text: 'Favorit, playlist, dan album rapi', tone: 'bg-kv-orange' },
];

const AuthShell = ({ children }) => (
  <div className="grid min-h-screen bg-kv-bg font-body text-kv-ink lg:grid-cols-2">
    <div className="kv-dots relative hidden flex-col justify-between border-r-3 border-kv-ink bg-kv-yellow lg:flex">
      <div className="p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-pink shadow-kv-lg">
            <Music2 size={28} className="text-[#0a0a0a]" />
          </span>
          <span className="font-display text-3xl uppercase tracking-tight text-[#0a0a0a]">KinoVibe</span>
        </div>
        <h1 className="mt-14 font-display text-6xl uppercase leading-[0.95] text-[#0a0a0a]">
          Putar.<br />Rasakan.<br />
          <span className="inline-block -rotate-1 border-3 border-kv-ink bg-kv-surface px-3 shadow-kv-lg">
            Ulangi.
          </span>
        </h1>
        <p className="mt-6 max-w-md text-lg font-semibold text-[#0a0a0a]/80">
          Music player pribadi kamu — koleksi upload sendiri plus katalog YouTube Music, dengan lirik yang ikut bernyanyi.
        </p>
        <ul className="mt-8 space-y-3">
          {FEATURES.map(({ icon: Icon, text, tone }) => (
            <li key={text} className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-kv border-3 border-kv-ink ${tone} shadow-kv`}>
                <Icon size={18} className="text-[#0a0a0a]" />
              </span>
              <span className="font-bold text-[#0a0a0a]">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <Marquee items={['Neobrutalism', 'YouTube Music', 'Synced Lyrics', 'KinoVibe']} tone="bg-kv-surface" />
    </div>

    <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
      <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden" aria-label="KinoVibe">
        <span className="flex h-11 w-11 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-yellow shadow-kv">
          <Music2 size={22} className="text-[#0a0a0a]" />
        </span>
        <span className="font-display text-2xl uppercase tracking-tight">KinoVibe</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-kv-ink-muted">
        KinoVibe · Music Player
      </p>
      <Toaster />
    </div>
  </div>
);

export default AuthShell;
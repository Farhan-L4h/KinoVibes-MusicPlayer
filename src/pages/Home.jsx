import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Mic2, ArrowRight, Clock3, Disc3, Youtube, Library as LibraryIcon } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useMusicStore, getRecentTracks } from '../stores/music';
import { getUserMusic } from '../services/supabaseMusicApi';
import { getUserAlbums, buildAlbumList, sortAlbums, getAlbumTracks } from '../services/albumApi';
import { transformMusicData } from '../services/supabaseMusicApi';
import { useTrackActions } from '../hooks/useTrackActions';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';
import AlbumCard from '../components/AlbumCard';
import Marquee from '../components/ui/Marquee';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { TrackRowSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { toast } from '../stores/toast';

const EXPLORE = [
  { q: 'Pop Indonesia terbaru', tone: 'bg-kv-pink' },
  { q: 'Indie lokal', tone: 'bg-kv-blue' },
  { q: 'Lo-fi beats', tone: 'bg-kv-purple' },
  { q: 'K-Pop hit', tone: 'bg-kv-green' },
  { q: 'Rock klasik', tone: 'bg-kv-orange' },
  { q: 'Jazz santai', tone: 'bg-kv-yellow' },
  { q: 'Dangdut koplo', tone: 'bg-kv-pink' },
  { q: 'EDM festival', tone: 'bg-kv-blue' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
};

const SectionHeader = ({ icon: Icon, title, to, linkLabel }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-2.5 font-display text-xl uppercase sm:text-2xl">
      <span className="flex h-9 w-9 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-yellow shadow-kv">
        <Icon size={17} className="text-[#0a0a0a]" />
      </span>
      {title}
    </h2>
    {to && (
      <Link
        to={to}
        className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-kv-ink-muted underline decoration-2 underline-offset-4 hover:text-kv-ink"
      >
        {linkLabel || 'Lihat semua'} <ArrowRight size={13} />
      </Link>
    )}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const actions = useTrackActions();
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [music, albumRows] = await Promise.all([
          getUserMusic(user.id),
          getUserAlbums(user.id).catch(() => []),
        ]);
        if (cancelled) return;
        setTracks(music);
        setAlbums(sortAlbums(buildAlbumList(albumRows, music), 'newest'));
      } catch {
        if (!cancelled) toast.error('Gagal memuat library kamu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const recent = useMemo(() => getRecentTracks(), [currentTrack?.id]);

  const playAlbum = async (album) => {
    try {
      const rows = await getAlbumTracks(user.id, album.name);
      const list = rows.map(transformMusicData).filter((t) => t && t.source !== 'youtube');
      if (list.length === 0) {
        toast.info('Album ini belum punya lagu upload.');
        return;
      }
      actions.playAll(list);
    } catch {
      toast.error('Gagal memutar album');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="kv-card kv-stripes relative overflow-hidden p-5 sm:p-7">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-kv-ink-muted">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-5xl">
          {greeting()},<br />
          <span className="inline-block -rotate-1 border-3 border-kv-ink bg-kv-yellow px-2 text-[#0a0a0a] shadow-kv">
            {displayName}!
          </span>
        </h1>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button size="sm" onClick={() => navigate('/search')}>
            <Search size={16} /> Cari YouTube Music
          </Button>
          <Button size="sm" variant="green" onClick={() => navigate('/upload')}>
            <Upload size={16} /> Upload lagu
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/lyrics')}>
            <Mic2 size={16} /> Lirik
          </Button>
        </div>
      </header>

      {recent.length > 0 && (
        <section>
          <SectionHeader icon={Clock3} title="Baru diputar" />
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
            {recent.map((t) => (
              <TrackCard key={t.id} track={t} onPlay={() => actions.play(t, recent)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader icon={LibraryIcon} title="Lagu kamu" to="/library" />
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <TrackRowSkeleton key={i} />)}
          </div>
        ) : tracks.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="Library masih kosong"
            description="Upload lagu pertamamu, atau cari jutaan lagu langsung dari YouTube Music."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => navigate('/upload')}><Upload size={15} /> Upload</Button>
                <Button size="sm" variant="pink" onClick={() => navigate('/search')}><Youtube size={15} /> Cari YouTube</Button>
              </div>
            }
          />
        ) : (
          <div className="space-y-1.5">
            {tracks.slice(0, 6).map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} list={tracks} />
            ))}
          </div>
        )}
      </section>

      {albums.length > 0 && (
        <section>
          <SectionHeader icon={Disc3} title="Album kamu" to="/library?tab=albums" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {loading
              ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
              : albums.slice(0, 4).map((a, i) => (
                  <AlbumCard
                    key={a.id}
                    album={a}
                    index={i}
                    onClick={() => navigate(`/library?tab=albums&album=${encodeURIComponent(a.name)}`)}
                    onPlay={() => playAlbum(a)}
                  />
                ))}
          </div>
        </section>
      )}

      <Marquee items={['YouTube Music', 'Lirik realtime', 'Upload & unduh', 'Playlist tanpa batas']} />

      <section>
        <SectionHeader icon={Youtube} title="Jelajahi YouTube" />
        <div className="flex flex-wrap gap-2.5">
          {EXPLORE.map(({ q, tone }) => (
            <button
              key={q}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(q)}&src=yt`)}
              className={`kv-press min-h-[44px] rounded-kv border-3 border-kv-ink ${tone} px-4 py-2 font-display text-xs uppercase tracking-wide text-[#0a0a0a] shadow-kv`}
            >
              {q}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
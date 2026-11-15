import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Mic2, ArrowRight, Heart, ListMusic, Library as LibraryIcon } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useMusicStore, getRecentTracks } from '../stores/music';
import { usePlaylistStore } from '../stores/playlist';
import { useFavoritesStore } from '../stores/favorites';
import { getUserMusic, transformMusicData, getTopPlayed } from '../services/supabaseMusicApi';
import { getUserAlbums, buildAlbumList, sortAlbums, getAlbumTracks } from '../services/albumApi';
import { useTrackActions } from '../hooks/useTrackActions';
import { registerVideoSlot, unregisterVideoSlot } from '../player/videoSlot';
import Turntable from '../components/player/Turntable';
import Ambient from '../components/Ambient';
import Transport from '../components/player/Transport';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';
import AlbumCard from '../components/AlbumCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { TrackRowSkeleton } from '../components/ui/Skeleton';
import { toast } from '../stores/toast';

const CATEGORIES = ['Pop Indonesia', 'Indie lokal', 'Lo-fi beats', 'K-Pop', 'Rock klasik', 'Jazz santai', 'Dangdut', 'Electronic'];

const SectionHeader = ({ title, to }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h2 className="font-display text-sm sm:text-base">{title}</h2>
    {to && <Link to={to} className="inline-flex min-h-11 items-center gap-1.5 text-xs text-kv-ink-muted hover:text-kv-ink hover:underline">Lihat semua <ArrowRight size={14} aria-hidden="true" /></Link>}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const nowPlayingOpen = useMusicStore((s) => s.nowPlayingOpen);
  const deckRef = useRef(null);
  const { playlists, loading: playlistsLoading, error: playlistsError, loadUserPlaylists } = usePlaylistStore();
  const favorites = useFavoritesStore((s) => s.tracks);
  const favoritesLoadedFor = useFavoritesStore((s) => s.loadedFor);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();
  const [tracks, setTracks] = useState([]);
  const [topPlayed, setTopPlayed] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [music, albumRows, played] = await Promise.all([
          getUserMusic(user.id),
          getUserAlbums(user.id).catch(() => []),
          getTopPlayed(user.id).catch(() => []),
        ]);
        if (cancelled) return;
        setTracks(music);
        setTopPlayed(played);
        setAlbums(sortAlbums(buildAlbumList(albumRows, music), 'newest'));
      } catch {
        if (!cancelled) setError('Library belum bisa dimuat. Periksa koneksi lalu coba lagi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, retry]);

  const recent = useMemo(() => getRecentTracks(), [currentTrack?.id]);
  const liked = currentTrack && isFavorite(currentTrack);

  useEffect(() => {
    if (currentTrack?.source !== 'youtube' || nowPlayingOpen) return undefined;
    const el = deckRef.current;
    registerVideoSlot(el, 2);
    return () => unregisterVideoSlot(el);
  }, [currentTrack?.source, currentTrack?.id, nowPlayingOpen]);
  const frequent = useMemo(() => topPlayed.slice(0, 8), [topPlayed]);
  const recommendations = useMemo(() => {
    if (!topPlayed.length) return [];
    const seeds = topPlayed.slice(0, 5);
    const artists = new Set(seeds.map((t) => (t.artist || '').toLowerCase()).filter(Boolean));
    const genres = new Set(seeds.map((t) => (t.genre || '').toLowerCase()).filter(Boolean));
    const frequentIds = new Set(topPlayed.map((t) => t.id));
    return tracks
      .filter((t) => t.id !== currentTrack?.id && !frequentIds.has(t.id))
      .map((t) => {
        let score = 0;
        if (artists.has((t.artist || '').toLowerCase())) score += 2;
        if (genres.has((t.genre || '').toLowerCase())) score += 1;
        return { t, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (b.t.playCount || 0) - (a.t.playCount || 0))
      .slice(0, 8)
      .map((x) => x.t);
  }, [topPlayed, tracks, currentTrack?.id]);

  const playAlbum = async (album) => {
    try {
      const rows = await getAlbumTracks(user.id, album.name);
      const list = rows.map(transformMusicData).filter((t) => t && t.source !== 'youtube');
      if (!list.length) { toast.info('Album ini belum punya lagu upload.'); return; }
      actions.playAll(list);
    } catch { toast.error('Gagal memutar album'); }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:gap-8">
        <section className="min-w-0 lg:border-r lg:border-kv-line lg:pr-8" aria-label="Pemutar musik">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs text-kv-ink-muted">Sesi musik {displayName}</p>
            <Link to="/library" className="inline-flex min-h-11 items-center text-xs text-kv-ink-muted hover:text-kv-ink hover:underline">Library kamu</Link>
          </div>
          <div className="relative isolate -m-3 overflow-hidden rounded-kv-lg p-3" inert={!currentTrack} aria-hidden={!currentTrack}>
            <Ambient url={currentTrack?.albumArt} opacity={0.4} />
            <div ref={deckRef} className="relative z-10"><Turntable track={currentTrack} /></div>
          </div>
          {currentTrack ? (
            <div className="mt-6">
              <p className="font-mono text-[11px] text-kv-ink-muted">Pilihan saat ini</p>
              <div className="mt-2 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="break-words font-display text-xl leading-relaxed sm:text-2xl">{currentTrack.title}</h1>
                  <p className="mt-2 break-words text-sm text-kv-ink-muted">{currentTrack.artist}</p>
                </div>
                <button type="button" onClick={() => actions.toggleLike(currentTrack)} aria-label={liked ? 'Hapus dari favorit' : 'Tambah ke favorit'} aria-pressed={!!liked} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-kv-line hover:bg-kv-surface"><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="mt-6"><Transport waveform /></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => actions.openAddToPlaylist(currentTrack)}><ListMusic size={15} /> Ke playlist</Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/lyrics')}><Mic2 size={15} /> Lirik</Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Belum ada lagu dipilih.</h1>
              <p className="max-w-sm text-sm leading-relaxed text-kv-ink-muted">Pilih dari koleksimu atau cari musik untuk mulai mendengarkan.</p>
              <Button onClick={() => navigate('/search')}><Search size={16} /> Cari lagu</Button>
            </div>
          )}
        </section>

        <div className="kv-stagger min-w-0 space-y-6">
          <section>
            <p className="mb-3 font-mono text-xs text-kv-ink-muted">Music Categories</p>
            <h2 className="font-display text-xl leading-relaxed sm:text-2xl">Musik untuk<br className="hidden sm:block" /> suasana hari ini.</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {CATEGORIES.map((q) => <Link key={q} to={`/search?q=${encodeURIComponent(q)}&src=yt`} className="inline-flex min-h-11 items-center rounded-full border border-kv-line-strong px-4 py-2 text-xs transition-colors hover:bg-kv-ink hover:text-kv-panel">{q}</Link>)}
            </div>
          </section>
          <section>
            <SectionHeader title="Baru diputar" />
            {recent.length ? (
              <div className="flex gap-3 overflow-x-auto pb-3">{recent.map((t) => <TrackCard key={t.id} track={t} width="w-28 sm:w-32" onPlay={() => actions.play(t, recent)} />)}</div>
            ) : (
              <div className="rounded-kv border border-kv-line p-4"><p className="text-sm text-kv-ink-muted">Lagu yang kamu putar akan muncul di sini.</p><Link to="/search" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Cari musik pertama</Link></div>
            )}
          </section>
          {frequent.length > 0 && (
            <section className="kv-rise">
              <SectionHeader title="Sering kamu putar" />
              <div className="flex gap-3 overflow-x-auto pb-3">{frequent.map((t) => <TrackCard key={t.id} track={t} width="w-28 sm:w-32" onPlay={() => actions.play(t, frequent)} />)}</div>
            </section>
          )}
          {recommendations.length > 0 && (
            <section className="kv-rise">
              <SectionHeader title="Rekomendasi untukmu" />
              <p className="-mt-2 mb-3 text-xs text-kv-ink-muted">Dari artis dan genre yang paling sering kamu putar.</p>
              <div className="flex gap-3 overflow-x-auto pb-3">{recommendations.map((t) => <TrackCard key={t.id} track={t} width="w-28 sm:w-32" onPlay={() => actions.play(t, recommendations)} />)}</div>
            </section>
          )}
          <section>
            <SectionHeader title="Koleksi pilihanmu" to="/playlists" />
            <div className="divide-y divide-kv-line">
              <Link to="/favorites" className="flex min-h-16 items-center gap-3 rounded-kv px-2 py-3 hover:bg-kv-surface">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-kv bg-kv-surface"><Heart size={19} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Lagu favorit</span><span className="text-xs text-kv-ink-muted">{favoritesLoadedFor === user?.id ? `${favorites.length} lagu disimpan` : 'Koleksi lagu yang kamu sukai'}</span></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              {playlistsLoading && !playlists.length && <p role="status" className="py-4 text-sm text-kv-ink-muted">Memuat playlist…</p>}
              {playlistsError && <div role="alert" className="py-4 text-sm"><p>Playlist belum bisa dimuat.</p><Button size="sm" variant="ghost" onClick={() => loadUserPlaylists(user.id).catch(() => {})}>Coba lagi</Button></div>}
              {playlists.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/playlists/${p.id}`} className="flex min-h-16 items-center gap-3 rounded-kv px-2 py-3 hover:bg-kv-surface">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-kv bg-kv-surface"><ListMusic size={19} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="text-xs text-kv-ink-muted">{p.trackCount ?? p.track_count ?? p.tracks?.length ?? 0} lagu</span></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
            {!playlistsLoading && !playlistsError && !playlists.length && <Link to="/playlists" className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Buat playlist pertamamu</Link>}
          </section>
        </div>
      </div>
      <section className="mt-10 border-t border-kv-line pt-6">
        <SectionHeader title="Lagu kamu" to="/library" />
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Memuat library">{[...Array(4)].map((_, i) => <TrackRowSkeleton key={i} />)}</div>
        ) : error ? (
          <EmptyState icon={LibraryIcon} title="Library belum tersedia" description={error} action={<Button size="sm" onClick={() => setRetry((n) => n + 1)}>Coba lagi</Button>} />
        ) : !tracks.length ? (
          <EmptyState icon={Upload} title="Library masih kosong" description="Upload lagu milikmu untuk mengisi koleksi ini." action={<div className="flex flex-wrap justify-center gap-2"><Button size="sm" onClick={() => navigate('/upload')}><Upload size={15} /> Upload lagu</Button><Button size="sm" variant="secondary" onClick={() => navigate('/search')}><Search size={15} /> Cari musik</Button></div>} />
        ) : (
          <div className="space-y-1">{tracks.slice(0, 6).map((t, i) => <TrackRow key={t.id} track={t} index={i} list={tracks} />)}</div>
        )}
      </section>
      {!loading && !error && albums.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Album kamu" to="/library?tab=albums" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{albums.slice(0, 4).map((a) => <AlbumCard key={a.id} album={a} onClick={() => navigate(`/library?tab=albums&album=${encodeURIComponent(a.name)}`)} onPlay={() => playAlbum(a)} />)}</div>
        </section>
      )}
      <div className="mt-8 flex flex-wrap gap-2 border-t border-kv-line pt-5">
        <Button size="sm" variant="secondary" onClick={() => navigate('/upload')}><Upload size={15} /> Upload lagu</Button>
        <Button size="sm" variant="ghost" onClick={() => navigate('/lyrics')}><Mic2 size={15} /> Lirik</Button>
      </div>
    </div>
  );
};

export default Home;

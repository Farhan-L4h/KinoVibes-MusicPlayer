import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  Play,
  Shuffle,
  ArrowLeft,
  Disc3,
  Music2,
  Search as SearchIcon,
  Library as LibraryIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { getUserMusic, transformMusicData } from '../services/supabaseMusicApi';
import { getUserAlbums, buildAlbumList, sortAlbums, getAlbumTracks } from '../services/albumApi';
import { useTrackActions } from '../hooks/useTrackActions';
import { formatTotalDuration } from '../lib/utils';
import TrackRow from '../components/TrackRow';
import AlbumCard from '../components/AlbumCard';
import ConfirmModal from '../components/ConfirmModal';
import Tabs from '../components/ui/Tabs';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { TrackRowSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { toast } from '../stores/toast';

const TRACK_SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'title', label: 'Judul A–Z' },
  { value: 'artist', label: 'Artis A–Z' },
  { value: 'duration', label: 'Durasi' },
  { value: 'plays', label: 'Paling sering diputar' },
];

const ALBUM_SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'title', label: 'Judul A–Z' },
  { value: 'artist', label: 'Artis A–Z' },
  { value: 'year', label: 'Tahun' },
  { value: 'tracks', label: 'Jumlah lagu' },
];

const sortTracks = (list, key) => {
  const arr = [...list];
  switch (key) {
    case 'title':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'artist':
      return arr.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    case 'duration':
      return arr.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    case 'plays':
      return arr.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    case 'newest':
    default:
      return arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

const Library = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const actions = useTrackActions();

  const tab = params.get('tab') === 'albums' ? 'albums' : 'tracks';
  const albumName = params.get('album') || '';

  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [error, setError] = useState('');
  const [albumError, setAlbumError] = useState('');
  const [albumRetry, setAlbumRetry] = useState(0);
  const [filter, setFilter] = useState('');
  const [trackSort, setTrackSort] = useState('newest');
  const [albumSort, setAlbumSort] = useState('newest');
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [music, albumRows] = await Promise.all([
        getUserMusic(user.id),
        getUserAlbums(user.id).catch(() => []),
      ]);
      setTracks(music);
      setAlbums(buildAlbumList(albumRows, music));
    } catch {
      setError('Library belum bisa dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    const onTrackUpdated = (e) => {
      const updated = e.detail;
      if (!updated?.id) return;
      setTracks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      setAlbumTracks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    };
    window.addEventListener('kv-track-updated', onTrackUpdated);
    return () => window.removeEventListener('kv-track-updated', onTrackUpdated);
  }, []);

  useEffect(() => {
    if (!albumName || !user) {
      setAlbumTracks([]);
      return;
    }
    let cancelled = false;
    setAlbumLoading(true);
    setAlbumError('');
    setAlbumTracks([]);
    getAlbumTracks(user.id, albumName)
      .then((rows) => {
        if (cancelled) return;
        setAlbumTracks(rows.map(transformMusicData).filter((t) => t && t.source !== 'youtube'));
      })
      .catch(() => {
        if (!cancelled) setAlbumError('Lagu dalam album belum bisa dimuat.');
      })
      .finally(() => {
        if (!cancelled) setAlbumLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [albumName, user?.id, albumRetry]);

  const visibleTracks = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const base = f
      ? tracks.filter(
          (t) =>
            t.title.toLowerCase().includes(f) ||
            (t.artist || '').toLowerCase().includes(f) ||
            (t.album || '').toLowerCase().includes(f)
        )
      : tracks;
    return sortTracks(base, trackSort);
  }, [tracks, filter, trackSort]);

  const visibleAlbums = useMemo(() => sortAlbums(albums, albumSort), [albums, albumSort]);

  const totalDuration = useMemo(() => tracks.reduce((acc, t) => acc + (t.duration || 0), 0), [tracks]);

  const currentAlbum = albums.find((a) => a.name.toLowerCase() === albumName.toLowerCase());

  const setTab = (v) => {
    const next = { tab: v };
    setParams(next, { replace: true });
  };

  const openAlbum = (name) => setParams({ tab: 'albums', album: name }, { replace: true });
  const closeAlbum = () => setParams({ tab: 'albums' }, { replace: true });

  const confirmDelete = async () => {
    if (!toDelete) return;
    const ok = await actions.remove(toDelete);
    if (ok) {
      setToDelete(null);
      load();
      if (albumName) {
        setAlbumTracks((prev) => prev.filter((t) => t.id !== toDelete.id));
      }
    }
  };

  if (albumName) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={closeAlbum}
          className="flex items-center gap-1.5 font-mono text-xs text-kv-ink-muted hover:text-kv-ink"
        >
          <ArrowLeft size={14} /> Semua album
        </button>

        <header className="kv-card flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-6">
          <span className="block h-36 w-36 shrink-0 overflow-hidden rounded-kv border border-kv-line bg-kv-muted sm:h-44 sm:w-44">
            {currentAlbum?.coverArt ? (
              <img src={currentAlbum.coverArt} alt="" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Disc3 size={56} className="text-kv-ink-muted" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <Badge tone="surface">Album</Badge>
            <h1 className="mt-2 break-words font-display text-xl leading-relaxed sm:text-2xl">{albumName}</h1>
            <p className="mt-1 font-semibold text-kv-ink-muted">{currentAlbum?.artist || 'Various Artists'}</p>
            <p className="mt-1 font-mono text-xs text-kv-ink-muted">
              {albumTracks.length} lagu · {formatTotalDuration(albumTracks.reduce((a, t) => a + (t.duration || 0), 0))}
              {currentAlbum?.year ? ` · ${currentAlbum.year}` : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => actions.playAll(albumTracks)} disabled={albumTracks.length === 0}>
                <Play size={15} /> Putar semua
              </Button>
              <Button size="sm" variant="secondary" onClick={() => actions.shuffleAll(albumTracks)} disabled={albumTracks.length === 0}>
                <Shuffle size={15} /> Acak
              </Button>
            </div>
          </div>
        </header>

        {albumLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <TrackRowSkeleton key={i} />)}
          </div>
        ) : albumError ? (
          <EmptyState icon={Disc3} title="Album belum tersedia" description={albumError} action={<Button size="sm" onClick={() => setAlbumRetry((n) => n + 1)}>Coba lagi</Button>} />
        ) : albumTracks.length === 0 ? (
          <EmptyState icon={Music2} title="Album kosong" description="Belum ada lagu upload dengan nama album ini." />
        ) : (
          <div className="space-y-1.5">
            {albumTracks.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                list={albumTracks}
                showAlbum={false}
                onDelete={() => setToDelete(t)}
              />
            ))}
          </div>
        )}

        <ConfirmModal
          open={!!toDelete}
          onClose={() => setToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus lagu?"
          message={`"${toDelete?.title}" akan dihapus permanen dari library, beserta file audio, sampul, dan liriknya. Lagu juga hilang dari playlist dan favorit.`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Library kamu</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-kv-ink-muted">
            <Badge tone="surface">{tracks.length} lagu</Badge>
            <Badge tone="surface">{albums.length} album</Badge>
            <Badge tone="surface">{formatTotalDuration(totalDuration)}</Badge>
          </p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Upload size={17} /> Upload
        </Button>
      </header>

      <Tabs
        tabs={[
          { value: 'tracks', label: 'Semua lagu' },
          { value: 'albums', label: 'Album' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'tracks' ? (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1">
              <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kv-ink-muted" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Saring judul, artis, album…"
                aria-label="Saring lagu"
                className="min-h-[44px] w-full rounded-full border border-kv-line bg-kv-surface py-2 pl-9 pr-3 text-sm placeholder:text-kv-ink-muted"
              />
            </div>
            <Select
              label="Urutkan lagu"
              options={TRACK_SORTS}
              value={trackSort}
              onChange={(e) => setTrackSort(e.target.value)}
            />
            <Button size="sm" onClick={() => actions.playAll(visibleTracks)} disabled={visibleTracks.length === 0}>
              <Play size={15} /> Putar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => actions.shuffleAll(visibleTracks)} disabled={visibleTracks.length === 0}>
              <Shuffle size={15} /> Acak
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <TrackRowSkeleton key={i} />)}
            </div>
          ) : error ? (
            <EmptyState icon={LibraryIcon} title="Library belum tersedia" description={error} action={<Button size="sm" onClick={load}>Coba lagi</Button>} />
          ) : visibleTracks.length === 0 ? (
            <EmptyState
              icon={LibraryIcon}
              title={filter ? 'Tidak ada yang cocok' : 'Belum ada lagu'}
              description={
                filter
                  ? `Tidak ada lagu yang cocok dengan "${filter}".`
                  : 'Upload lagu pertamamu untuk mulai membangun koleksi.'
              }
              action={!filter && <Button size="sm" onClick={() => navigate('/upload')}><Upload size={15} /> Upload lagu</Button>}
            />
          ) : (
            <div className="space-y-1.5">
              {visibleTracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} list={visibleTracks} onDelete={() => setToDelete(t)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs text-kv-ink-muted">Urutkan:</span>
            <Select
              label="Urutkan album"
              options={ALBUM_SORTS}
              value={albumSort}
              onChange={(e) => setAlbumSort(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <EmptyState icon={Disc3} title="Album belum tersedia" description={error} action={<Button size="sm" onClick={load}>Coba lagi</Button>} />
          ) : visibleAlbums.length === 0 ? (
            <EmptyState
              icon={Disc3}
              title="Belum ada album"
              description="Album muncul otomatis dari metadata lagu yang kamu upload."
              action={<Button size="sm" onClick={() => navigate('/upload')}><Upload size={15} /> Upload lagu</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {visibleAlbums.map((a, i) => (
                <AlbumCard
                  key={a.id}
                  album={a}
                  index={i}
                  onClick={() => openAlbum(a.name)}
                  onPlay={async () => {
                    try {
                      const rows = await getAlbumTracks(user.id, a.name);
                      const list = rows.map(transformMusicData).filter((t) => t && t.source !== 'youtube');
                      if (list.length) actions.playAll(list);
                      else toast.info('Album ini belum punya lagu.');
                    } catch {
                      toast.error('Gagal memutar album');
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus lagu?"
        message={`"${toDelete?.title}" akan dihapus permanen dari library, beserta file audio, sampul, dan liriknya. Lagu juga hilang dari playlist dan favorit.`}
      />
    </div>
  );
};

export default Library;
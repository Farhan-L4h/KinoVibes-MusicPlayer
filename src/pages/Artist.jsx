import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music2, Shuffle, ListMusic, ArrowLeft, Play, Disc3 } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useTrackActions } from '../hooks/useTrackActions';
import { searchMusic } from '../services/supabaseMusicApi';
import { searchYouTube, ytItemToTrack } from '../services/ytApi';
import { searchSpotify, isSpotifyConnected } from '../services/spotifyApi';
import TrackRow from '../components/TrackRow';
import AlbumCard from '../components/AlbumCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import IconButton from '../components/ui/IconButton';
import Skeleton, { TrackRowSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { cn, artistKey, sameArtist } from '../lib/utils';

const CACHE_TTL = 10 * 60_000;
const MAX_CACHE = 20;
const PAGE_SIZE = 20;
const cache = new Map();

const readCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.data;
};

const writeCache = (key, data) => {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
};

const buildAlbums = (tracks) => {
  const map = new Map();
  for (const t of tracks) {
    const name = t.album || 'Album tidak diketahui';
    if (!map.has(name)) {
      map.set(name, { name, artist: t.artist, coverArt: t.albumArt, trackCount: 0, tracks: [] });
    }
    const entry = map.get(name);
    entry.trackCount += 1;
    entry.tracks.push(t);
    if (!entry.coverArt && t.albumArt) entry.coverArt = t.albumArt;
  }
  return [...map.values()].sort((a, b) => b.trackCount - a.trackCount);
};

const Artist = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const actions = useTrackActions();

  const [name, setName] = useState(() => {
    try {
      return decodeURIComponent(slug || '');
    } catch {
      return slug || '';
    }
  });
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tracks');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    let artistName;
    try {
      artistName = decodeURIComponent(slug || '');
    } catch {
      artistName = slug || '';
    }
    setName(artistName);
    setSelectedAlbum(null);
    setActiveTab('tracks');
    setVisible(PAGE_SIZE);
    if (!artistName) {
      setLoading(false);
      return undefined;
    }

    const key = artistKey(artistName);
    const cached = readCache(key);
    if (cached) {
      setTracks(cached);
      setError('');
      setLoading(false);
      return undefined;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError('');
    setTracks([]);

    (async () => {
      const [library, youtube, spotify] = await Promise.allSettled([
        searchMusic(artistName, user?.id),
        searchYouTube(artistName, 'song', 50, { signal: controller.signal }),
        isSpotifyConnected() ? searchSpotify(artistName, 50) : Promise.resolve([]),
      ]);
      if (controller.signal.aborted) return;

      const rows = [
        ...(library.status === 'fulfilled' ? library.value : []),
        ...(youtube.status === 'fulfilled'
          ? youtube.value.filter((i) => i.videoId).filter((i) => sameArtist(i.artist, artistName)).map(ytItemToTrack)
          : []),
        ...(spotify.status === 'fulfilled'
          ? spotify.value.filter((t) => sameArtist(t.artist, artistName))
          : []),
      ].filter((t) => !t.artist || sameArtist(t.artist, artistName));

      const seen = new Set();
      const unique = rows.filter((t) => {
        const dedupe = `${(t.title || '').toLowerCase()}|${artistKey(t.artist)}`;
        if (seen.has(dedupe)) return false;
        seen.add(dedupe);
        return true;
      });
      unique.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

      if (!controller.signal.aborted) {
        setTracks(unique);
        setLoading(false);
        if (unique.length > 0) writeCache(key, unique);
      }
    })();

    return () => controller.abort();
  }, [slug, user?.id]);

  const albums = buildAlbums(tracks);
  const popular = tracks.slice(0, 10);
  const art = selectedAlbum?.coverArt || tracks.find((t) => t.albumArt)?.albumArt || null;

  const playAll = (list) => {
    if (list.length > 0) actions.playAll(list);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <TrackRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState icon={Music2} title="Gagal memuat artis" description={error} />
      </div>
    );
  }

  const tabs = [
    { value: 'tracks', label: 'Lagu', count: tracks.length },
    { value: 'albums', label: 'Album', count: albums.length },
    { value: 'popular', label: 'Populer', count: popular.length },
  ];

  const detailTracks = selectedAlbum ? selectedAlbum.tracks : null;
  const listTracks = detailTracks || (activeTab === 'popular' ? popular : tracks);
  const shownTracks = detailTracks ? detailTracks : listTracks.slice(0, visible);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-2">
        <IconButton label="Kembali" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </IconButton>
        <p className="font-mono text-xs uppercase tracking-widest text-kv-ink-muted">
          {selectedAlbum ? `Album · ${name}` : 'Artis'}
        </p>
      </header>

      {selectedAlbum ? (
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-kv-lg border border-kv-line bg-kv-muted">
            {selectedAlbum.coverArt ? (
              <img src={selectedAlbum.coverArt} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-kv-ink-muted"><Disc3 size={48} /></span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="truncate font-display text-3xl leading-tight sm:text-4xl">{selectedAlbum.name}</h1>
            <p className="text-sm text-kv-ink-muted">
              {selectedAlbum.artist} · {selectedAlbum.trackCount} lagu
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => playAll(selectedAlbum.tracks)}>
                <Play size={17} fill="currentColor" /> Play All
              </Button>
              <Button variant="secondary" onClick={() => setSelectedAlbum(null)}>
                Kembali ke artis
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border border-kv-line bg-kv-muted">
            {art ? (
              <img src={art} alt={`Artwork ${name}`} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-kv-ink-muted"><Music2 size={48} /></span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="truncate font-display text-3xl leading-tight sm:text-4xl">{name || 'Artis tidak dikenal'}</h1>
            <p className="font-mono text-xs text-kv-ink-muted">
              {tracks.length} lagu · {albums.length} album
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => playAll(tracks)} disabled={tracks.length === 0}>
                <Music2 size={18} /> Play All
              </Button>
              <Button variant="secondary" onClick={() => actions.shuffleAll(tracks)} disabled={tracks.length === 0}>
                <Shuffle size={18} /> Shuffle
              </Button>
            </div>
          </div>
        </section>
      )}

      {!selectedAlbum && (
        <div className="border-b border-kv-line">
          <nav className="flex gap-1 overflow-x-auto pb-1" role="tablist">
            {tabs.map(({ value, label, count }) => (
              <button
                key={value}
                role="tab"
                aria-selected={activeTab === value}
                onClick={() => { setActiveTab(value); setVisible(PAGE_SIZE); }}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                  activeTab === value
                    ? 'border-kv-ink bg-kv-ink text-kv-panel'
                    : 'border-transparent text-kv-ink-muted hover:border-kv-line hover:text-kv-ink'
                )}
              >
                {label}
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-kv-muted/50 px-1 text-[10px] font-bold">
                  {count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {!selectedAlbum && activeTab === 'albums' ? (
        albums.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((album) => (
              <AlbumCard
                key={album.name}
                album={album}
                onClick={() => setSelectedAlbum(album)}
                onPlay={() => playAll(album.tracks)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={ListMusic} title="Tidak ada album" description={`Belum ada data album untuk "${name}".`} />
        )
      ) : shownTracks.length === 0 ? (
        <EmptyState
          icon={Music2}
          title={selectedAlbum ? 'Album kosong' : 'Tidak ada lagu'}
          description={`Tidak menemukan lagu untuk "${name}".`}
        />
      ) : (
        <section className="space-y-2">
          <div className="space-y-1">
            {shownTracks.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                list={listTracks}
                onPlay={() => actions.play(t, listTracks)}
              />
            ))}
          </div>
          {!detailTracks && visible < listTracks.length && (
            <div className="pt-2 text-center">
              <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Muat lebih banyak ({listTracks.length - visible} lagi)
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Artist;

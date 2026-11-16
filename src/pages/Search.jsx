import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Youtube, Library, Loader2, X, Clock3, Music2, Disc3, UserRound, ListPlus, AudioLines } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { searchYouTube, suggestYouTube, ytItemToTrack } from '../services/ytApi';
import { searchSpotify, isSpotifyConnected } from '../services/spotifyApi';
import { searchMusic } from '../services/supabaseMusicApi';
import TrackRow from '../components/TrackRow';
import TrackArt from '../components/TrackArt';
import Tabs from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import ImportPlaylistModal from '../components/ImportPlaylistModal';
import { TrackRowSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { debounce } from '../lib/utils';

const HISTORY_KEY = 'kv-searches';
const EXPLORE = ['Pop Indonesia terbaru', 'Lo-fi beats', 'K-Pop hit', 'Indie lokal', 'Jazz santai', 'Rock klasik'];

const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const pushHistory = (q) => {
  const list = [q, ...readHistory().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
};

const TYPE_TABS = [
  { value: 'song', label: 'Lagu' },
  { value: 'video', label: 'Video' },
  { value: 'album', label: 'Album' },
  { value: 'artist', label: 'Artis' },
];

const BrowseCard = ({ item, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group min-w-0 rounded-kv border border-kv-line bg-kv-surface p-3 text-left transition-colors hover:border-kv-ink"
  >
    <span className={`relative mb-3 block aspect-square w-full overflow-hidden border border-kv-line bg-kv-muted ${item.type === 'artist' ? 'rounded-full' : 'rounded-kv'}`}>
      {item.videoId ? (
        <TrackArt
          src={item.thumbnail}
          videoId={item.videoId}
          small
          imgClassName="h-full w-full object-cover grayscale group-hover:grayscale-0 group-focus-visible:grayscale-0"
          placeholderSize={44}
        />
      ) : item.thumbnail ? (
        <img src={item.thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale group-hover:grayscale-0 group-focus-visible:grayscale-0" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-kv-muted">
          {item.type === 'artist' ? <UserRound size={44} className="text-kv-ink-muted" /> : <Disc3 size={44} className="text-kv-ink-muted" />}
        </span>
      )}
    </span>
    <span className="block truncate text-sm font-semibold leading-tight">{item.title}</span>
    <span className="mt-0.5 block truncate text-xs text-kv-ink-muted">
      {item.type === 'artist' ? item.subscribers || item.subtitle || 'Artis' : item.artist || item.subtitle || ''}
    </span>
    <span className="mt-1.5 flex flex-wrap gap-1">
      {item.year && <Badge tone="surface">{item.year}</Badge>}
      {item.itemCount && <Badge tone="surface">{item.itemCount}</Badge>}
      {item.type === 'album' && <Badge tone="surface">Album</Badge>}
      {item.type === 'artist' && <Badge tone="surface">Artis</Badge>}
    </span>
  </button>
);

const Search = () => {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const initialQ = params.get('q') || '';
  const [input, setInput] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [src, setSrc] = useState(['library', 'spotify'].includes(params.get('src')) ? params.get('src') : 'yt');
  const [type, setType] = useState(TYPE_TABS.some((t) => t.value === params.get('type')) ? params.get('type') : 'song');
  const [items, setItems] = useState([]);
  const [state, setState] = useState(initialQ ? 'loading' : 'idle');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [importOpen, setImportOpen] = useState(false);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const syncUrl = (q, s, t) => {
    const next = {};
    if (q) next.q = q;
    if (s !== 'yt') next.src = s;
    if (t !== 'song') next.type = t;
    setParams(next, { replace: true });
  };

  const runSearch = (q, s = src, t = type) => {
    const trimmed = q.trim();
    setInput(trimmed);
    setQuery(trimmed);
    setSrc(s);
    setType(t);
    setSuggestOpen(false);
    syncUrl(trimmed, s, t);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState('idle');
      setItems([]);
      return undefined;
    }
    let cancelled = false;
    setState('loading');
    setError('');
    (async () => {
      try {
        if (src === 'library') {
          const rows = await searchMusic(trimmed, user.id);
          if (cancelled) return;
          setItems(rows);
          setState(rows.length ? 'ready' : 'empty');
        } else if (src === 'spotify') {
          const rows = await searchSpotify(trimmed, 24);
          if (cancelled) return;
          setItems(rows);
          setState(rows.length ? 'ready' : 'empty');
        } else {
          const raw = await searchYouTube(trimmed, type, 24);
          if (cancelled) return;
          setItems(raw);
          setState(raw.length ? 'ready' : 'empty');
        }
        pushHistory(trimmed);
        setHistory(readHistory());
      } catch (err) {
        if (cancelled || err?.name === 'AbortError') return;
        setError(err.message || 'Pencarian gagal.');
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, src, type, user?.id, retry]);

  const fetchSuggestions = useMemo(
    () =>
      debounce(async (value) => {
        if (src !== 'yt' || value.trim().length < 2) {
          setSuggestions([]);
          return;
        }
        const list = await suggestYouTube(value.trim());
        setSuggestions(list);
      }, 280),
    [src]
  );

  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current?.contains(e.target)) setSuggestOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const tracks = useMemo(() => {
    if (src === 'library' || src === 'spotify') return items;
    if (type === 'song' || type === 'video') return items.filter((i) => i.videoId).map(ytItemToTrack);
    return [];
  }, [items, src, type]);

  const browseItems = src === 'yt' && (type === 'album' || type === 'artist') ? items : [];
  const gridMode = src === 'yt' && (type === 'album' || type === 'artist');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Cari musik</h1>
        <p className="mt-1 text-sm text-kv-ink-muted">
          Jutaan lagu dari YouTube Music, plus koleksi upload kamu sendiri.
        </p>
      </header>

      <div ref={boxRef} className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(input);
          }}
          className="flex gap-2"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-kv-ink-muted" />
            <input
              ref={inputRef}
              type="search"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                fetchSuggestions(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSuggestOpen(false);
              }}
              placeholder="Judul lagu, artis, atau album…"
              aria-label="Kata kunci pencarian"
              autoComplete="off"
              className="min-h-[52px] w-full rounded-full border border-kv-line bg-kv-surface py-3 pl-11 pr-14 text-base text-kv-ink placeholder:text-kv-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
            />
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setQuery('');
                  setSuggestions([]);
                  syncUrl('', src, type);
                  inputRef.current?.focus();
                }}
                aria-label="Bersihkan pencarian"
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:bg-kv-muted"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button type="submit" size="lg" className="shrink-0" aria-label="Cari musik">
            <SearchIcon size={18} />
            <span className="hidden sm:inline">Cari</span>
          </Button>
        </form>

        {suggestOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-kv border border-kv-line bg-kv-surface shadow-kv-lg sm:right-24">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(s)}
                className="flex min-h-[44px] w-full items-center gap-2.5 border-b border-kv-line px-3.5 py-2 text-left text-sm last:border-b-0 hover:bg-kv-muted"
              >
                <SearchIcon size={14} className="shrink-0 text-kv-ink-muted" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          tabs={[
            { value: 'yt', label: 'YouTube Music' },
            ...(isSpotifyConnected() ? [{ value: 'spotify', label: 'Spotify' }] : []),
            { value: 'library', label: 'Library kamu' },
          ]}
          active={src}
          onChange={(v) => runSearch(input, v, type)}
        />
        {src === 'yt' && <Tabs tabs={TYPE_TABS} active={type} onChange={(v) => runSearch(input, src, v)} />}
        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setImportOpen(true)}>
          <ListPlus size={15} /> Impor playlist
        </Button>
      </div>

      {state === 'idle' && (
        <div className="space-y-8">
          {history.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-mono text-xs text-kv-ink-muted">
                  <Clock3 size={14} /> Terakhir dicari
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(HISTORY_KEY);
                    setHistory([]);
                  }}
                  className="min-h-11 font-mono text-xs text-kv-ink-muted underline hover:text-kv-danger"
                >
                  Hapus
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => runSearch(h)}
                    className="min-h-11 rounded-full border border-kv-line bg-transparent px-4 py-2 text-sm hover:bg-kv-surface"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2.5 flex items-center gap-2 font-mono text-xs text-kv-ink-muted">
              <Youtube size={14} /> Mulai jelajahi
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {EXPLORE.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => runSearch(q, 'yt', 'song')}
                  className="min-h-11 rounded-full border border-kv-line-strong px-4 py-2 text-xs hover:bg-kv-ink hover:text-kv-panel"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {state === 'loading' && (
        <div>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs text-kv-ink-muted">
            <Loader2 size={14} className="animate-spin" /> Mencari "{query}"…
          </p>
          {gridMode ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <TrackRowSkeleton key={i} />)}
            </div>
          )}
        </div>
      )}

      {state === 'error' && (
        <EmptyState
          icon={Youtube}
          title="Pencarian gagal"
          description={error}
          action={<Button size="sm" onClick={() => { runSearch(input); setRetry((n) => n + 1); }}>Coba lagi</Button>}
        />
      )}

      {state === 'empty' && (
        <EmptyState
          icon={src === 'library' ? Library : src === 'spotify' ? AudioLines : Music2}
          title="Tidak ada hasil"
          description={
            src === 'library'
              ? `Tidak ada lagu upload yang cocok dengan "${query}". Coba cari di YouTube Music.`
              : src === 'spotify'
                ? `Tidak menemukan "${query}" di Spotify. Coba kata kunci lain.`
                : `Tidak menemukan "${query}" di YouTube Music. Coba kata kunci lain.`
          }
          action={
            src === 'library' ? (
              <Button size="sm" variant="secondary" onClick={() => runSearch(query, 'yt', 'song')}>
                <Youtube size={15} /> Cari di YouTube
              </Button>
            ) : undefined
          }
        />
      )}

      {state === 'ready' && tracks.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-xs text-kv-ink-muted">
            {tracks.length} hasil untuk "{query}"
          </p>
          <div className="space-y-1.5">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} list={tracks} />
            ))}
          </div>
        </section>
      )}

      {state === 'ready' && browseItems.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-xs text-kv-ink-muted">
            {browseItems.length} {type === 'album' ? 'album' : 'artis'} untuk "{query}", pilih untuk lihat lagunya
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {browseItems.map((item, i) => (
              <BrowseCard
                key={`${item.browseId || item.title}-${i}`}
                item={item}
                onClick={() => runSearch(type === 'artist' ? item.title : `${item.title} ${item.artist || ''}`.trim(), 'yt', 'song')}
              />
            ))}
          </div>
        </section>
      )}

      <ImportPlaylistModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};

export default Search;
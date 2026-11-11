import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Youtube, Library, Loader2, X, Clock3, Music2, Disc3, UserRound } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { searchYouTube, suggestYouTube, ytItemToTrack } from '../services/ytApi';
import { searchMusic } from '../services/supabaseMusicApi';
import TrackRow from '../components/TrackRow';
import Tabs from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
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
    className="kv-press rounded-kv border-3 border-kv-ink bg-kv-surface p-3 text-left shadow-kv"
  >
    <span className={`relative mb-3 block aspect-square w-full overflow-hidden border-3 border-kv-ink bg-kv-muted ${item.type === 'artist' ? 'rounded-full' : 'rounded-kv'}`}>
      {item.thumbnail ? (
        <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="kv-dots flex h-full w-full items-center justify-center bg-kv-purple">
          {item.type === 'artist' ? <UserRound size={44} className="text-[#0a0a0a]" /> : <Disc3 size={44} className="text-[#0a0a0a]" />}
        </span>
      )}
    </span>
    <span className="block truncate font-display text-sm uppercase leading-tight">{item.title}</span>
    <span className="mt-0.5 block truncate text-xs text-kv-ink-muted">
      {item.type === 'artist' ? item.subscribers || item.subtitle || 'Artis' : item.artist || item.subtitle || ''}
    </span>
    <span className="mt-1.5 flex flex-wrap gap-1">
      {item.year && <Badge tone="surface">{item.year}</Badge>}
      {item.itemCount && <Badge tone="yellow">{item.itemCount}</Badge>}
      {item.type === 'album' && <Badge tone="blue">Album</Badge>}
      {item.type === 'artist' && <Badge tone="pink">Artis</Badge>}
    </span>
  </button>
);

const Search = () => {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const initialQ = params.get('q') || '';
  const [input, setInput] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [src, setSrc] = useState(params.get('src') === 'library' ? 'library' : 'yt');
  const [type, setType] = useState(TYPE_TABS.some((t) => t.value === params.get('type')) ? params.get('type') : 'song');
  const [items, setItems] = useState([]);
  const [state, setState] = useState(initialQ ? 'loading' : 'idle');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [history, setHistory] = useState(readHistory);
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
  }, [query, src, type, user?.id]);

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
    if (src === 'library') return items;
    if (type === 'song' || type === 'video') return items.filter((i) => i.videoId).map(ytItemToTrack);
    return [];
  }, [items, src, type]);

  const browseItems = src === 'yt' && (type === 'album' || type === 'artist') ? items : [];
  const gridMode = src === 'yt' && (type === 'album' || type === 'artist');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Cari musik</h1>
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
          <div className="relative flex-1">
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
              className="min-h-[52px] w-full rounded-kv border-3 border-kv-ink bg-kv-surface py-3 pl-11 pr-10 text-base font-semibold text-kv-ink shadow-kv placeholder:text-kv-ink-muted/60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-kv-blue"
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
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded border-2 border-kv-ink bg-kv-muted hover:bg-kv-red hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button type="submit" size="lg" className="shrink-0">
            <SearchIcon size={18} />
            <span className="hidden sm:inline">Cari</span>
          </Button>
        </form>

        {suggestOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-kv border-3 border-kv-ink bg-kv-surface shadow-kv-lg sm:right-24">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(s)}
                className="flex min-h-[44px] w-full items-center gap-2.5 border-b-2 border-kv-ink/10 px-3.5 py-2 text-left text-sm font-semibold last:border-b-0 hover:bg-kv-yellow hover:text-[#0a0a0a]"
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
            { value: 'library', label: 'Library kamu' },
          ]}
          active={src}
          onChange={(v) => runSearch(input, v, type)}
        />
        {src === 'yt' && <Tabs tabs={TYPE_TABS} active={type} onChange={(v) => runSearch(input, src, v)} />}
      </div>

      {state === 'idle' && (
        <div className="space-y-8">
          {history.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-kv-ink-muted">
                  <Clock3 size={14} /> Terakhir dicari
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(HISTORY_KEY);
                    setHistory([]);
                  }}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-kv-ink-muted underline hover:text-kv-danger"
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
                    className="kv-press min-h-[40px] rounded-kv border-3 border-kv-ink bg-kv-surface px-3 py-1.5 text-sm font-bold shadow-kv hover:bg-kv-muted"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2.5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-kv-ink-muted">
              <Youtube size={14} /> Mulai jelajahi
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {EXPLORE.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => runSearch(q, 'yt', 'song')}
                  className={`kv-press min-h-[44px] rounded-kv border-3 border-kv-ink px-4 py-2 font-display text-xs uppercase tracking-wide text-[#0a0a0a] shadow-kv ${
                    ['bg-kv-pink', 'bg-kv-blue', 'bg-kv-green', 'bg-kv-orange', 'bg-kv-purple', 'bg-kv-yellow'][i % 6]
                  }`}
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
          <p className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-kv-ink-muted">
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
          action={<Button size="sm" onClick={() => runSearch(input)}>Coba lagi</Button>}
        />
      )}

      {state === 'empty' && (
        <EmptyState
          icon={src === 'library' ? Library : Music2}
          title="Tidak ada hasil"
          description={
            src === 'library'
              ? `Tidak ada lagu upload yang cocok dengan "${query}". Coba cari di YouTube Music.`
              : `Tidak menemukan "${query}" di YouTube Music. Coba kata kunci lain.`
          }
          action={
            src === 'library' ? (
              <Button size="sm" variant="pink" onClick={() => runSearch(query, 'yt', 'song')}>
                <Youtube size={15} /> Cari di YouTube
              </Button>
            ) : undefined
          }
        />
      )}

      {state === 'ready' && tracks.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-kv-ink-muted">
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
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-kv-ink-muted">
            {browseItems.length} {type === 'album' ? 'album' : 'artis'} untuk "{query}" — klik untuk lihat lagunya
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
    </div>
  );
};

export default Search;
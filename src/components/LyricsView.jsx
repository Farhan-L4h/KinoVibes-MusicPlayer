import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic2, RefreshCw, Pencil, Minus, Plus, Loader2, RotateCcw } from 'lucide-react';
import { useMusicStore } from '../stores/music';
import { useAuthStore } from '../stores/auth';
import { fetchLyrics, getLyricsOffset, setLyricsOffset } from '../services/lyricsApi';
import { useArtColors } from '../hooks/useArtColors';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import Button from './ui/Button';
import Skeleton from './ui/Skeleton';
import ManualLyricsModal from './ManualLyricsModal';

const LyricsView = ({ compact = false }) => {
  const track = useMusicStore((s) => s.currentTrack);
  const lyrics = useMusicStore((s) => s.lyrics);
  const activeIndex = useMusicStore((s) => s.currentLyricIndex);
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState('idle');
  const [editing, setEditing] = useState(false);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const manualScrollAt = useRef(0);
  const requestId = useRef(0);
  const colors = useArtColors(track?.albumArt);
  const [follow, setFollow] = useState(true);

  const load = useCallback(
    async (force = false) => {
      if (!track) return;
      const id = ++requestId.current;
      setState('loading');
      try {
        const result = await fetchLyrics(track, { force });
        if (id !== requestId.current || useMusicStore.getState().currentTrack?.id !== track.id) return;
        useMusicStore.getState().setLyrics(result);
        setState(result?.synced?.length || result?.plain ? 'ready' : 'empty');
      } catch {
        if (id === requestId.current && useMusicStore.getState().currentTrack?.id === track.id) setState('error');
      }
    },
    [track]
  );

  useEffect(() => {
    if (!track) {
      setState('idle');
      return;
    }
    setFollow(true);
    manualScrollAt.current = 0;
    setOffset(getLyricsOffset(track.id));
    const cached = useMusicStore.getState().lyrics;
    if (cached && (cached.synced?.length || cached.plain)) {
      setState('ready');
      return;
    }
    load();
    return () => { requestId.current += 1; };
  }, [track?.id, load]);

  useEffect(() => {
    if (!follow || activeIndex < 0 || !lyrics?.synced?.length) return;
    const container = containerRef.current;
    const el = lineRefs.current[activeIndex];
    if (!container || !el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({
      top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [activeIndex, lyrics, follow]);

  const changeOffset = (delta) => {
    if (!track) return;
    const next = delta === null ? 0 : offset + delta;
    setLyricsOffset(track.id, next);
    setOffset(next);
    useMusicStore.getState()._syncLyricIndex(useMusicStore.getState().currentTime);
  };

  const jumpTo = (line) => {
    const total = offset + (lyrics?.baseOffsetMs || 0);
    useMusicStore.getState().seekTo(Math.max(0, (line.timeMs - total) / 1000));
    manualScrollAt.current = 0;
    setFollow(true);
  };

  if (!track) {
    return (
      <EmptyState
        icon={Mic2}
        title="Belum ada lagu"
        description="Putar lagu dulu, lalu liriknya muncul di sini. Tersinkron bila tersedia."
      />
    );
  }

  const totalOffsetMs = offset + (lyrics?.baseOffsetMs || 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" className="min-h-11 rounded-full border border-kv-line px-4 text-xs font-semibold" aria-pressed={follow} onClick={() => setFollow(!follow)}>{follow ? 'Jeda gulir otomatis' : 'Ikuti lirik'}</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {lyrics?.source === 'user' && <Badge>Lirik kamu</Badge>}
        {lyrics?.source === 'lrclib' && <Badge>LRCLIB</Badge>}
        {lyrics?.synced?.length ? <Badge tone="ink">Sync</Badge> : lyrics?.plain ? <Badge>Teks</Badge> : null}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => load(true)}
            aria-label="Muat ulang lirik"
            title="Muat ulang lirik"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-kv-line bg-kv-surface hover:bg-kv-muted"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit lirik manual"
            title="Edit lirik manual"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-kv-line bg-kv-surface hover:bg-kv-muted"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {!compact && lyrics?.synced?.length > 0 && (
        <div className="flex items-center gap-2 rounded-kv border border-kv-line bg-kv-surface px-3 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-kv-ink-muted">
            Offset
          </span>
          <button
            type="button"
            onClick={() => changeOffset(-100)}
            aria-label="Lirik lebih lambat 100 milidetik"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-kv-muted"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[72px] text-center font-mono text-xs font-bold">
            {totalOffsetMs > 0 ? '+' : ''}{totalOffsetMs} ms
          </span>
          <button
            type="button"
            onClick={() => changeOffset(100)}
            aria-label="Lirik lebih cepat 100 milidetik"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-kv-muted"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => changeOffset(null)}
            aria-label="Reset offset"
            title="Reset offset"
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-full hover:bg-kv-muted"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      <div className="kv-lyric-stage relative min-h-0 flex-1 overflow-hidden rounded-kv-lg" style={{ '--mesh-a': colors?.a, '--mesh-b': colors?.b, '--mesh-c': colors?.c }}>
      <div className="kv-mesh" aria-hidden="true" />
      <div
        ref={containerRef}
        onWheel={() => setFollow(false)}
        onTouchStart={() => setFollow(false)}
        onKeyDown={(e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) setFollow(false); }}
        tabIndex={0}
        role="region"
        aria-label="Lirik lagu"
        className={`kv-lyrics kv-scroll relative h-full min-h-[300px] overflow-y-auto px-4 ${compact ? 'max-h-[52vh]' : 'max-h-[65vh]'}`}
      >
        {state === 'loading' && (
          <div className="space-y-4 py-4">
            <Loader2 className="mx-auto animate-spin" size={24} />
            {['w-11/12', 'w-10/12', 'w-9/12', 'w-8/12', 'w-7/12', 'w-6/12'].map((w, i) => (
              <Skeleton key={i} className={`mx-auto h-5 ${w}`} />
            ))}
            <p className="text-center font-mono text-xs uppercase tracking-widest text-kv-ink-muted">
              Mencari lirik…
            </p>
          </div>
        )}

        {state === 'error' && (
          <EmptyState
            icon={Mic2}
            title="Gagal memuat lirik"
            description="Layanan lirik sedang tidak tersedia."
            action={<Button size="sm" onClick={() => load(true)}>Coba lagi</Button>}
            className="border-0 bg-transparent py-8"
          />
        )}

        {state === 'empty' && (
          <EmptyState
            icon={Mic2}
            title="Lirik tidak ditemukan"
            description={`Tidak ada lirik untuk "${track.title}". Kamu bisa menempelnya sendiri. Format LRC akan tersinkron otomatis.`}
            action={<Button size="sm" onClick={() => setEditing(true)}><Pencil size={14} /> Tambah lirik</Button>}
            className="border-0 bg-transparent py-8"
          />
        )}

        {state === 'ready' && lyrics?.synced?.length > 0 && (
          <div className="space-y-1 py-[35%] sm:py-[25%]">
            {lyrics.synced.map((line, i) => {
              const active = i === activeIndex;
              const passed = i < activeIndex;
              return (
                <button
                  key={`${line.timeMs}-${i}`}
                  ref={(el) => { lineRefs.current[i] = el; }}
                  type="button"
                  onClick={() => jumpTo(line)}
                  className="kv-lyric-line"
                  data-active={active}
                  data-passed={passed}
                  data-near={!active && Math.abs(i - activeIndex) <= 2}
                  aria-current={active ? 'true' : undefined}
                >
                  {line.text}
                </button>
              );
            })}
          </div>
        )}

        {state === 'ready' && !lyrics?.synced?.length && lyrics?.plain && (
          <pre className="whitespace-pre-wrap font-body text-base leading-relaxed">{lyrics.plain}</pre>
        )}
      </div>
      </div>

      <ManualLyricsModal
        open={editing}
        track={track}
        userId={user?.id}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          load(true);
        }}
      />
    </div>
  );
};

export default LyricsView;
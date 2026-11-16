import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, X, CornerDownLeft, Music2 } from 'lucide-react';
import { suggestYouTube, searchYouTube, ytItemToTrack } from '../../services/ytApi';
import { useMusicStore } from '../../stores/music';
import TrackArt from '../TrackArt';
import { debounce, cn } from '../../lib/utils';

const HISTORY_KEY = 'kv-searches';
const pushHistory = (q) => {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const next = [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
};

// Topbar combobox: live YouTube suggestions + playable top results, keyboard
// navigable, '/' to focus. On mobile it opens as a full-screen sheet.
export default function QuickSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const boxRef = useRef(null);
  const abortRef = useRef(null);

  const items = [
    ...suggestions.slice(0, 4).map((text) => ({ kind: 'suggest', text })),
    ...results.slice(0, 5).map((item) => ({ kind: 'track', item })),
  ];

  const run = useCallback(async (term) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!term || term.trim().length < 2) {
      setSuggestions([]);
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sug, res] = await Promise.all([
        suggestYouTube(term, { signal: controller.signal }).catch(() => []),
        searchYouTube(term, 'song', 5, { signal: controller.signal }).catch(() => []),
      ]);
      if (controller.signal.aborted) return;
      setSuggestions(sug || []);
      setResults(res || []);
      setActive(-1);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const debouncedRun = useRef(debounce((t) => run(t), 220)).current;

  useEffect(() => () => { abortRef.current?.abort(); debouncedRun.cancel?.(); }, [debouncedRun]);

  const onChange = (value) => {
    setQ(value);
    setOpen(true);
    debouncedRun(value);
  };

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const goSearch = (term) => {
    const t = (term ?? q).trim();
    if (!t) return;
    pushHistory(t);
    close();
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(t)}`);
  };

  const play = (item) => {
    pushHistory(item.title);
    close();
    setMobileOpen(false);
    useMusicStore.getState().playTrack(ytItemToTrack(item));
  };

  const activate = (entry) => {
    if (!entry) return goSearch();
    if (entry.kind === 'suggest') goSearch(entry.text);
    else play(entry.item);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      close();
      setMobileOpen(false);
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (items.length === 0) return;
      setActive((i) => {
        const n = items.length;
        if (e.key === 'ArrowDown') return (i + 1) % n;
        return (i - 1 + n) % n;
      });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      activate(items[active] || null);
    }
  };

  // '/' focuses quick search from anywhere (unless already typing).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (document.querySelector('[data-kv-modal]')) return;
      e.preventDefault();
      if (window.matchMedia('(min-width: 640px)').matches) inputRef.current?.focus();
      else setMobileOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (mobileOpen) mobileInputRef.current?.focus();
  }, [mobileOpen]);

  // Close the desktop dropdown on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const list = (
    <div role="listbox" aria-label="Hasil pencarian cepat" className="kv-scroll max-h-[60vh] overflow-y-auto p-1.5">
      {loading && items.length === 0 && (
        <p className="flex items-center gap-2 px-3 py-3 font-mono text-xs text-kv-ink-muted"><Loader2 size={14} className="animate-spin" /> Mencari…</p>
      )}
      {!loading && q.trim().length >= 2 && items.length === 0 && (
        <p className="px-3 py-3 font-mono text-xs text-kv-ink-muted">Tidak ada hasil cepat. Tekan Enter untuk pencarian penuh.</p>
      )}
      {items.map((entry, i) => (
        <button
          key={entry.kind === 'suggest' ? `s-${entry.text}` : `t-${entry.item.videoId}`}
          type="button"
          role="option"
          aria-selected={i === active}
          onMouseEnter={() => setActive(i)}
          onClick={() => activate(entry)}
          className={cn(
            'flex w-full items-center gap-3 rounded-kv px-2.5 py-2 text-left transition-colors',
            i === active ? 'bg-kv-muted' : 'hover:bg-kv-muted'
          )}
        >
          {entry.kind === 'suggest' ? (
            <>
              <Search size={15} className="shrink-0 text-kv-ink-muted" />
              <span className="min-w-0 flex-1 truncate text-sm">{entry.text}</span>
              <CornerDownLeft size={13} className="shrink-0 text-kv-ink-muted" />
            </>
          ) : (
            <>
              <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-md bg-kv-surface-muted">
                <TrackArt src={entry.item.thumbnail} videoId={entry.item.videoId} small placeholderSize={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{entry.item.title}</span>
                <span className="block truncate font-mono text-xs text-kv-ink-muted">{entry.item.artist}</span>
              </span>
              <Music2 size={14} className="shrink-0 text-kv-ink-muted" />
            </>
          )}
        </button>
      ))}
      {q.trim().length >= 2 && (
        <button
          type="button"
          onClick={() => goSearch()}
          className="mt-1 flex w-full items-center gap-2 rounded-kv border-t border-kv-line px-2.5 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-widest text-kv-ink-muted transition-colors hover:bg-kv-muted hover:text-kv-ink"
        >
          <Search size={13} /> Lihat semua hasil
        </button>
      )}
    </div>
  );

  const field = (ref, autoFocus, controlsId) => (
    <div className="flex h-10 items-center gap-2.5 rounded-full border-[1.5px] border-kv-line-strong bg-kv-surface px-4">
      <Search size={15} className="shrink-0 text-kv-ink-muted" />
      <input
        ref={ref}
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Cari lagu, artis…"
        aria-label="Cari lagu atau artis"
        aria-expanded={open}
        aria-controls={controlsId}
        role="combobox"
        className="min-w-0 flex-1 bg-transparent font-mono text-xs text-kv-ink outline-none placeholder:text-kv-ink-muted"
      />
      {loading ? <Loader2 size={14} className="animate-spin text-kv-ink-muted" /> : q ? (
        <button type="button" aria-label="Bersihkan pencarian" onClick={() => { setQ(''); setSuggestions([]); setResults([]); ref.current?.focus(); }} className="text-kv-ink-muted hover:text-kv-ink">
          <X size={14} />
        </button>
      ) : (
        <kbd className="rounded border border-kv-line px-1.5 font-mono text-[10px] font-bold text-kv-ink-muted">/</kbd>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop inline combobox */}
      <div ref={boxRef} className="relative ml-1 hidden w-full max-w-sm sm:block">
        {field(inputRef, false, `${listId}-desktop`)}
        {open && (q.trim().length >= 2 || loading) && (
          <div id={`${listId}-desktop`} className="kv-card absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden p-0 shadow-kv-lg">
            {list}
          </div>
        )}
      </div>

      {/* Mobile trigger + sheet */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Cari lagu"
        className="kv-press flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-kv-line bg-kv-surface text-kv-ink hover:bg-kv-muted sm:hidden"
      >
        <Search size={17} />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-kv-panel p-4 sm:hidden" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">{field(mobileInputRef, true, `${listId}-mobile`)}</div>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Tutup pencarian" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-kv-line text-kv-ink-muted hover:text-kv-ink">
              <X size={18} />
            </button>
          </div>
          <div id={`${listId}-mobile`} className="kv-card mt-3 min-h-0 flex-1 overflow-hidden p-0">{list}</div>
        </div>
      )}
    </>
  );
}
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreHorizontal,
  ListPlus,
  ListEnd,
  ListStart,
  Heart,
  Download,
  Trash2,
} from 'lucide-react';
import { useFavoritesStore } from '../stores/favorites';
import { useTrackActions } from '../hooks/useTrackActions';

const TrackMenu = ({ track, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    menuRef.current?.querySelector('button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
      if (e.key === 'Tab') setOpen(false);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll('button') || [])];
        const index = items.indexOf(document.activeElement);
        const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current.getBoundingClientRect();
    const width = 248;
    const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
    const estimatedH = 300;
    const top = r.bottom + estimatedH > window.innerHeight - 8 ? Math.max(8, r.top - estimatedH - 4) : r.bottom + 4;
    setPos({ top, left });
    setOpen(true);
  };

  const run = (fn) => () => {
    setOpen(false);
    btnRef.current?.focus();
    fn();
  };

  const fav = isFavorite(track);
  const isUpload = track.source !== 'youtube' && track.source !== 'spotify';
  const canRemove = track.source !== 'youtube';

  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex min-h-[44px] w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-bold hover:bg-kv-muted ${
        danger ? 'text-kv-danger' : 'text-kv-ink'
      }`}
    >
      <Icon size={16} className="shrink-0" />
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={`Menu untuk ${track.title}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Menu lagu"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-kv-line bg-transparent hover:bg-kv-muted"
      >
        <MoreHorizontal size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[85] max-h-[calc(100dvh-16px)] w-[248px] overflow-y-auto rounded-kv border border-kv-line bg-kv-surface py-1 shadow-kv-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="border-b border-kv-line bg-kv-panel px-3 py-2">
              <p className="truncate text-xs font-bold">{track.title}</p>
              <p className="truncate text-[11px] text-kv-ink-muted">{track.artist}</p>
            </div>
            <Item icon={ListStart} label="Putar berikutnya" onClick={run(() => actions.playNext(track))} />
            <Item icon={ListEnd} label="Tambah ke antrean" onClick={run(() => actions.addToQueue(track))} />
            <Item icon={ListPlus} label="Tambah ke playlist" onClick={run(() => actions.openAddToPlaylist(track))} />
            <Item
              icon={Heart}
              label={fav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
              onClick={run(() => actions.toggleLike(track))}
            />
            {isUpload && (
              <Item icon={Download} label="Unduh lagu" onClick={run(() => actions.download(track))} />
            )}
            {canRemove && onDelete && (
              <Item icon={Trash2} label="Hapus dari library" onClick={run(onDelete)} danger />
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default TrackMenu;
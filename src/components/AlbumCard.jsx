import { Disc3, Play } from 'lucide-react';

const AlbumCard = ({ album, onClick, onPlay }) => (
  <div className="group relative min-w-0">
    <button type="button" onClick={onClick} className="kv-lift block w-full overflow-hidden rounded-kv border border-kv-line bg-kv-surface text-left transition-colors hover:border-kv-ink" aria-label={`Buka album ${album.name}`}>
      <span className="relative block aspect-square w-full overflow-hidden bg-kv-muted">
        {album.coverArt ? (
          <img src={album.coverArt} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale transition-[filter] group-hover:grayscale-0 group-focus-within:grayscale-0" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-kv-ink-muted"><Disc3 size={52} /></span>
        )}
      </span>
      <span className="block p-3">
        <span className="block truncate text-sm font-semibold leading-tight">{album.name}</span>
        <span className="mt-1 block truncate text-xs text-kv-ink-muted">{album.artist || 'Various Artists'}</span>
        <span className="mt-2 block font-mono text-[10px] text-kv-ink-muted">{album.trackCount} lagu{album.year ? ` · ${album.year}` : ''}</span>
      </span>
    </button>
    {onPlay && (
      <button type="button" onClick={(e) => { e.stopPropagation(); onPlay(); }} aria-label={`Putar album ${album.name}`} title="Putar album" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border border-kv-line bg-kv-panel text-kv-ink shadow-sm hover:bg-kv-ink hover:text-kv-panel">
        <Play size={16} className="ml-0.5" />
      </button>
    )}
  </div>
);

export default AlbumCard;

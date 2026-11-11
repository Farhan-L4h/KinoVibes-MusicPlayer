import { Disc3, Play } from 'lucide-react';

const ACCENTS = ['var(--kv-pink)', 'var(--kv-blue)', 'var(--kv-green)', 'var(--kv-orange)', 'var(--kv-purple)'];

const AlbumCard = ({ album, index = 0, onClick, onPlay }) => (
  <div className="group relative">
    <button
      type="button"
      onClick={onClick}
      className="kv-press block w-full rounded-kv border-3 border-kv-ink bg-kv-surface text-left shadow-kv"
      aria-label={`Buka album ${album.name}`}
    >
      <span
        className="relative block aspect-square w-full overflow-hidden border-b-3 border-kv-ink"
        style={{ background: ACCENTS[index % ACCENTS.length] }}
      >
        {album.coverArt ? (
          <img src={album.coverArt} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="kv-dots flex h-full w-full items-center justify-center">
            <Disc3 size={56} className="text-[#0a0a0a] transition-transform duration-300 group-hover:rotate-45" />
          </span>
        )}
      </span>
      <span className="block p-3">
        <span className="block truncate font-display text-sm uppercase leading-tight">{album.name}</span>
        <span className="mt-0.5 block truncate text-xs text-kv-ink-muted">{album.artist || 'Various Artists'}</span>
        <span className="mt-1.5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-kv-ink-muted">
          {album.trackCount} lagu{album.year ? ` · ${album.year}` : ''}
        </span>
      </span>
    </button>
    {onPlay && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        aria-label={`Putar album ${album.name}`}
        title="Putar album"
        className="kv-press absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-yellow opacity-100 shadow-kv transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
      >
        <Play size={16} className="ml-0.5 text-[#0a0a0a]" />
      </button>
    )}
  </div>
);

export default AlbumCard;
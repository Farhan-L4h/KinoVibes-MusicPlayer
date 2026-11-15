import { useEffect, useState } from 'react';
import { Link2, Loader2, ListPlus, Play, Youtube, RotateCcw } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import TrackRow from './TrackRow';
import { importYouTubePlaylist } from '../services/ytApi';
import { useMusicStore } from '../stores/music';
import { toast } from '../stores/toast';

const ImportPlaylistModal = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setInput('');
      setError('');
      setResult(null);
      setLoading(false);
    }
  }, [open]);

  const handleImport = async (e) => {
    e?.preventDefault();
    const value = input.trim();
    if (!value || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await importYouTubePlaylist(value);
      if (!data.items.length) {
        setError('Playlist tidak punya lagu yang bisa diputar.');
        return;
      }
      setResult(data);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err.message || 'Gagal mengimpor playlist.');
    } finally {
      setLoading(false);
    }
  };

  const playAll = () => {
    if (!result?.items.length) return;
    useMusicStore.getState().playTrack(result.items[0], result.items);
    toast.success(`Memutar ${result.items.length} lagu dari "${result.title}"`);
    onClose();
  };

  const queueAll = () => {
    if (!result?.items.length) return;
    const { addToQueue } = useMusicStore.getState();
    result.items.forEach((t) => addToQueue(t));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Impor playlist YouTube" wide>
      {!result ? (
        <form onSubmit={handleImport} className="space-y-3">
          <p className="text-sm text-kv-ink-muted">
            Tempel tautan playlist <strong className="text-kv-ink">publik</strong> YouTube atau YouTube
            Music. Tidak perlu login — lagu langsung masuk ke pemutar.
          </p>
          <label htmlFor="playlist-url" className="block text-sm font-semibold">
            Tautan atau ID playlist
          </label>
          <div className="relative">
            <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-kv-ink-muted" />
            <input
              id="playlist-url"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://music.youtube.com/playlist?list=…"
              autoComplete="off"
              className="min-h-[52px] w-full rounded-kv border border-kv-line bg-kv-surface py-3 pl-10 pr-3 text-sm text-kv-ink placeholder:text-kv-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-kv border border-kv-red/40 bg-kv-red/10 px-3 py-2 text-sm text-kv-red">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-kv-ink-muted">
              <Youtube size={13} /> YouTube Music
            </span>
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {loading ? 'Mengimpor…' : 'Impor'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate font-display text-base">{result.title}</h3>
            <Badge tone="ink">{result.items.length} lagu</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={playAll}>
              <Play size={15} /> Putar semua
            </Button>
            <Button size="sm" variant="secondary" onClick={queueAll}>
              <ListPlus size={15} /> Tambah ke antrean
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setResult(null);
                setInput('');
              }}
            >
              <RotateCcw size={15} /> Impor lagi
            </Button>
          </div>
          <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
            {result.items.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} list={result.items} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImportPlaylistModal;
import { useEffect, useState } from 'react';
import { Link2, Loader2, ListPlus, Play, Youtube, RotateCcw, Save } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import TrackRow from './TrackRow';
import { importYouTubePlaylist } from '../services/ytApi';
import { addTrackToPlaylist } from '../services/supabasePlaylistApi';
import { ensureYouTubeTrack } from '../services/supabaseMusicApi';
import { useMusicStore } from '../stores/music';
import { usePlaylistStore } from '../stores/playlist';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';

const ImportPlaylistModal = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const user = useAuthStore((s) => s.user);
  const { createPlaylist, loadUserPlaylists } = usePlaylistStore();

  useEffect(() => {
    if (open) {
      setInput('');
      setError('');
      setResult(null);
      setLoading(false);
      setSelected(new Set());
      setSaving(false);
      setProgress({ done: 0, total: 0 });
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
      setSelected(new Set(data.items.map((t) => t.id)));
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err.message || 'Gagal mengimpor playlist.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTracks = () => (result ? result.items.filter((t) => selected.has(t.id)) : []);
  const allSelected = !!result && result.items.length > 0 && selected.size === result.items.length;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (!result) return;
    setSelected(allSelected ? new Set() : new Set(result.items.map((t) => t.id)));
  };

  const playSelected = () => {
    const tracks = selectedTracks();
    if (!tracks.length) return;
    useMusicStore.getState().playTrack(tracks[0], tracks);
    toast.success(`Memutar ${tracks.length} lagu dari "${result.title}"`);
    onClose();
  };

  const queueSelected = () => {
    const tracks = selectedTracks();
    if (!tracks.length) return;
    const { addToQueue } = useMusicStore.getState();
    tracks.forEach((t) => addToQueue(t));
    toast.success(`${tracks.length} lagu masuk antrean`);
    onClose();
  };

  const saveSelected = async () => {
    const tracks = selectedTracks();
    if (!tracks.length) {
      toast.error('Pilih lagu yang mau disimpan');
      return;
    }
    if (!user) {
      toast.error('Masuk dulu untuk menyimpan playlist');
      return;
    }
    setSaving(true);
    setProgress({ done: 0, total: tracks.length });
    try {
      const playlist = await createPlaylist(user.id, { name: result.title || 'Playlist impor' });
      for (const track of tracks) {
        let musicId = track.id;
        if (track.source === 'youtube' && String(track.id).startsWith('yt:')) {
          const row = await ensureYouTubeTrack(track, user.id);
          musicId = row.id;
        }
        await addTrackToPlaylist(playlist.id, musicId);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      await loadUserPlaylists(user.id).catch(() => {});
      toast.success(`${tracks.length} lagu disimpan ke "${playlist.name}"`);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan playlist');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setResult(null);
    setInput('');
    setSelected(new Set());
  };

  return (
    <Modal open={open} onClose={onClose} title="Impor playlist YouTube" wide>
      {!result ? (
        <form onSubmit={handleImport} className="space-y-3">
          <p className="text-sm text-kv-ink-muted">
            Tempel tautan playlist <strong className="text-kv-ink">publik</strong> YouTube atau YouTube
            Music. Tidak perlu login untuk memutar — masuk untuk menyimpan ke koleksi.
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

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-kv border border-kv-line bg-kv-panel px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-kv-ink-muted">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={saving}
                className="h-4 w-4 accent-kv-ink"
              />
              Pilih semua
            </label>
            <span className="font-mono text-[11px] text-kv-ink-muted">{selected.size} dipilih</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={playSelected} disabled={!selected.size || saving}>
              <Play size={15} /> Putar
            </Button>
            <Button size="sm" variant="secondary" onClick={queueSelected} disabled={!selected.size || saving}>
              <ListPlus size={15} /> Antrean
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={saveSelected}
              disabled={!selected.size || saving || !user}
              title={!user ? 'Masuk dulu untuk menyimpan' : undefined}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? `Menyimpan ${progress.done}/${progress.total}` : 'Simpan'}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={saving}>
              <RotateCcw size={15} /> Impor lagi
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-kv-ink-muted">
              Masuk ke akun untuk menyimpan playlist ke koleksi kamu.
            </p>
          )}

          <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
            {result.items.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  disabled={saving}
                  aria-label={`Pilih ${t.title}`}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-kv-ink"
                />
                <div className="min-w-0 flex-1">
                  <TrackRow track={t} index={i} list={result.items} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImportPlaylistModal;
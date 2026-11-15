import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { usePlaylistStore } from '../stores/playlist';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { toast } from '../stores/toast';

const Playlists = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { playlists, loading, error, loadUserPlaylists, createPlaylist } = usePlaylistStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setBusy(true);
    try {
      const playlist = await createPlaylist(user.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success(`Playlist "${playlist.name}" dibuat`);
      setCreating(false);
      setName('');
      setDescription('');
      navigate(`/playlists/${playlist.id}`);
    } catch {
      toast.error('Gagal membuat playlist');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Playlist</h1>
          <p className="mt-1 text-sm text-kv-ink-muted">Kumpulan lagu untuk setiap suasana.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={17} /> Buat playlist
        </Button>
      </header>

      {loading && playlists.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error && playlists.length === 0 ? (
        <EmptyState icon={ListMusic} title="Playlist belum bisa dimuat" description="Periksa koneksi lalu coba lagi." action={<Button size="sm" onClick={() => loadUserPlaylists(user.id).catch(() => {})}>Coba lagi</Button>} />
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Belum ada playlist"
          description="Buat playlist pertama, lalu isi dari menu lagu, termasuk lagu YouTube."
          action={<Button size="sm" onClick={() => setCreating(true)}><Plus size={15} /> Buat playlist</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {playlists.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/playlists/${p.id}`)}
              className="group min-w-0 overflow-hidden rounded-kv border border-kv-line bg-kv-surface text-left transition-colors hover:border-kv-ink"
            >
              <span className="flex aspect-square w-full items-center justify-center bg-kv-muted">
                <ListMusic size={48} className="text-kv-ink-muted" />
              </span>
              <span className="block p-3">
                <span className="block truncate text-sm font-semibold leading-tight">{p.name}</span>
                {p.description && (
                  <span className="mt-0.5 block truncate text-xs text-kv-ink-muted">{p.description}</span>
                )}
                <span className="mt-1.5 block font-mono text-[10px] text-kv-ink-muted">
                  {p.trackCount ?? p.track_count ?? p.tracks?.length ?? 0} lagu
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Playlist baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Malam santai"
            maxLength={80}
            required
            autoFocus
          />
          <Input
            label="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lagu-lagu untuk…"
            maxLength={200}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={busy || !name.trim()}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Buat
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Playlists;
import { useEffect, useState } from 'react';
import { ListPlus, Plus, Loader2, Music2 } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import EmptyState from './ui/EmptyState';
import { useModalStore } from '../stores/modals';
import { usePlaylistStore } from '../stores/playlist';
import { useAuthStore } from '../stores/auth';
import { ensureYouTubeTrack } from '../services/supabaseMusicApi';
import { toast } from '../stores/toast';

const AddToPlaylistModal = () => {
  const track = useModalStore((s) => s.addToPlaylistTrack);
  const close = useModalStore((s) => s.closeAddToPlaylist);
  const user = useAuthStore((s) => s.user);
  const { playlists, loading, loadUserPlaylists, createPlaylist, addSongToPlaylist } = usePlaylistStore();
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);

  const open = !!track;

  useEffect(() => {
    if (open && user) {
      setNewName('');
      loadUserPlaylists(user.id).catch(() => {});
    }
  }, [open, user?.id]);

  const addTo = async (playlist) => {
    if (!track || !user) return;
    setBusyId(playlist.id);
    try {
      let musicId = track.id;
      if (track.source === 'youtube' && String(track.id).startsWith('yt:')) {
        const row = await ensureYouTubeTrack(track, user.id);
        musicId = row.id;
      }
      await addSongToPlaylist(playlist.id, musicId);
      toast.success(`Ditambahkan ke "${playlist.name}"`);
      close();
    } catch (err) {
      const msg = String(err?.message || '');
      toast.error(
        msg.includes('duplicate') || msg.includes('unique')
          ? 'Lagu sudah ada di playlist itu'
          : 'Gagal menambahkan ke playlist'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !user) return;
    setCreating(true);
    try {
      const playlist = await createPlaylist(user.id, { name });
      setNewName('');
      await addTo(playlist);
    } catch {
      toast.error('Gagal membuat playlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Tambah ke playlist">
      {track && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-kv border-3 border-kv-ink bg-kv-muted p-2.5">
            <span className="block h-10 w-10 shrink-0 overflow-hidden rounded border-2 border-kv-ink bg-kv-surface">
              {track.albumArt ? (
                <img src={track.albumArt} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <Music2 size={16} />
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{track.title}</span>
              <span className="block truncate text-xs text-kv-ink-muted">{track.artist}</span>
            </span>
          </div>

          <div className="flex items-end gap-2">
            <Input
              label="Playlist baru"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama playlist…"
              maxLength={80}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
            <Button
              size="md"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="shrink-0"
              aria-label="Buat playlist dan tambahkan lagu"
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </Button>
          </div>

          <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
            {loading && playlists.length === 0 && (
              <p className="py-4 text-center font-mono text-xs uppercase tracking-widest text-kv-ink-muted">
                Memuat playlist…
              </p>
            )}
            {!loading && playlists.length === 0 && (
              <EmptyState
                icon={ListPlus}
                title="Belum ada playlist"
                description="Buat playlist pertama lewat kolom di atas."
                className="py-8"
              />
            )}
            {playlists.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addTo(p)}
                disabled={!!busyId}
                className="kv-press flex min-h-[52px] w-full items-center gap-3 rounded-kv border-3 border-kv-ink bg-kv-surface px-3 py-2 text-left shadow-kv hover:bg-kv-muted disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 border-kv-ink bg-kv-purple">
                  <ListPlus size={16} className="text-[#0a0a0a]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{p.name}</span>
                  <span className="block font-mono text-[11px] text-kv-ink-muted">
                    {p.trackCount ?? p.track_count ?? 0} lagu
                  </span>
                </span>
                {busyId === p.id && <Loader2 size={18} className="animate-spin" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AddToPlaylistModal;
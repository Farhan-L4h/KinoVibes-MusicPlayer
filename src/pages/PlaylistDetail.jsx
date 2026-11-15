import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ListMusic,
  Play,
  Shuffle,
  Pencil,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react';
import { usePlaylistStore } from '../stores/playlist';
import { getPlaylistWithTracks, reorderPlaylistTracks } from '../services/supabasePlaylistApi';
import { transformMusicData } from '../services/supabaseMusicApi';
import { useTrackActions } from '../hooks/useTrackActions';
import { formatTotalDuration } from '../lib/utils';
import TrackRow from '../components/TrackRow';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { TrackRowSkeleton } from '../components/ui/Skeleton';
import { toast } from '../stores/toast';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const actions = useTrackActions();
  const { updatePlaylist, deletePlaylist, removeSongFromPlaylist } = usePlaylistStore();

  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await getPlaylistWithTracks(id);
      setPlaylist(data);
      setTracks((data.tracks || []).map(transformMusicData).filter(Boolean));
      setName(data.name || '');
      setDescription(data.description || '');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const move = async (from, to) => {
    if (to < 0 || to >= tracks.length) return;
    const next = [...tracks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setTracks(next);
    try {
      await reorderPlaylistTracks(id, next.map((t) => t.id));
    } catch {
      toast.error('Gagal menyimpan urutan. Memuat ulang…');
      load();
    }
  };

  const removeTrack = async (track) => {
    const prev = tracks;
    setTracks(tracks.filter((t) => t.id !== track.id));
    try {
      await removeSongFromPlaylist(id, track.id);
      toast.success('Lagu dihapus dari playlist');
    } catch {
      setTracks(prev);
      toast.error('Gagal menghapus lagu dari playlist');
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await updatePlaylist(id, { name: name.trim(), description: description.trim() || null });
      setPlaylist((p) => ({ ...p, name: name.trim(), description: description.trim() || null }));
      toast.success('Playlist diperbarui');
      setRenaming(false);
    } catch {
      toast.error('Gagal memperbarui playlist');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlaylist(id);
      toast.success('Playlist dihapus');
      navigate('/playlists');
    } catch {
      toast.error('Gagal menghapus playlist');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-40 motion-safe:animate-pulse rounded-kv bg-kv-muted" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <TrackRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (notFound || !playlist) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={ListMusic}
          title="Playlist belum tersedia"
          description="Playlist mungkin sudah dihapus, atau koneksi sedang terputus."
          action={<div className="flex flex-wrap justify-center gap-2"><Button size="sm" onClick={load}>Coba lagi</Button><Button size="sm" variant="secondary" onClick={() => navigate('/playlists')}><ArrowLeft size={15} /> Kembali</Button></div>}
        />
      </div>
    );
  }

  const totalDuration = tracks.reduce((a, t) => a + (t.duration || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() => navigate('/playlists')}
        className="flex items-center gap-1.5 min-h-11 font-mono text-xs text-kv-ink-muted hover:text-kv-ink"
      >
        <ArrowLeft size={14} /> Semua playlist
      </button>

      <header className="kv-card flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-6">
        <span className="flex h-36 w-36 shrink-0 items-center justify-center rounded-kv border border-kv-line bg-kv-muted sm:h-44 sm:w-44">
          <ListMusic size={56} className="text-kv-ink-muted" />
        </span>
        <div className="min-w-0 flex-1">
          <Badge tone="surface">Playlist</Badge>
          <h1 className="mt-2 break-words font-display text-xl leading-relaxed sm:text-2xl">{playlist.name}</h1>
          {playlist.description && <p className="mt-1 text-sm text-kv-ink-muted">{playlist.description}</p>}
          <p className="mt-1 font-mono text-xs text-kv-ink-muted">
            {tracks.length} lagu · {formatTotalDuration(totalDuration)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => actions.playAll(tracks)} disabled={tracks.length === 0}>
              <Play size={15} /> Putar semua
            </Button>
            <Button size="sm" variant="secondary" onClick={() => actions.shuffleAll(tracks)} disabled={tracks.length === 0}>
              <Shuffle size={15} /> Acak
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRenaming(true)}>
              <Pencil size={15} /> Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(true)}>
              <Trash2 size={15} /> Hapus
            </Button>
          </div>
        </div>
      </header>

      {tracks.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Playlist kosong"
          description="Tambahkan lagu lewat menu lagu dari library atau hasil pencarian YouTube."
          action={<Button size="sm" onClick={() => navigate('/search')}><Plus size={15} /> Cari lagu</Button>}
        />
      ) : (
        <div className="space-y-1.5">
          {tracks.map((t, i) => (
            <TrackRow
              key={`${t.id}-${i}`}
              track={t}
              index={i}
              list={tracks}
              onRemove={() => removeTrack(t)}
              removeLabel="Hapus dari playlist"
              onMoveUp={() => move(i, i - 1)}
              onMoveDown={() => move(i, i + 1)}
              isFirst={i === 0}
              isLast={i === tracks.length - 1}
            />
          ))}
        </div>
      )}

      <Modal open={renaming} onClose={() => setRenaming(false)} title="Edit playlist">
        <form onSubmit={handleRename} className="space-y-4">
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          <Input
            label="Deskripsi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="Opsional"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRenaming(false)} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={busy || !name.trim()}>
              {busy && <Loader2 size={16} className="animate-spin" />} Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        title="Hapus playlist?"
        message={`Playlist "${playlist.name}" beserta urutan lagunya akan dihapus. Lagu di dalamnya tetap aman di library.`}
      />
    </div>
  );
};

export default PlaylistDetail;
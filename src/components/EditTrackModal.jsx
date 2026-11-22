import { useEffect, useState, useRef } from 'react';
import { Save, Loader2, Image as ImageIcon, FileText, Music2, Disc3, User, Tag, UploadCloud, X } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { useModalStore } from '../stores/modals';
import { useAuthStore } from '../stores/auth';
import { useMusicStore } from '../stores/music';
import { updateMusic } from '../services/supabaseMusicApi';
import { uploadFile, getSignedUrl, BUCKETS } from '../config/supabase';
import { invalidateLyricsCache } from '../services/lyricsApi';
import { isLrcFormat } from '../lib/lrc';
import { toast } from '../stores/toast';

const EditTrackModal = () => {
  const track = useModalStore((s) => s.editTrack);
  const closeEditTrack = useModalStore((s) => s.closeEditTrack);
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsFile, setLyricsFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  const coverInputRef = useRef(null);
  const lyricsInputRef = useRef(null);

  const open = !!track;

  useEffect(() => {
    if (!track || !open) return;
    setTitle(track.title || '');
    setArtist(track.artist || '');
    setAlbum(track.album || '');
    setGenre(track.genre || '');
    setCoverPreview(track.albumArt || null);
    setCoverFile(null);
    setLyricsFile(null);
    setLyricsText('');

    if (track.lyricsPath || track.lyricsUrl) {
      setLoadingLyrics(true);
      (async () => {
        try {
          const url = track.lyricsPath
            ? await getSignedUrl(BUCKETS.LYRICS, track.lyricsPath)
            : track.lyricsUrl;
          if (url) {
            const res = await fetch(url);
            if (res.ok) {
              const txt = await res.text();
              setLyricsText(txt);
            }
          }
        } catch {
          // ignore lyrics load failure
        } finally {
          setLoadingLyrics(false);
        }
      })();
    }
  }, [track, open]);

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleLyricsFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLyricsFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLyricsText(ev.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!track || !user) return;
    if (!title.trim()) {
      toast.error('Judul lagu tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      const timestamp = Date.now();
      const updates = {
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        album: album.trim() || 'Single',
        genre: genre.trim() || 'Unknown',
      };

      // 1. Upload new cover art if selected
      if (coverFile) {
        const sanitizedCover = coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const coverPath = `${user.id}/${timestamp}_${sanitizedCover}`;
        const coverUpload = await uploadFile(BUCKETS.ALBUM_ART, coverPath, coverFile);
        updates.album_art = coverUpload.publicUrl;
        updates.album_art_path = coverUpload.path;
      }

      // 2. Upload new lyrics if changed
      if (lyricsText.trim()) {
        const lrcPath = `${user.id}/${timestamp}_manual.lrc`;
        const blob = new Blob([lyricsText.trim()], { type: 'text/plain' });
        const file = new File([blob], 'lyrics.lrc', { type: 'text/plain' });
        const lyricsUpload = await uploadFile(BUCKETS.LYRICS, lrcPath, file);
        updates.lyrics_url = lyricsUpload.publicUrl;
        updates.lyrics_path = lyricsUpload.path;
        invalidateLyricsCache(track.id);
      }

      // 3. Update database row
      const updated = await updateMusic(track.id, updates);

      // 4. Update player state if currently playing
      const store = useMusicStore.getState();
      if (store.currentTrack?.id === track.id) {
        useMusicStore.setState({
          currentTrack: { ...store.currentTrack, ...updated },
        });
      }
      const updateList = (list) => list.map((t) => (t.id === track.id ? { ...t, ...updated } : t));
      useMusicStore.setState({
        playlist: updateList(store.playlist),
        queue: updateList(store.queue),
      });

      // 5. Notify any listening views (e.g. Library)
      window.dispatchEvent(new CustomEvent('kv-track-updated', { detail: updated }));

      toast.success('Lagu berhasil diperbarui');
      closeEditTrack();
    } catch (err) {
      console.error('Update track error:', err);
      toast.error(err.message || 'Gagal memperbarui lagu');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !track) return null;
  const lrc = isLrcFormat(lyricsText);

  return (
    <Modal open={open} onClose={closeEditTrack} title="Edit informasi lagu" wide>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Cover Art & Basic Info */}
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          {/* Cover Art Upload / Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative aspect-square w-full max-w-[140px] overflow-hidden rounded-kv border border-kv-line bg-kv-surface shadow-sm">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt={`Sampul ${title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-kv-ink-muted">
                  <ImageIcon size={36} />
                </div>
              )}
              {coverFile && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(track.albumArt || null);
                  }}
                  title="Batalkan ganti gambar"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => coverInputRef.current?.click()}
            >
              <UploadCloud size={13} />
              {coverFile ? 'Ganti lagi' : 'Ganti gambar'}
            </Button>
          </div>

          {/* Form Fields: Title, Artist, Album, Genre */}
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-title" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-kv-ink-muted">
                <Music2 size={13} /> Judul lagu
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-kv border border-kv-line bg-kv-surface px-3 py-2 text-sm text-kv-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
                placeholder="Judul lagu"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-artist" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-kv-ink-muted">
                  <User size={13} /> Artis
                </label>
                <input
                  id="edit-artist"
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full rounded-kv border border-kv-line bg-kv-surface px-3 py-2 text-sm text-kv-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
                  placeholder="Nama artis"
                />
              </div>
              <div>
                <label htmlFor="edit-album" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-kv-ink-muted">
                  <Disc3 size={13} /> Album
                </label>
                <input
                  id="edit-album"
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full rounded-kv border border-kv-line bg-kv-surface px-3 py-2 text-sm text-kv-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
                  placeholder="Nama album"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-genre" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-kv-ink-muted">
                <Tag size={13} /> Genre
              </label>
              <input
                id="edit-genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-kv border border-kv-line bg-kv-surface px-3 py-2 text-sm text-kv-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
                placeholder="Genre musik (cth. Pop, Rock, Indie)"
              />
            </div>
          </div>
        </div>

        {/* Lyrics Editor Section */}
        <div className="space-y-2 border-t border-kv-line pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="edit-lyrics" className="flex items-center gap-1.5 text-xs font-semibold text-kv-ink">
              <FileText size={14} /> Lirik lagu (Teks biasa atau .LRC tersinkron)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={lyricsInputRef}
                type="file"
                accept=".lrc,.txt"
                onChange={handleLyricsFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => lyricsInputRef.current?.click()}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-kv-ink-muted underline hover:text-kv-ink"
              >
                <UploadCloud size={12} /> Upload file lirik (.lrc/.txt)
              </button>
            </div>
          </div>

          <p className="text-xs text-kv-ink-muted">
            Tambahkan timestamp <code className="rounded border border-kv-line bg-kv-muted px-1 font-mono text-[11px]">[mm:ss.xx]</code> di
            awal baris untuk membuat lirik tersinkron otomatis saat diputar.
          </p>

          <textarea
            id="edit-lyrics"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            rows={7}
            placeholder={loadingLyrics ? 'Memuat lirik saat ini…' : '[00:12.50] Baris lirik tersinkron\n[00:16.80] Baris berikutnya\n\nAtau tempel teks lirik biasa.'}
            className="w-full rounded-kv border border-kv-line bg-kv-surface p-2.5 font-mono text-xs text-kv-ink placeholder:text-kv-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            {lyricsText.trim() ? (
              lrc ? (
                <Badge tone="surface">Format LRC (Tersinkron)</Badge>
              ) : (
                <Badge tone="surface">Teks biasa</Badge>
              )
            ) : (
              <span className="text-xs text-kv-ink-muted">Belum ada lirik</span>
            )}
            {lyricsFile && (
              <span className="font-mono text-xs text-kv-ink-muted">
                File: {lyricsFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 border-t border-kv-line pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={closeEditTrack} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Menyimpan…' : 'Simpan perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTrackModal;

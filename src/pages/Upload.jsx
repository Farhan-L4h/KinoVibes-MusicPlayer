import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  FileAudio,
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  Play,
  Music2,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { uploadMusic, isValidAudioFile, isValidImageFile, isValidLyricsFile } from '../services/supabaseMusicApi';
import { useTrackActions } from '../hooks/useTrackActions';
import { cleanTitle, cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { toast } from '../stores/toast';

const STAGES = [
  { key: 'audio', label: 'Audio' },
  { key: 'cover', label: 'Sampul' },
  { key: 'lyrics', label: 'Lirik' },
  { key: 'save', label: 'Simpan' },
];

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Upload = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const actions = useTrackActions();

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [lyricsFile, setLyricsFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const lyricsInputRef = useRef(null);

  const pickAudio = (file) => {
    if (!file) return;
    if (!isValidAudioFile(file)) {
      toast.error('Format audio tidak didukung. Pakai MP3, WAV, OGG, M4A, AAC, atau FLAC.');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      toast.error('Ukuran maksimal 60 MB.');
      return;
    }
    setAudioFile(file);
    setDone(null);
    const guess = cleanTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' '));
    if (!title) setTitle(guess);
    const url = URL.createObjectURL(file);
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      setDuration(Math.round(probe.duration) || 0);
      URL.revokeObjectURL(url);
    };
    probe.onerror = () => URL.revokeObjectURL(url);
    probe.src = url;
  };

  const pickCover = (file) => {
    if (!file) return;
    if (!isValidImageFile(file)) {
      toast.error('Sampul harus JPG, PNG, WEBP, atau GIF.');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const pickLyrics = (file) => {
    if (!file) return;
    if (!isValidLyricsFile(file)) {
      toast.error('Lirik harus file .lrc atau .txt.');
      return;
    }
    setLyricsFile(file);
  };

  const reset = () => {
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setLyricsFile(null);
    setDuration(0);
    setTitle('');
    setArtist('');
    setAlbum('');
    setGenre('');
    setStage(null);
    setDone(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error('Pilih file audio dulu.');
      return;
    }
    if (!title.trim() || !artist.trim()) {
      toast.error('Judul dan artis wajib diisi.');
      return;
    }
    setBusy(true);
    setStage('audio');
    try {
      const track = await uploadMusic(
        audioFile,
        coverFile,
        lyricsFile,
        {
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || 'Unknown Album',
          genre: genre.trim() || 'Unknown',
          duration,
        },
        user.id,
        (s) => setStage(s)
      );
      toast.success(`"${track.title}" berhasil diupload!`);
      setDone(track);
      setStage(null);
    } catch (err) {
      console.error('upload error:', err);
      toast.error(err.message || 'Gagal mengupload lagu.');
      setStage(null);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="kv-card p-6 text-center sm:p-8">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-kv-line bg-kv-muted">
            <CheckCircle2 size={32} className="text-kv-ink" />
          </span>
          <h1 className="mt-4 font-display text-xl leading-relaxed">Upload berhasil!</h1>
          <p className="mt-2 text-sm text-kv-ink-muted">
            <strong className="text-kv-ink">{done.title}</strong>, {done.artist} sudah masuk library kamu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => actions.play(done, [done])}>
              <Play size={15} /> Putar sekarang
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              <UploadIcon size={15} /> Upload lagi
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/library')}>
              <Music2 size={15} /> Ke library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Upload lagu</h1>
        <p className="mt-1 text-sm text-kv-ink-muted">
          Lagu milikmu sendiri, bisa diputar, difavoritkan, masuk playlist, dan diunduh.
        </p>
      </header>

      <div className="flex items-start gap-2.5 rounded-kv border border-kv-line bg-kv-surface p-3">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          Lagu dari YouTube hanya bisa distreaming (tidak diunduh) sesuai ketentuan YouTube. Fitur unduh berlaku untuk lagu yang kamu upload di sini.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickAudio(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'rounded-kv-lg border border-dashed p-6 text-center transition-colors',
            dragging ? 'border-kv-ink bg-kv-muted' : audioFile ? 'border-kv-ink bg-kv-panel' : 'border-kv-line bg-kv-surface'
          )}
        >
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*"
            className="hidden"
            onChange={(e) => pickAudio(e.target.files?.[0])}
          />
          {audioFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileAudio size={28} className="shrink-0" />
              <div className="min-w-0 text-left">
                <p className="truncate font-bold">{audioFile.name}</p>
                <p className="font-mono text-xs text-kv-ink-muted">
                  {formatSize(audioFile.size)}
                  {duration > 0 && ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAudioFile(null);
                  setDuration(0);
                }}
                aria-label="Hapus file audio"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-kv-line bg-kv-surface hover:bg-kv-muted hover:text-kv-danger"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => audioInputRef.current?.click()} className="w-full">
              <UploadIcon size={36} className="mx-auto" />
              <p className="mt-3 text-sm font-semibold">Tarik file audio ke sini</p>
              <p className="mt-1 text-xs text-kv-ink-muted">atau klik untuk pilih, MP3, WAV, OGG, M4A, AAC, FLAC · maks 60 MB</p>
            </button>
          )}
        </div>

        <div className="kv-card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Input label="Judul *" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required placeholder="Judul lagu" />
          <Input label="Artis *" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={150} required placeholder="Nama artis" />
          <Input label="Album" value={album} onChange={(e) => setAlbum(e.target.value)} maxLength={150} placeholder="Nama album (opsional)" />
          <Input label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} maxLength={60} placeholder="Pop, Jazz, … (opsional)" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="kv-card p-4">
            <p className="mb-2 font-display text-xs">Sampul album</p>
            <input ref={coverInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/*" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
            <div className="flex items-center gap-3">
              <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-kv border border-kv-line bg-kv-muted">
                {coverPreview ? (
                  <img src={coverPreview} alt="Pratinjau sampul" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center"><ImageIcon size={22} className="text-kv-ink-muted" /></span>
                )}
              </span>
              <div className="flex flex-col gap-1.5">
                <Button type="button" size="sm" variant="ghost" onClick={() => coverInputRef.current?.click()}>
                  <ImageIcon size={14} /> Pilih gambar
                </Button>
                {coverFile && (
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-left min-h-11 font-mono text-xs text-kv-danger underline">
                    Hapus sampul
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="kv-card p-4">
            <p className="mb-2 font-display text-xs">File lirik</p>
            <input ref={lyricsInputRef} type="file" accept=".lrc,.txt" className="hidden" onChange={(e) => pickLyrics(e.target.files?.[0])} />
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-kv border border-kv-line bg-kv-muted">
                <FileText size={22} className={lyricsFile ? 'text-kv-ink' : 'text-kv-ink-muted'} />
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Button type="button" size="sm" variant="ghost" onClick={() => lyricsInputRef.current?.click()}>
                  <FileText size={14} /> Pilih .lrc / .txt
                </Button>
                {lyricsFile ? (
                  <span className="flex items-center gap-1 truncate font-mono text-[10px] font-bold">
                    <Badge tone="surface">{lyricsFile.name.split('.').pop().toUpperCase()}</Badge>
                    <button type="button" onClick={() => setLyricsFile(null)} aria-label="Hapus file lirik" className="text-kv-danger underline">hapus</button>
                  </span>
                ) : (
                  <span className="text-[11px] text-kv-ink-muted">.lrc = lirik tersinkron</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {busy && (
          <div className="kv-card flex items-center gap-2 p-4">
            {STAGES.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-kv-line font-mono text-xs',
                    i < stageIndex ? 'bg-kv-muted text-kv-ink' : i === stageIndex ? 'bg-kv-ink text-kv-panel' : 'bg-kv-surface text-kv-ink-muted'
                  )}
                >
                  {i < stageIndex ? <CheckCircle2 size={14} /> : i === stageIndex ? <Loader2 size={14} className="animate-spin" /> : i + 1}
                </span>
                <span className="hidden font-mono text-[10px] sm:block">{s.label}</span>
                {i < STAGES.length - 1 && <span className="h-px flex-1 bg-kv-line" />}
              </div>
            ))}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy || !audioFile}>
          {busy ? <Loader2 size={20} className="animate-spin" /> : <UploadIcon size={20} />}
          {busy ? 'Mengupload…' : 'Upload lagu'}
        </Button>
      </form>
    </div>
  );
};

export default Upload;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  KeyRound,
  Loader2,
  Save,
  Sun,
  Moon,
  Monitor,
  Music2,
  Heart,
  ListMusic,
  Keyboard,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useFavoritesStore } from '../stores/favorites';
import { usePlaylistStore } from '../stores/playlist';
import { useMusicStore } from '../stores/music';
import { useThemeStore } from '../hooks/useTheme';
import { updateProfile, updatePassword, signOut } from '../services/supabaseAuth';
import { getUserMusic } from '../services/supabaseMusicApi';
import { initials, cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import SpotifyCard from '../components/SpotifyCard';
import { toast } from '../stores/toast';

const SHORTCUTS = [
  ['Spasi', 'Putar / jeda'],
  ['← / →', 'Mundur / maju 5 detik'],
  ['Shift + ← / →', 'Lagu sebelumnya / berikutnya'],
  ['M', 'Bisukan / bunyikan'],
  ['L', 'Buka lirik'],
  ['/', 'Buka pencarian'],
];

const THEMES = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
];

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const favCount = useFavoritesStore((s) => s.tracks.length);
  const playlistCount = usePlaylistStore((s) => s.playlists.length);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [uploadCount, setUploadCount] = useState(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const displayName =
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kamu';

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!user) return;
    getUserMusic(user.id)
      .then((list) => setUploadCount(list.length))
      .catch(() => setUploadCount('Tidak tersedia'));
  }, [user?.id]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await updateProfile({ display_name: name.trim(), full_name: name.trim() });
      setUser({
        ...user,
        user_metadata: { ...user.user_metadata, display_name: name.trim(), full_name: name.trim() },
      });
      toast.success('Nama diperbarui');
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui nama');
    } finally {
      setSavingName(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success('Kata sandi diganti');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Gagal mengganti kata sandi');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      useMusicStore.getState().stopAndClear();
      useFavoritesStore.getState().clear();
      usePlaylistStore.getState().clearPlaylists();
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Gagal keluar. Coba lagi.');
    }
  };

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="kv-card flex flex-wrap items-center gap-5 p-5 sm:p-6">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-kv-line bg-kv-muted font-display text-xl text-kv-ink">
          {initials(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl leading-relaxed sm:text-2xl">{displayName}</h1>
          <p className="truncate text-sm text-kv-ink-muted">{user?.email}</p>
          {joined && (
            <p className="mt-1 font-mono text-[11px] text-kv-ink-muted">
              Bergabung {joined}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut size={15} /> Keluar
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Music2, label: 'Lagu upload', value: uploadCount },
          { icon: Heart, label: 'Favorit', value: favCount },
          { icon: ListMusic, label: 'Playlist', value: playlistCount },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="kv-card p-3 text-center sm:p-4">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-kv-muted">
              <Icon size={18} className="text-kv-ink" />
            </span>
            <p className={`mt-2 ${typeof value === 'number' ? 'font-display text-2xl' : 'text-xs text-kv-ink-muted'}`}>{value ?? 'Memuat…'}</p>
            <p className="text-xs text-kv-ink-muted">{label}</p>
          </div>
        ))}
      </div>

      <SpotifyCard />

      <section className="kv-card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm leading-relaxed">
          <User size={18} /> Nama tampilan
        </h2>
        <form onSubmit={handleSaveName} className="flex flex-wrap items-end gap-2">
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          <Button type="submit" size="md" disabled={savingName || !name.trim()} className="shrink-0">
            {savingName ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan
          </Button>
        </form>
      </section>

      <section className="kv-card p-4 sm:p-5">
        <h2 className="mb-3 font-display text-sm leading-relaxed">Tema</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              className={cn(
                'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-kv border px-2 py-2 font-semibold transition-colors',
                theme === value ? 'border-kv-ink bg-kv-ink text-kv-panel' : 'border-kv-line bg-kv-surface text-kv-ink hover:bg-kv-muted'
              )}
            >
              <Icon size={18} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="kv-card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm leading-relaxed">
          <KeyRound size={18} /> Ganti kata sandi
        </h2>
        <form onSubmit={handlePassword} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Kata sandi baru"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
            />
            <Input
              label="Ulangi"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Ketik ulang"
            />
          </div>
          <Button type="submit" size="sm" disabled={savingPassword || !newPassword}>
            {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
            Ganti sandi
          </Button>
        </form>
      </section>

      <section className="kv-card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm leading-relaxed">
          <Keyboard size={18} /> Pintasan keyboard
        </h2>
        <ul className="space-y-2">
          {SHORTCUTS.map(([key, desc]) => (
            <li key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-kv-ink-muted">{desc}</span>
              <Badge tone="surface">{key}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Profile;
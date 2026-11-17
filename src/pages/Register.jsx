import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { signUp } from '../services/supabaseAuth';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';

const friendlyError = (msg) => {
  const m = String(msg || '').toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email sudah terdaftar. Coba masuk.';
  if (m.includes('password') && m.includes('6')) return 'Kata sandi minimal 6 karakter.';
  if (m.includes('valid email')) return 'Format email tidak valid.';
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Tunggu sebentar lagi.';
  return msg || 'Gagal mendaftar. Coba lagi.';
};

const Register = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Semua kolom wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await signUp(email.trim(), password, name.trim());
      if (data?.session || data?.user?.identities?.length) {
        toast.info('Akun dibuat. Menunggu persetujuan admin sebelum bisa masuk.');
      } else {
        toast.info('Cek email kamu untuk konfirmasi, lalu tunggu persetujuan admin.');
      }
      navigate('/login');
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-kv-lg border border-kv-line bg-kv-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl leading-relaxed">Daftar</h2>
        <p className="mt-1 text-sm text-kv-ink-muted">
          Bikin akun dulu. Admin menyetujui pendaftaranmu, baru kamu bisa masuk dan mulai koleksi musik.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-kv border border-kv-line bg-kv-panel px-3 py-2.5 text-sm text-kv-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Input
            label="Nama tampilan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            autoComplete="name"
            maxLength={60}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            autoComplete="email"
            required
          />
          <Input
            label="Kata sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete="new-password"
            required
          />
          <Input
            label="Ulangi kata sandi"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ketik ulang kata sandi"
            autoComplete="new-password"
            required
          />
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
            Buat akun
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-kv-ink-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="px-1 py-4 font-bold text-kv-ink underline decoration-kv-line-strong underline-offset-2">
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Register;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import { updatePassword } from '../services/supabaseAuth';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';

const friendlyError = (msg) => {
  const m = String(msg || '').toLowerCase();
  if (m.includes('password') && m.includes('6')) return 'Kata sandi minimal 6 karakter.';
  if (m.includes('different from the old')) return 'Kata sandi baru harus berbeda dari yang lama.';
  if (m.includes('session') || m.includes('refresh')) return 'Tautan reset sudah kedaluwarsa. Minta tautan baru.';
  return msg || 'Gagal menyimpan kata sandi. Coba lagi.';
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updatePassword(password);
      toast.success('Kata sandi diperbarui.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-kv-lg border border-kv-line bg-kv-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl leading-relaxed">Kata sandi baru</h2>

        {loading ? (
          <div className="py-10"><LoadingSpinner /></div>
        ) : !user ? (
          <div className="mt-5 space-y-4">
            <div role="alert" className="flex items-start gap-3 rounded-kv border border-kv-line bg-kv-panel px-4 py-3 text-sm">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-kv-danger" aria-hidden="true" />
              <p className="leading-relaxed">Tautan reset tidak berlaku atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk.</p>
            </div>
            <Button className="w-full" onClick={() => navigate('/login')}>
              <ArrowLeft size={16} /> Kembali ke masuk
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-kv-ink-muted">Buat kata sandi baru untuk akun kamu.</p>

            {error && (
              <div role="alert" className="mt-4 rounded-kv border border-kv-line bg-kv-panel px-3 py-2.5 text-sm text-kv-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Input
                label="Kata sandi baru"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                maxLength={72}
                required
              />
              <Input
                label="Ulangi kata sandi"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                maxLength={72}
                required
              />
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? <Loader2 size={20} className="animate-spin" /> : <KeyRound size={20} />}
                Simpan kata sandi
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-kv-ink-muted">
          Ingat kata sandi kamu?{' '}
          <Link to="/login" className="px-1 py-4 font-bold text-kv-ink underline decoration-kv-line-strong underline-offset-2">
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ResetPassword;
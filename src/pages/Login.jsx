import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { signIn, signInWithGoogle, resetPassword } from '../services/supabaseAuth';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.61l4 3.1C6.23 6.87 8.88 4.76 12 4.76Z" />
  </svg>
);

const friendlyError = (msg) => {
  const m = String(msg || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email atau kata sandi salah.';
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk kamu.';
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Tunggu sebentar lagi.';
  return msg || 'Gagal masuk. Coba lagi.';
};

const Login = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyError(err.message));
      setGoogleBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Isi email dulu untuk reset kata sandi.');
      return;
    }
    setResetBusy(true);
    try {
      await resetPassword(email.trim());
      toast.success('Link reset dikirim. Cek email kamu.');
      setForgot(false);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="kv-card animate-pop-in p-6 sm:p-8">
        <h2 className="font-display text-3xl uppercase">Masuk</h2>
        <p className="mt-1 text-sm text-kv-ink-muted">Lanjutkan sesi musik kamu.</p>

        {error && (
          <div role="alert" className="mt-4 rounded-kv border-3 border-kv-ink bg-kv-red px-3 py-2.5 text-sm font-bold text-white">
            {error}
          </div>
        )}

        {forgot ? (
          <form onSubmit={handleReset} className="mt-5 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              autoComplete="email"
            />
            <Button type="submit" className="w-full" disabled={resetBusy}>
              {resetBusy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              Kirim link reset
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setForgot(false)}>
              <ArrowLeft size={16} /> Kembali ke login
            </Button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="text-xs font-bold text-kv-ink-muted underline decoration-2 underline-offset-2 hover:text-kv-ink"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                Masuk
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-[3px] flex-1 bg-kv-ink" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-kv-ink-muted">atau</span>
              <span className="h-[3px] flex-1 bg-kv-ink" />
            </div>

            <Button type="button" variant="ghost" className="w-full" onClick={handleGoogle} disabled={googleBusy}>
              {googleBusy ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
              Lanjut dengan Google
            </Button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-kv-ink-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="font-bold text-kv-ink underline decoration-kv-pink decoration-3 underline-offset-2">
            Daftar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Login;
import { useCallback, useEffect, useState } from 'react';
import { AudioLines, Link2, Unlink, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useMusicStore } from '../stores/music';
import { usePlaylistStore } from '../stores/playlist';
import { spotifyPlayer } from '../player/spotify';
import {
  isSpotifyConfigured,
  isSpotifyConnected,
  spotifyRedirectUri,
  beginSpotifyLogin,
  completeSpotifyLogin,
  disconnectSpotify,
  getSpotifyProfile,
  importSpotifyLibrary,
} from '../services/spotifyApi';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { toast } from '../stores/toast';

const SpotifyCard = () => {
  const user = useAuthStore((s) => s.user);
  const [connected, setConnected] = useState(() => isSpotifyConnected());
  const [profile, setProfile] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const configured = isSpotifyConfigured();

  const refreshProfile = useCallback(() => {
    if (!isSpotifyConnected()) return;
    getSpotifyProfile()
      .then((p) => {
        setProfile(p);
        setConnected(true);
      })
      .catch(() => {
        setConnected(isSpotifyConnected());
      });
  }, []);

  // OAuth redirect lands back on /profile?code=…
  useEffect(() => {
    let cancelled = false;
    completeSpotifyLogin()
      .then((done) => {
        if (cancelled || !done) return;
        toast.success('Spotify terhubung.');
        refreshProfile();
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message || 'Gagal menghubungkan Spotify.');
      });
    return () => { cancelled = true; };
  }, [refreshProfile]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await beginSpotifyLogin();
    } catch (err) {
      toast.error(err.message || 'Gagal memulai login Spotify.');
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    const music = useMusicStore.getState();
    if (music.currentTrack?.source === 'spotify') music.pause();
    spotifyPlayer.disconnect();
    disconnectSpotify();
    setConnected(false);
    setProfile(null);
    toast.info('Spotify diputuskan.');
  };

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);
    setProgress('Menghubungkan ke Spotify…');
    try {
      const report = await importSpotifyLibrary(user.id, { onProgress: setProgress });
      await usePlaylistStore.getState().loadUserPlaylists(user.id).catch(() => {});
      toast.success(`Impor selesai: ${report.tracks} lagu, ${report.playlists} playlist${report.skipped ? `, ${report.skipped} dilewati (sudah ada)` : ''}.`);
    } catch (err) {
      toast.error(err.message || 'Impor dari Spotify gagal.');
    } finally {
      setImporting(false);
      setProgress('');
    }
  };

  const premium = profile?.product === 'premium';

  return (
    <section className="kv-card p-4 sm:p-5" aria-label="Integrasi Spotify">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm leading-relaxed">
        <AudioLines size={18} /> Spotify
      </h2>

      {!configured ? (
        <div className="space-y-2 text-sm leading-relaxed text-kv-ink-muted">
          <p>Integrasi Spotify siap, tapi butuh satu langkah setup dari pemilik aplikasi:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Buat aplikasi di <span className="font-mono text-xs">developer.spotify.com/dashboard</span>.</li>
            <li>Tambahkan Redirect URI: <span className="break-all font-mono text-xs">{spotifyRedirectUri()}</span></li>
            <li>Set env <span className="font-mono text-xs">VITE_SPOTIFY_CLIENT_ID</span> lalu deploy ulang.</li>
          </ol>
          <p className="text-xs">Login memakai OAuth PKCE — tanpa client secret di frontend.</p>
        </div>
      ) : !connected ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-kv-ink-muted">
            Hubungkan akun Spotify untuk memutar katalog Spotify langsung di KinoVibe, tanpa iklan, dan impor lagu serta playlist favoritmu ke library.
          </p>
          <ul className="space-y-1 text-xs text-kv-ink-muted">
            <li>• Spotify Premium: lagu penuh, streaming resmi tanpa iklan.</li>
            <li>• Akun gratis: preview 30 detik bila tersedia.</li>
          </ul>
          <Button size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
            Hubungkan Spotify
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 size={16} className="text-kv-success" aria-hidden="true" />
            <span className="text-sm font-semibold">{profile?.display_name || 'Terhubung'}</span>
            {profile && (
              <Badge tone={premium ? 'success' : 'surface'}>{premium ? 'Premium' : 'Free'}</Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-kv-ink-muted">
            {premium
              ? 'Lagu penuh diputar lewat pemutar resmi Spotify — tanpa iklan.'
              : 'Akun gratis memutar preview 30 detik bila tersedia. Upgrade ke Premium untuk lagu penuh tanpa iklan.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Impor library & playlist
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDisconnect} disabled={importing}>
              <Unlink size={15} /> Putuskan
            </Button>
          </div>
          {progress && <p role="status" className="font-mono text-xs text-kv-ink-muted">{progress}</p>}
        </div>
      )}
    </section>
  );
};

export default SpotifyCard;
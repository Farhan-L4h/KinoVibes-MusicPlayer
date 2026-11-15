import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Shuffle, Search } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useFavoritesStore } from '../stores/favorites';
import { useTrackActions } from '../hooks/useTrackActions';
import { formatTotalDuration } from '../lib/utils';
import TrackRow from '../components/TrackRow';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { TrackRowSkeleton } from '../components/ui/Skeleton';

const Favorites = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { tracks, loading, load } = useFavoritesStore();
  const actions = useTrackActions();

  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadError(false);
    load(user.id).then(() => {
      if (!cancelled) setLoadError(useFavoritesStore.getState().loadedFor !== user.id);
    });
    return () => { cancelled = true; };
  }, [user?.id, retry]);

  const totalDuration = tracks.reduce((a, t) => a + (t.duration || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-kv-lg border border-kv-line bg-kv-surface p-5 sm:p-6">
        <div>
          <h1 className="flex items-center gap-3 font-display text-xl leading-relaxed sm:text-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-kv-line bg-kv-panel">
              <Heart size={22} className="text-kv-ink" fill="currentColor" />
            </span>
            Favorit
          </h1>
          <p className="mt-2 flex flex-wrap gap-2">
            <Badge tone="surface">{tracks.length} lagu</Badge>
            <Badge tone="surface">{formatTotalDuration(totalDuration)}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => actions.playAll(tracks)} disabled={tracks.length === 0}>
            <Play size={15} /> Putar semua
          </Button>
          <Button size="sm" variant="secondary" onClick={() => actions.shuffleAll(tracks)} disabled={tracks.length === 0}>
            <Shuffle size={15} /> Acak
          </Button>
        </div>
      </header>

      {loading && tracks.length === 0 ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <TrackRowSkeleton key={i} />)}
        </div>
      ) : loadError ? (
        <EmptyState icon={Heart} title="Favorit belum bisa dimuat" description="Periksa koneksi lalu coba lagi." action={<Button size="sm" onClick={() => setRetry((n) => n + 1)}>Coba lagi</Button>} />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Belum ada favorit"
          description="Tekan ikon hati pada lagu upload atau YouTube untuk menyimpannya di sini."
          action={<Button size="sm" onClick={() => navigate('/search')}><Search size={15} /> Cari lagu</Button>}
        />
      ) : (
        <div className="space-y-1.5">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} list={tracks} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
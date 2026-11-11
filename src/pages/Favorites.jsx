import { useEffect } from 'react';
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

  useEffect(() => {
    if (user) load(user.id);
  }, [user?.id]);

  const totalDuration = tracks.reduce((a, t) => a + (t.duration || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="kv-card flex flex-wrap items-center justify-between gap-4 border-l-[12px] border-l-kv-pink p-5 sm:p-6">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl uppercase sm:text-4xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-pink shadow-kv">
              <Heart size={22} className="text-[#0a0a0a]" fill="currentColor" />
            </span>
            Favorit
          </h1>
          <p className="mt-2 flex flex-wrap gap-2">
            <Badge tone="pink">{tracks.length} lagu</Badge>
            <Badge tone="surface">{formatTotalDuration(totalDuration)}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => actions.playAll(tracks)} disabled={tracks.length === 0}>
            <Play size={15} /> Putar semua
          </Button>
          <Button size="sm" variant="pink" onClick={() => actions.shuffleAll(tracks)} disabled={tracks.length === 0}>
            <Shuffle size={15} /> Acak
          </Button>
        </div>
      </header>

      {loading && tracks.length === 0 ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <TrackRowSkeleton key={i} />)}
        </div>
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Belum ada favorit"
          description="Tekan ikon hati pada lagu mana pun — lagu upload maupun YouTube — untuk menyimpannya di sini."
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
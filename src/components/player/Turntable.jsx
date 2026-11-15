import { useMusicStore } from '../../stores/music';
import { cn } from '../../lib/utils';
import TrackArt from '../TrackArt';

const SCREWS = [
  'left-[3.5%] top-[4.5%]',
  'right-[3.5%] top-[4.5%]',
  'left-[3.5%] bottom-[4.5%]',
  'right-[3.5%] bottom-[4.5%]',
];

const Turntable = ({ track, className }) => {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const status = useMusicStore((s) => s.status);
  const spinning = isPlaying && status !== 'loading' && status !== 'buffering';
  const engaged = isPlaying || status === 'loading' || status === 'buffering';

  return (
    <div className={cn('kv-deck aspect-[13/10] w-full select-none', className)} aria-hidden="false">
      {SCREWS.map((pos) => (
        <span
          key={pos}
          className={cn(
            'absolute h-[2.2%] aspect-square rounded-full shadow-inner',
            pos
          )}
          style={{ background: 'radial-gradient(circle at 35% 30%, #fff8, var(--kv-deck-edge) 70%)' }}
          aria-hidden="true"
        />
      ))}

      <div className="kv-platter" style={{ left: '5%', top: '7%', width: '70%', aspectRatio: '1' }}>
        <div className="kv-vinyl-spin" data-spin={spinning}>
          <div className="kv-vinyl-grooves" />
          <div className="kv-vinyl-sheen" />
          <div className="kv-vinyl-label">
            {track?.albumArt ? (
              <TrackArt src={track.albumArt} videoId={track.videoId} />
            ) : (
              <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-kv-ink/80">
                33⅓ RPM
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="kv-tonearm"
        style={{
          right: '9%',
          top: '5%',
          width: '12%',
          height: '64%',
          transform: `rotate(${engaged ? 15 : -7}deg)`,
        }}
        aria-hidden="true"
      >
        <span
          className="absolute left-1/2 top-0 aspect-square w-[72%] -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, var(--kv-deck-1), var(--kv-deck-2) 75%)',
            boxShadow: '0 3px 8px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.5)',
          }}
        />
        <span
          className="absolute left-1/2 top-[10%] aspect-square w-[30%] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 35%, #888, #333 80%)' }}
        />
        <span
          className="absolute left-1/2 top-[16%] h-[72%] w-[7%] -translate-x-1/2 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #999, var(--kv-deck-1) 45%, #777)',
            boxShadow: '0 2px 5px rgba(0,0,0,.4)',
          }}
        />
        <span
          className="absolute bottom-0 left-1/2 h-[13%] w-[26%] -translate-x-1/2 rounded-[3px]"
          style={{
            background: 'linear-gradient(180deg, #4a4a4a, #1c1c1c)',
            boxShadow: '0 2px 4px rgba(0,0,0,.5)',
          }}
        />
      </div>

      <div
        className="absolute right-[5.5%] top-[42%] h-[26%] w-[1.6%] rounded-full bg-black/25"
        aria-hidden="true"
      >
        <span
          className="absolute left-1/2 top-[32%] h-[9%] w-[340%] -translate-x-1/2 rounded-[2px] border border-[var(--kv-deck-edge)]"
          style={{ background: 'linear-gradient(180deg, var(--kv-deck-1), var(--kv-deck-2))' }}
        />
      </div>

      <div className="absolute bottom-[6%] left-[6%] flex items-center gap-2">
        <span className="kv-led" data-on={isPlaying} />
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-kv-ink-muted">
          POWER
        </span>
      </div>

      <span className="absolute bottom-[6.5%] left-[42%] font-mono text-[8px] font-bold tracking-[0.15em] text-kv-ink-muted">
        33 · 45
      </span>

      <button
        type="button"
        onClick={() => useMusicStore.getState().togglePlay()}
        aria-label={isPlaying ? 'Jeda' : 'Putar'}
        title={isPlaying ? 'Jeda' : 'Putar'}
        className="kv-press absolute bottom-[5%] right-[6%] flex aspect-square h-[13%] items-center justify-center rounded-[6px] border border-kv-deck-edge"
        style={{
          background: 'linear-gradient(180deg, var(--kv-deck-1), var(--kv-deck-2))',
          boxShadow: '0 2px 5px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.5)',
        }}
      >
        <span className="h-[26%] w-[26%] rounded-[2px] bg-kv-ink/70" />
      </button>
    </div>
  );
};

export default Turntable;
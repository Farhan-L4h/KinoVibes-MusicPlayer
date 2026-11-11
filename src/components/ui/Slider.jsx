import { cn } from '../../lib/utils';

export default function Slider({ value = 0, max = 100, className, fill = 'var(--kv-pink)', ...props }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <input
      type="range"
      min={0}
      max={max}
      value={value}
      className={cn('kv-slider w-full cursor-pointer appearance-none bg-transparent', className)}
      style={{
        '--fill': fill,
        '--pct': `${pct}%`,
      }}
      {...props}
    />
  );
}
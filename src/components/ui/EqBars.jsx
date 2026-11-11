import { cn } from '../../lib/utils';

export default function EqBars({ playing = true, className }) {
  return (
    <span className={cn('flex h-4 items-end gap-[3px]', className)} aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'w-[4px] origin-bottom rounded-[1px] border border-kv-ink bg-kv-pink',
            playing ? `animate-eq-${i} h-full` : 'h-1/3'
          )}
        />
      ))}
    </span>
  );
}
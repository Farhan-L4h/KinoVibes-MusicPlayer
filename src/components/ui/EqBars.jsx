import { cn } from '../../lib/utils';

export default function EqBars({ playing = true, className }) {
  return (
    <span className={cn('flex h-4 items-end gap-[3px]', className)} aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] origin-bottom rounded-full bg-kv-ink',
            playing ? `animate-eq-${i} h-full` : 'h-1/3'
          )}
        />
      ))}
    </span>
  );
}
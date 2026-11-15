import { cn } from '../../lib/utils';

export default function Marquee({ items, className, tone = 'bg-kv-surface' }) {
  const row = [...items, ...items];
  return (
    <div
      className={cn('select-none overflow-hidden border-y border-kv-line py-2', tone, className)}
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-kv-ink-muted"
          >
            {item} <span className="text-kv-ink">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}
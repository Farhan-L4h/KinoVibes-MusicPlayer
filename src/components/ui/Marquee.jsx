import { cn } from '../../lib/utils';

export default function Marquee({ items, className, tone = 'bg-kv-yellow' }) {
  const row = [...items, ...items];
  return (
    <div
      className={cn(
        'overflow-hidden border-y-3 border-kv-ink py-2 select-none',
        tone,
        className
      )}
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-sm uppercase tracking-widest text-[#0a0a0a]">
            {item} <span className="text-kv-pink">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}
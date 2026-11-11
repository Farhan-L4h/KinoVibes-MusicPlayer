import { cn } from '../../lib/utils';

const TONES = {
  yellow: 'bg-kv-yellow text-[#0a0a0a]',
  pink: 'bg-kv-pink text-[#0a0a0a]',
  blue: 'bg-kv-blue text-[#0a0a0a]',
  green: 'bg-kv-green text-[#0a0a0a]',
  purple: 'bg-kv-purple text-[#0a0a0a]',
  orange: 'bg-kv-orange text-[#0a0a0a]',
  ink: 'bg-kv-ink text-kv-bg',
  surface: 'bg-kv-surface text-kv-ink',
};

export default function Badge({ tone = 'yellow', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[4px] border-2 border-kv-ink px-1.5 py-0.5',
        'font-mono text-[10px] font-bold uppercase tracking-wider',
        TONES[tone] || TONES.yellow,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
import { cn } from '../../lib/utils';

const TONES = {
  ink: 'border-kv-ink bg-kv-ink text-kv-panel',
  surface: 'border-kv-line bg-kv-surface text-kv-ink-muted',
  success: 'border-kv-success bg-kv-success/10 text-kv-success',
};

export default function Badge({ tone = 'surface', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'font-mono text-[10px] font-bold uppercase tracking-wider',
        TONES[tone] || TONES.surface,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

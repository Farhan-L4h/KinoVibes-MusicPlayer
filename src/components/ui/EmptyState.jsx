import { cn } from '../../lib/utils';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-kv border-3 border-dashed border-kv-ink bg-kv-surface px-6 py-12 text-center',
        className
      )}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-yellow shadow-kv">
          <Icon className="h-8 w-8 text-[#0a0a0a]" />
        </div>
      )}
      <h3 className="font-display text-lg uppercase">{title}</h3>
      {description && <p className="max-w-sm text-sm text-kv-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
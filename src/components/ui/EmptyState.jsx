import { cn } from '../../lib/utils';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-kv-lg border border-dashed border-kv-line bg-kv-surface/60 px-6 py-12 text-center',
        className
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kv-muted text-kv-ink-muted">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="font-display text-base">{title}</h3>
      {description && <p className="max-w-sm text-sm text-kv-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
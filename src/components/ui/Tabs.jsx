import { cn } from '../../lib/utils';

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((tab) => {
        const value = typeof tab === 'string' ? tab : tab.value;
        const label = typeof tab === 'string' ? tab : tab.label;
        const isActive = value === active;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(value)}
            className={cn(
              'kv-press min-h-[44px] rounded-kv border-3 border-kv-ink px-4 py-2 font-display text-xs uppercase tracking-wide shadow-kv',
              isActive ? 'bg-kv-ink text-kv-bg' : 'bg-kv-surface text-kv-ink'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
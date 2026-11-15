import { cn } from '../../lib/utils';

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-kv-line bg-kv-surface p-1',
        className
      )}
    >
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
              'min-h-[36px] rounded-full px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-150',
              isActive ? 'bg-kv-ink text-kv-panel' : 'text-kv-ink-muted hover:text-kv-ink'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
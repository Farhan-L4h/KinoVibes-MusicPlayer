import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Select({ options, className, label, id, ...props }) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'min-h-[44px] w-full cursor-pointer appearance-none rounded-full border-[1.5px] border-kv-line bg-kv-surface',
          'py-2 pl-4 pr-9 font-mono text-xs font-bold text-kv-ink transition-colors focus:border-kv-ink'
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kv-ink-muted"
        aria-hidden="true"
      />
    </div>
  );
}
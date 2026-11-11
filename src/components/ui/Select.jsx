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
          'min-h-[44px] w-full appearance-none rounded-kv border-3 border-kv-ink bg-kv-surface',
          'py-2 pl-3 pr-9 font-bold text-kv-ink shadow-kv cursor-pointer'
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
        className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-kv-ink"
        aria-hidden="true"
      />
    </div>
  );
}
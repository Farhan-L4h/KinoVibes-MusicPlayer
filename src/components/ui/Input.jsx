import { useId } from 'react';
import { cn } from '../../lib/utils';

export default function Input({ label, error, className, id, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block font-display text-xs uppercase tracking-wider text-kv-ink"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'min-h-[44px] w-full rounded-kv border-3 border-kv-ink bg-kv-surface px-3 py-2.5',
          'font-body text-kv-ink placeholder:text-kv-ink-muted/70',
          'focus-visible:outline focus-visible:outline-3 focus-visible:outline-kv-blue',
          error && 'border-kv-danger',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-sm font-semibold text-kv-danger">{error}</p>}
    </div>
  );
}
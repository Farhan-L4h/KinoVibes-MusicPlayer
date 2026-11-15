import { useId } from 'react';
import { cn } from '../../lib/utils';

export default function Input({ label, error, className, id, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="kv-mono-label mb-1.5 block">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'min-h-[44px] w-full rounded-full border-[1.5px] border-kv-line bg-kv-surface px-4 py-2.5',
          'font-body text-sm text-kv-ink placeholder:text-kv-ink-muted/70',
          'transition-colors duration-150 focus:border-kv-ink focus-visible:outline-none',
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
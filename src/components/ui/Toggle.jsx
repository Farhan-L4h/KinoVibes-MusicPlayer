import { cn } from '../../lib/utils';

export default function Toggle({ checked = false, onChange, label, description, disabled = false, id }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 py-3',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-kv-ink-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'block h-7 w-12 rounded-full border-[1.5px] transition-colors',
            checked ? 'border-kv-ink bg-kv-ink' : 'border-kv-line-strong bg-kv-surface'
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-[3px] h-[22px] w-[22px] rounded-full border border-kv-line bg-kv-panel transition-transform duration-200',
            checked ? 'translate-x-[24px] border-kv-ink' : 'translate-x-[2px]'
          )}
        />
      </span>
    </label>
  );
}

import { cn } from '../../lib/utils';

const VARIANTS = {
  primary: 'border-kv-ink bg-kv-ink text-kv-panel shadow-kv',
  ghost: 'border-transparent bg-transparent text-kv-ink hover:bg-kv-muted',
};

export default function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'kv-press inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'lg' ? 'h-14 w-14' : 'h-11 w-11',
        VARIANTS[variant] || VARIANTS.ghost,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
import { cn } from '../../lib/utils';

const VARIANTS = {
  primary: 'bg-kv-yellow text-[#0a0a0a]',
  ghost: 'bg-kv-surface text-kv-ink',
  pink: 'bg-kv-pink text-[#0a0a0a]',
  ink: 'bg-kv-ink text-kv-bg',
  danger: 'bg-kv-danger text-white dark:text-[#141210]',
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
        'kv-press inline-flex shrink-0 items-center justify-center rounded-kv border-3 border-kv-ink shadow-kv',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-11 w-11' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11',
        VARIANTS[variant] || VARIANTS.ghost,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
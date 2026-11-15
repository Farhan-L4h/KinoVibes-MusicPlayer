import { cn } from '../../lib/utils';

const VARIANTS = {
  primary: 'border-kv-ink bg-kv-ink text-kv-panel shadow-kv',
  secondary: 'border-kv-line-strong bg-kv-surface text-kv-ink',
  ghost: 'border-transparent bg-transparent text-kv-ink hover:bg-kv-muted',
};

const SIZES = {
  sm: 'min-h-[44px] px-4 py-2 text-sm gap-1.5',
  md: 'min-h-[44px] px-5 py-2.5 text-sm gap-2',
  lg: 'min-h-[52px] px-7 py-3 text-base gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'kv-press inline-flex items-center justify-center rounded-full border-[1.5px] font-bold',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
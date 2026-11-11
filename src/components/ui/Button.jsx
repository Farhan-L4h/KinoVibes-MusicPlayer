import { cn } from '../../lib/utils';

const VARIANTS = {
  primary: 'bg-kv-yellow text-[#0a0a0a]',
  secondary: 'bg-kv-blue text-[#0a0a0a]',
  pink: 'bg-kv-pink text-[#0a0a0a]',
  green: 'bg-kv-green text-[#0a0a0a]',
  ghost: 'bg-kv-surface text-kv-ink',
  danger: 'bg-kv-danger text-white dark:text-[#141210]',
  ink: 'bg-kv-ink text-kv-bg',
};

const SIZES = {
  sm: 'min-h-[44px] px-3 py-2 text-sm gap-1.5',
  md: 'min-h-[44px] px-4 py-2.5 text-base gap-2',
  lg: 'min-h-[52px] px-6 py-3 text-lg gap-2.5',
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
        'kv-press inline-flex items-center justify-center rounded-kv border-3 border-kv-ink font-bold shadow-kv',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-kv',
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
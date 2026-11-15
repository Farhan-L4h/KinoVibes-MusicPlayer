import { cn } from '../../lib/utils';

export default function Card({ className, accent, children, ...props }) {
  return (
    <div className={cn('kv-card relative overflow-hidden', className)} {...props}>
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: accent }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
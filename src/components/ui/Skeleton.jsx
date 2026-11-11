import { cn } from '../../lib/utils';

export default function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-kv border-3 border-kv-ink bg-kv-muted', className)}
      aria-hidden="true"
    />
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-kv border-3 border-kv-ink bg-kv-surface p-2.5">
      <Skeleton className="h-12 w-12 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
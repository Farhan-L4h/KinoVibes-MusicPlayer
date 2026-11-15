import { cn } from '../../lib/utils';

export default function Skeleton({ className }) {
  return <div className={cn('kv-shimmer rounded-kv', className)} aria-hidden="true" />;
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-kv p-2.5">
      <Skeleton className="h-12 w-12 shrink-0 rounded-kv" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full rounded-kv-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
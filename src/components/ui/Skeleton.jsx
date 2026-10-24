export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface-raised ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-4">
      <Skeleton className="aspect-[16/9] w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function CardSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-3 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

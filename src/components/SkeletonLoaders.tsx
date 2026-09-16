/**
 * Reusable Skeleton Loader components for modern pulsing loading placeholders
 * across cards, tables, rows, forms, and pages.
 */

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card space-y-4 border border-gray-100 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-6 w-1/3" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-2/3" />
      <div className="pt-2 flex items-center justify-between">
        <SkeletonBox className="h-8 w-28" />
        <SkeletonBox className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
      <div className="space-y-1.5 w-1/2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
      </div>
      <SkeletonBox className="h-6 w-20 rounded-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card space-y-4">
      <SkeletonBox className="h-7 w-1/4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="card flex items-center gap-4 p-5">
      <SkeletonBox className="h-16 w-16 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <SkeletonBox className="h-5 w-40" />
        <SkeletonBox className="h-4 w-28" />
        <SkeletonBox className="h-3 w-32" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="section min-h-[60vh] py-10 space-y-8">
      <div className="space-y-2 max-w-xl">
        <SkeletonBox className="h-8 w-3/4" />
        <SkeletonBox className="h-4 w-1/2" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

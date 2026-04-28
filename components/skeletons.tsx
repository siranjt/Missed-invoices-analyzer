"use client";

/** Base shimmer block. Tailwind's `animate-pulse` paired with a soft Zoca tint. */
export function Skeleton({
  className = "",
  style
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "linear-gradient(90deg, #ece6ff 0%, #f5f0ff 50%, #ece6ff 100%)", ...style }}
    />
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card-zoca flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="card-zoca">
      <div className="flex items-baseline justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + ((i * 13) % 60)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ChartCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="card-zoca">
      <div className="flex flex-wrap gap-2 items-center">
        <Skeleton className="h-9 flex-1 min-w-[240px]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32" />
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

export function InvoicesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card-zoca !p-0 overflow-hidden">
      <div className="p-4 border-b border-zoca-stroke">
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-zoca-stroke last:border-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <KpiCardsSkeleton />
      <ChartsSkeleton />
      <FiltersSkeleton />
      <InvoicesTableSkeleton />
    </div>
  );
}

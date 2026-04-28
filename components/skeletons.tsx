"use client";

/** Base shimmer block for the dark theme. Subtle purple-tinted gradient. */
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
      style={{
        background:
          "linear-gradient(90deg, #ece6f7 0%, #f5f1fb 50%, #ece6f7 100%)",
        ...style
      }}
    />
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card-zoca flex items-center gap-3 !py-2.5">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="card-zoca">
      <div className="flex items-baseline justify-between mb-3">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-20" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
        <Skeleton className="h-8 flex-1 min-w-[240px]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-32" />
        ))}
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

export function InvoicesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card-zoca !p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-zoca-borderStrong bg-zoca-thead">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2.5 border-b border-zoca-border last:border-0"
        >
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <KpiCardsSkeleton />
      <ChartsSkeleton />
      <FiltersSkeleton />
      <InvoicesTableSkeleton />
    </div>
  );
}

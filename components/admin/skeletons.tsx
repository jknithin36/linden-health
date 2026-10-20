// Loading placeholders for the admin. No "use client": route loading.tsx files render these on
// the server without pulling the client UI kit (or its chart library) into the response.

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** The white card surface every admin section sits on. */
export const panel = "rounded-2xl border border-neutral-200/70 bg-white"

const widths = ["w-40", "w-24", "w-32", "w-20", "w-28", "w-16", "w-24", "w-20"]

export function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col">
      <div className="flex gap-6 border-b border-neutral-100 px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className={cn("h-3 rounded-full", widths[i % widths.length])} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-neutral-50 px-4 py-3.5">
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} className={cn("h-3.5 rounded-full", widths[(i + r) % widths.length], i === 0 && "h-8 w-40 rounded-lg")} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn(panel, "flex flex-col gap-3 p-5", className)}>
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-7 w-20 rounded-lg" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}

const bars = [40, 65, 50, 80, 60, 90, 70, 55, 85, 45, 75, 60]

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn(panel, "flex flex-col gap-4 p-5", className)}>
      <Skeleton className="h-3.5 w-40 rounded-full" />
      <div className="flex h-48 items-end gap-2">
        {bars.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-3 w-28 rounded-full" />
        </div>
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** A page heading, an optional row of stat cards, and an optional table. */
export function PageSkeleton({ cards = 4, table = true }: { cards?: number; table?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded-full" />
      </div>
      {cards > 0 && (
        <div className={cn("grid grid-cols-2 gap-4", cards === 5 ? "lg:grid-cols-5" : cards === 3 ? "sm:grid-cols-3" : "lg:grid-cols-4")}>
          {Array.from({ length: cards }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {table && (
        <div className={panel}>
          <TableSkeleton />
        </div>
      )}
    </div>
  )
}

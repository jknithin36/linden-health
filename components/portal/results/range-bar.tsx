import { cn } from "@/lib/utils"
import { statusOf, type LabTest, type TestStatus } from "@/lib/data/results"

export const statusTone: Record<TestStatus, { chip: string; dot: string }> = {
  normal: { chip: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  high: { chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  low: { chip: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  abnormal: { chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
}

/** Track span for a test: a bit of room either side of the normal band, always including the value. */
function scaleFor(t: LabTest & { value: number }): [number, number] {
  let min: number
  let max: number
  if (t.low !== undefined && t.high !== undefined) {
    const span = t.high - t.low
    min = Math.max(0, t.low - span * 0.6)
    max = t.high + span * 0.6
  } else if (t.high !== undefined) {
    min = 0
    max = t.high * 1.6
  } else {
    min = 0
    max = (t.low ?? t.value) * 2
  }
  return [Math.min(min, t.value * 0.9), Math.max(max, t.value * 1.1)]
}

/** The normal range shaded on a track, with a dot where this result sits (green inside, amber/red outside). */
export function RangeBar({ test, label, className }: { test: LabTest; label: string; className?: string }) {
  if (typeof test.value !== "number") return null
  const t = test as LabTest & { value: number }
  const [min, max] = scaleFor(t)
  const pct = (n: number) => ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100
  const from = pct(t.low ?? min)
  const to = pct(t.high ?? max)
  return (
    <div role="img" aria-label={label} className={cn("relative h-1.5 rounded-full bg-neutral-100", className)}>
      <span className="absolute inset-y-0 rounded-full bg-emerald-100" style={{ left: `${from}%`, width: `${to - from}%` }} />
      <span
        className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", statusTone[statusOf(t)].dot)}
        style={{ left: `${pct(t.value)}%` }}
      />
    </div>
  )
}

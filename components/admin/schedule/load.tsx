import { cn } from "@/lib/utils"
import { minutesOfDay } from "@/lib/admin/format"
import { slotLength, slotsInBlock, type ScheduleColumn } from "@/lib/admin/queries"

/**
 * Booked visits (not cancelled) and capacity in visit slots (the block's slot length), minus
 * blocked time. A slot that was booked anyway (a visit placed over a huddle or
 * meeting) still counts toward capacity, so booked never exceeds it.
 */
export function columnLoad(c: Pick<ScheduleColumn, "block" | "appointments" | "blocked">) {
  const len = slotLength(c.block)
  const live = c.appointments.filter((a) => a.status !== "cancelled" && a.status !== "late-cancel")
  const taken = (t: number) => live.some((a) => minutesOfDay(a.start) < t + len && minutesOfDay(a.start) + a.durationMin > t)
  const capacity = slotsInBlock(c.block).filter((t) => !c.blocked.some((b) => t < b.end && t + len > b.start) || taken(t)).length
  return { booked: live.length, capacity }
}

export function LoadBar({ booked, capacity, className }: { booked: number; capacity: number; className?: string }) {
  const u = capacity ? Math.min(1, booked / capacity) : 0
  return (
    <span aria-hidden="true" className={cn("block h-1 overflow-hidden rounded-full bg-neutral-100", className)}>
      <span className={cn("block h-full rounded-full", u >= 0.9 ? "bg-neutral-900" : u >= 0.6 ? "bg-neutral-500" : "bg-neutral-300")} style={{ width: `${u * 100}%` }} />
    </span>
  )
}


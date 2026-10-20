"use client"

import * as React from "react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { scheduleCopy } from "@/lib/data/admin-schedule"
import { fmtPercent, parseLocal, TODAY } from "@/lib/admin/format"
import { getWeek } from "@/lib/admin/queries"
import type { ClinicId } from "@/lib/admin/types"
import { useQuery } from "@/components/admin/hooks"
import { DoctorCell, EmptyState, ErrorState, TableSkeleton } from "@/components/admin/ui"
import { hatch, utilTone } from "@/components/admin/schedule/tones"

/** Doctors × 7 days: booked/capacity and utilization, tinted by how full the day is. */
export function WeekView({ from, clinic, doctorIds, specialty, onDay }: { from: string; clinic: "all" | ClinicId; doctorIds: string[]; specialty: string[]; onDay: (day: string) => void }) {
  const { data, initial, loading, error, retry } = useQuery(() => getWeek({ from, clinic }), [from, clinic])

  const rows = React.useMemo(
    () => (data?.rows ?? []).filter((r) => (!doctorIds.length || doctorIds.includes(r.doctor.id)) && (!specialty.length || specialty.includes(r.doctor.specialtyId))),
    [data, doctorIds, specialty]
  )
  const totals = React.useMemo(
    () =>
      (data?.days ?? []).map((_, i) => {
        let booked = 0
        let capacity = 0
        for (const r of rows) {
          booked += r.days[i].booked
          capacity += r.days[i].capacity
        }
        return { booked, capacity, utilization: capacity ? Math.min(1, booked / capacity) : 0 }
      }),
    [data, rows]
  )

  if (error) return <ErrorState onRetry={retry} />
  if (initial || !data) return <TableSkeleton rows={8} cols={8} />
  if (!rows.length) return <EmptyState title={scheduleCopy.emptyTitle} text={scheduleCopy.emptyText} />

  return (
    <div className={cn("relative max-h-[calc(100dvh-20rem)] overflow-auto transition-opacity", loading && "opacity-70")}>
      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left">
        <caption className="sr-only">{scheduleCopy.weekHint}</caption>
        <thead className="sticky top-0 z-20 bg-white">
          <tr>
            <th scope="col" className="sticky left-0 z-30 w-44 border-b md:w-60 border-neutral-200/70 bg-white px-4 py-2.5 text-neutral-500 text-micro font-regular">
              Provider
            </th>
            {data.days.map((d) => (
              <th key={d} scope="col" className="border-b border-l border-neutral-100 border-b-neutral-200/70 px-2 py-2 font-regular">
                <button type="button" onClick={() => onDay(d)} className="flex w-full flex-col items-center rounded-lg py-0.5 outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-950">
                  <span className={cn("text-micro", d === TODAY ? "text-red-600" : "text-neutral-500")}>{format(parseLocal(d), "EEE")}</span>
                  <span className={cn("grid size-7 place-items-center rounded-full tabular-nums text-caption", d === TODAY ? "bg-red-600 text-white" : "text-neutral-950")}>{format(parseLocal(d), "d")}</span>
                </button>
              </th>
            ))}
            <th scope="col" className="border-b border-l border-neutral-100 border-b-neutral-200/70 px-3 py-2.5 text-right text-neutral-500 text-micro font-regular">
              Week
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const booked = r.days.reduce((s, x) => s + x.booked, 0)
            const cap = r.days.reduce((s, x) => s + x.capacity, 0)
            return (
              <tr key={r.doctor.id} className="group">
                <th scope="row" className="sticky left-0 z-10 border-b border-neutral-100 bg-white px-3 py-2 font-regular md:px-4">
                  <DoctorCell id={r.doctor.id} />
                </th>
                {r.days.map((x) => (
                  <td key={x.day} className="border-b border-l border-neutral-100 p-1">
                    {x.off && x.booked === 0 ? (
                      <span className="flex h-11 items-center justify-center rounded-lg border border-neutral-100 text-neutral-400 text-micro" style={hatch}>
                        <span className="rounded bg-white px-1">{r.doctor.status === "on-leave" ? "Leave" : scheduleCopy.off}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDay(x.day)}
                        aria-label={`${r.doctor.name}, ${format(parseLocal(x.day), "EEEE MMM d")}: ${x.booked} of ${x.capacity} booked, ${fmtPercent(x.utilization)}`}
                        className={cn("flex h-11 w-full flex-col items-center justify-center rounded-lg outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-neutral-950", utilTone(x.utilization))}
                      >
                        <span className="tabular-nums text-caption">
                          {x.booked}
                          <span className="opacity-60">/{x.capacity}</span>
                        </span>
                        <span className="tabular-nums text-micro opacity-75">{fmtPercent(x.utilization)}</span>
                      </button>
                    )}
                  </td>
                ))}
                <td className="border-b border-l border-neutral-100 px-3 text-right">
                  <span className="block text-neutral-950 tabular-nums text-caption">{cap ? fmtPercent(Math.min(1, booked / cap)) : "—"}</span>
                  <span className="block text-neutral-400 tabular-nums text-micro">
                    {booked}/{cap}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="sticky bottom-0 z-20 bg-white">
          <tr>
            <th scope="row" className="sticky left-0 z-30 border-t border-neutral-200/70 bg-white px-4 py-2.5 text-neutral-950 text-caption font-regular">
              All shown providers
            </th>
            {totals.map((t, i) => (
              <td key={i} className="border-t border-l border-neutral-100 border-t-neutral-200/70 px-2 py-2.5 text-center">
                <span className="block text-neutral-950 tabular-nums text-caption">{t.capacity ? fmtPercent(t.utilization) : "—"}</span>
                <span className="block text-neutral-400 tabular-nums text-micro">
                  {t.booked}/{t.capacity}
                </span>
              </td>
            ))}
            <td className="border-t border-l border-neutral-100 border-t-neutral-200/70" />
          </tr>
        </tfoot>
      </table>
      <p className="px-4 py-2 text-neutral-400 text-micro">{scheduleCopy.weekHint}</p>
    </div>
  )
}

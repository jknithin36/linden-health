"use client"

import * as React from "react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { scheduleCopy } from "@/lib/data/admin-schedule"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import { addDays, parseLocal, TODAY } from "@/lib/admin/format"
import { getDoctorSync, getSchedule } from "@/lib/admin/queries"
import { useQuery } from "@/components/admin/hooks"
import { DoctorCell, ErrorState } from "@/components/admin/ui"
import { SelectInput, type Option } from "@/components/admin/forms"
import { TimeGrid, TimeGridSkeleton, type GridColumn } from "@/components/admin/schedule/time-grid"
import { columnLoad, LoadBar } from "@/components/admin/schedule/load"

/** One provider's next 7 days, side by side. */
export function DoctorView({
  from,
  doctorId,
  options,
  onDoctor,
  onOpen,
  onSlot,
  fixed,
}: {
  /** The signed-in doctor's own schedule: no provider picker, open slots drawn. */
  fixed?: boolean
  from: string
  doctorId: string
  options: Option[]
  onDoctor: (id: string) => void
  onOpen: (id: string) => void
  onSlot: (c: GridColumn, minutes: number) => void
}) {
  const days = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(from, i)), [from])
  const [mobileDay, setMobileDay] = React.useState("")
  const { data, initial, loading, error, retry } = useQuery(
    () => Promise.all(days.map((day) => getSchedule({ day, clinic: "all", doctorIds: [doctorId] }).then((r) => ({ day, col: r.columns[0] ?? null })))),
    [doctorId, from]
  )
  const doctor = getDoctorSync(doctorId)

  const columns = React.useMemo<GridColumn[]>(
    () =>
      (data ?? []).map(({ day, col }) => {
        const block = col?.block ?? null
        const appointments = col?.appointments ?? []
        const blocked = col?.blocked ?? []
        const { booked, capacity } = columnLoad({ block, appointments, blocked })
        return {
          key: day,
          label: format(parseLocal(day), "EEEE, MMMM d"),
          day,
          doctorId,
          block,
          appointments,
          blocked,
          header: (
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full tabular-nums text-caption", day === TODAY ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-950")}>{format(parseLocal(day), "d")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-neutral-950 text-caption">
                  {format(parseLocal(day), "EEEE")}
                  {day === TODAY && <span className="ml-1.5 text-red-600 text-micro">Today</span>}
                </span>
                {block ? (
                  <span className="mt-1 flex items-center gap-2">
                    <LoadBar booked={booked} capacity={capacity} className="flex-1" />
                    <span className="shrink-0 text-neutral-500 tabular-nums text-micro">
                      {booked}/{capacity}
                    </span>
                  </span>
                ) : (
                  <span className="mt-0.5 block text-neutral-400 text-micro">{doctor?.status === "on-leave" ? "On leave" : scheduleCopy.off}</span>
                )}
              </span>
            </div>
          ),
        }
      }),
    [data, doctorId, doctor?.status]
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 p-3">
        {!fixed && (
          <div className="w-full sm:w-72">
            <SelectInput label={scheduleCopy.doctorPick} value={doctorId} onChange={onDoctor} options={options} placeholder={scheduleCopy.doctorPick} />
          </div>
        )}
        {doctor && <DoctorCell id={doctor.id} className={fixed ? "flex" : "hidden md:flex"} />}
        <p className="text-neutral-500 text-micro sm:ml-auto">{fixed ? doctorChartCopy.schedule.doctorHint : scheduleCopy.doctorHint}</p>
        <div className="w-full md:hidden">
          <SelectInput label="Day to show" value={columns.some((c) => c.key === mobileDay) ? mobileDay : days[0]} onChange={setMobileDay} options={days.map((d) => ({ value: d, label: format(parseLocal(d), "EEEE, MMM d") }))} />
        </div>
      </div>
      {error ? (
        <ErrorState onRetry={retry} />
      ) : initial || !data ? (
        <TimeGridSkeleton cols={7} />
      ) : (
        <TimeGrid label={`${doctor?.name ?? "Provider"}, next 7 days`} columns={columns} mobileKey={mobileDay} refreshing={loading} onOpen={onOpen} onSlot={onSlot} showOpen={fixed} />
      )}
    </>
  )
}

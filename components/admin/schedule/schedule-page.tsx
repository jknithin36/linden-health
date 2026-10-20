"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { adminCopy } from "@/lib/data/admin"
import { scheduleCopy } from "@/lib/data/admin-schedule"
import { addDays, fmtDate, fmtDateLong, fmtNumber, fmtPercent, mondayOf, parseLocal, TODAY } from "@/lib/admin/format"
import { allDoctors, getClinicSync, getSchedule, openSlots, scheduleStats, slotLength, specialties, type ScheduleColumn } from "@/lib/admin/queries"
import { useAdminState } from "@/lib/admin/store"
import { myDoctorId } from "@/lib/admin/doctor"
import { useSession } from "@/lib/session-client"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { FacetFilter, ResetButton } from "@/components/admin/data-table"
import { Avatar, EmptyState, ErrorState, PageHeader, panel } from "@/components/admin/ui"
import { NewAppointmentDialog, SelectInput } from "@/components/admin/forms"
import { AppointmentSheet } from "@/components/admin/appointment-sheet"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TimeGrid, TimeGridSkeleton, type GridColumn } from "@/components/admin/schedule/time-grid"
import { WeekView } from "@/components/admin/schedule/week-view"
import { DoctorView } from "@/components/admin/schedule/doctor-view"
import { legendTone } from "@/components/admin/schedule/tones"
import { columnLoad, LoadBar } from "@/components/admin/schedule/load"

type View = "day" | "week" | "doctor"
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

function DoctorHeader({ c }: { c: ScheduleColumn }) {
  const { booked, capacity } = columnLoad(c)
  const d = c.doctor
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Avatar name={d.name} id={d.id} src={d.avatar} className="size-8" />
      <div className="min-w-0 flex-1">
        <Link href={`/admin/doctors/${d.id}`} className="block truncate rounded text-neutral-950 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption">
          {d.name}
        </Link>
        <span className="block truncate text-neutral-500 text-micro">
          {d.specialty}
          {c.block && <span className="text-neutral-400"> · {getClinicSync(c.block.clinicId).short}</span>}
        </span>
        {c.block ? (
          <span className="mt-1 flex items-center gap-2">
            <LoadBar booked={booked} capacity={capacity} className="flex-1" />
            <span className="shrink-0 text-neutral-500 tabular-nums text-micro">
              {booked}/{capacity}
            </span>
          </span>
        ) : (
          <span className="mt-1 block text-amber-700 text-micro">{d.status === "on-leave" ? "On leave" : scheduleCopy.closed}</span>
        )}
      </div>
    </div>
  )
}

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={`Choose date, ${fmtDateLong(value)}`} className="inline-flex h-10 items-center md:h-9 gap-2 rounded-full border border-neutral-200 bg-white px-3.5 text-neutral-950 outline-none hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-neutral-950 data-popup-open:border-neutral-950 text-caption">
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} className="size-4 text-neutral-500" />
        <span className="tabular-nums">{format(parseLocal(value), "EEEE, MMM d")}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-0">
        <Calendar
          mode="single"
          selected={parseLocal(value)}
          defaultMonth={parseLocal(value)}
          onSelect={(d) => {
            if (d) onChange(format(d, "yyyy-MM-dd"))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function HeaderStats({ day }: { day: string }) {
  const { data } = useQuery(async () => scheduleStats(day, "all"), [day])
  const s = scheduleCopy.stats
  const items = data
    ? [
        { label: s.booked, value: fmtNumber(data.booked) },
        { label: s.open, value: fmtNumber(data.open) },
        { label: s.utilization, value: fmtPercent(data.utilization) },
      ]
    : null
  return (
    <div className={cn(panel, "flex items-stretch divide-x divide-neutral-100 px-1 py-1.5")} aria-label={`${s.scope}, ${fmtDate(day)}`} role="group">
      {(items ?? [0, 1, 2].map(() => null)).map((it, i) => (
        <div key={i} className="flex min-w-20 flex-col px-3.5">
          <span className="text-neutral-500 text-micro">{it?.label ?? <Skeleton className="mt-1 h-2.5 w-12 rounded-full" />}</span>
          <span className="text-neutral-950 tabular-nums text-body">{it ? it.value : <Skeleton className="mt-1.5 h-4 w-10 rounded-full" />}</span>
        </div>
      ))}
      <div className="hidden flex-col justify-center px-3.5 lg:flex">
        <span className="text-neutral-400 text-micro">{s.scope}</span>
        <span className="text-neutral-500 tabular-nums text-micro">{fmtDate(day)}</span>
      </div>
    </div>
  )
}

/** A doctor's own day: booked visits and open slots in their column. */
function MyStats({ day, doctorId }: { day: string; doctorId: string }) {
  const s = doctorChartCopy.schedule.stats
  const { data } = useQuery(() => getSchedule({ day, clinic: "all", doctorIds: [doctorId] }), [day, doctorId])
  const column = data ? (data.columns[0] ?? null) : undefined
  const booked = column === undefined ? null : column ? columnLoad(column).booked : 0
  const open = column === undefined ? null : column ? openSlots(doctorId, day).filter((t) => !column.blocked.some((b) => t < b.end && t + slotLength(column.block) > b.start)).length : 0
  const items = [
    { label: s.booked, value: booked },
    { label: s.open, value: open },
  ]
  return (
    <div className={cn(panel, "flex items-stretch divide-x divide-neutral-100 px-1 py-1.5")} aria-label={`${s.scope}, ${fmtDate(day)}`} role="group">
      {items.map((it) => (
        <div key={it.label} className="flex min-w-20 flex-col px-3.5">
          <span className="text-neutral-500 text-micro">{it.label}</span>
          <span className="text-neutral-950 tabular-nums text-body">{it.value === null ? <Skeleton className="mt-1.5 h-4 w-10 rounded-full" /> : fmtNumber(it.value)}</span>
        </div>
      ))}
      <div className="hidden flex-col justify-center px-3.5 lg:flex">
        <span className="text-neutral-400 text-micro">{s.scope}</span>
        <span className="text-neutral-500 tabular-nums text-micro">{fmtDate(day)}</span>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <ul aria-label="Status colors" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {scheduleCopy.legend.map((l) => (
        <li key={l.id} className="flex items-center gap-1.5 text-neutral-600 text-micro">
          <span aria-hidden="true" className={cn("flex h-3 w-4 overflow-hidden rounded-[3px] border", legendTone[l.id].box)}>
            <span className={cn("w-[3px]", legendTone[l.id].accent)} />
          </span>
          {l.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5 text-neutral-600 text-micro">
        <span aria-hidden="true" className="h-3 w-4 rounded-[3px] border border-neutral-200" style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--color-neutral-300) 0 1px, transparent 1px 4px)" }} />
        {scheduleCopy.blocked}
      </li>
      <li className="flex items-center gap-1.5 text-neutral-600 text-micro">
        <span aria-hidden="true" className="h-3 w-4 rounded-[3px] border border-neutral-200 bg-neutral-100" />
        {scheduleCopy.closed}
      </li>
    </ul>
  )
}

export function SchedulePage() {
  const url = useUrlState()
  const isDoctor = useSession()?.role === "doctor"
  const me = isDoctor ? myDoctorId() : null
  const clinicPick = useAdminState((s) => s.clinic)
  // A doctor sees only their own column, across every clinic they work at.
  const clinic = me ? "all" : clinicPick
  const views = me ? scheduleCopy.views.filter((v) => v.id !== "week") : scheduleCopy.views
  const rawView = url.get("view")
  const view = (views.some((v) => v.id === rawView) ? rawView : "day") as View
  const date = isDay(url.get("date")) ? url.get("date") : TODAY
  const doctorIds = me ? [me] : url.getList("doctors")
  const specialty = me ? [] : url.getList("specialty")
  const open = url.get("open") || null
  const [creating, setCreating] = React.useState<null | { doctorId?: string; day?: string; time?: string }>(null)
  const [mobileDoctor, setMobileDoctor] = React.useState("")

  const step = view === "day" ? 1 : 7
  const setDate = (d: string) => url.set({ date: d === TODAY ? null : d })
  const doctorOptions = allDoctors()
    .filter((d) => clinic === "all" || d.clinicIds.includes(clinic))
    .map((d) => ({ value: d.id, label: d.name }))

  const key = JSON.stringify({ date, clinic, doctorIds, specialty })
  const day = useQuery(() => (view === "day" ? getSchedule({ day: date, clinic, doctorIds, specialty }) : Promise.resolve(null)), [key, view])

  // The React Compiler memoizes this.
  const columns: GridColumn[] = (day.data?.columns ?? []).map((c) => ({
    key: c.doctor.id,
    label: c.doctor.name,
    day: date,
    doctorId: c.doctor.id,
    header: <DoctorHeader c={c} />,
    block: c.block,
    appointments: c.appointments,
    blocked: c.blocked,
  }))

  const filtered = !me && (doctorIds.length > 0 || specialty.length > 0)
  const onSlot = (c: GridColumn, minutes: number) => setCreating({ doctorId: c.doctorId, day: c.day, time: String(minutes) })
  const rangeLabel = view === "day" ? null : `${fmtDate(view === "week" ? mondayOf(date) : date)} – ${fmtDate(addDays(view === "week" ? mondayOf(date) : date, 6))}`

  const c = me ? doctorChartCopy.schedule : adminCopy.pages.schedule
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <>
            {me ? <MyStats day={date} doctorId={me} /> : <HeaderStats day={date} />}
            <Button className="h-10 rounded-full px-4 text-caption" onClick={() => setCreating({ day: date < TODAY ? TODAY : date })}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              {adminCopy.newAppointment}
            </Button>
          </>
        }
      />

      <section className={cn(panel, "flex min-w-0 flex-col overflow-hidden")} aria-label="Calendar">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" className="h-10 rounded-full px-3.5 md:h-9 text-caption" onClick={() => setDate(TODAY)} disabled={date === TODAY}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="size-10 rounded-full md:size-9" aria-label={view === "day" ? "Previous day" : "Previous week"} onClick={() => setDate(addDays(date, -step))}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button variant="ghost" size="icon" className="size-10 rounded-full md:size-9" aria-label={view === "day" ? "Next day" : "Next week"} onClick={() => setDate(addDays(date, step))}>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
            <DatePicker value={date} onChange={setDate} />
            {rangeLabel && <span className="hidden px-1 text-neutral-500 tabular-nums text-caption xl:inline">{rangeLabel}</span>}
          </div>

          <Tabs value={view} onValueChange={(v) => url.set({ view: v === "day" ? null : String(v) })} className="md:ml-2">
            <TabsList className="h-9 bg-neutral-100">
              {views.map((v) => (
                <TabsTrigger key={v.id} value={v.id} className="h-full rounded-full px-4 text-caption">
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            {view !== "doctor" && !me && (
              <>
                <FacetFilter title="Provider" options={doctorOptions} selected={doctorIds} onChange={(v) => url.set({ doctors: v })} />
                <FacetFilter title="Specialty" options={specialties.map((s) => ({ value: s.id, label: s.name }))} selected={specialty} onChange={(v) => url.set({ specialty: v })} />
                <ResetButton show={filtered} onClick={() => url.set({ doctors: null, specialty: null })} />
              </>
            )}
          </div>
        </div>

        {view === "day" && (
          <>
            {columns.length > 1 && (
              <div className="border-b border-neutral-100 p-3 md:hidden">
                <SelectInput label="Provider to show" value={columns.some((x) => x.key === mobileDoctor) ? mobileDoctor : columns[0].key} onChange={setMobileDoctor} options={(day.data?.columns ?? []).map((x) => ({ value: x.doctor.id, label: `${x.doctor.name} · ${columnLoad(x).booked} booked` }))} />
              </div>
            )}
            {day.error ? (
              <ErrorState onRetry={day.retry} />
            ) : day.initial ? (
              <TimeGridSkeleton />
            ) : columns.length === 0 ? (
              <EmptyState
                icon={Calendar03Icon}
                title={scheduleCopy.emptyTitle}
                text={scheduleCopy.emptyText}
                action={
                  filtered ? (
                    <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={() => url.set({ doctors: null, specialty: null })}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <TimeGrid label={`Schedule for ${fmtDateLong(date)}`} columns={columns} mobileKey={mobileDoctor} refreshing={day.loading} onOpen={(id) => url.set({ open: id })} onSlot={onSlot} showOpen={!!me} />
            )}
          </>
        )}

        {view === "week" && !me && <WeekView from={mondayOf(date)} clinic={clinic} doctorIds={doctorIds} specialty={specialty} onDay={(d) => url.set({ view: null, date: d === TODAY ? null : d })} />}

        {view === "doctor" && (
          <DoctorView
            from={date}
            doctorId={me ?? (url.get("doctor") || doctorOptions[0]?.value || "")}
            options={doctorOptions}
            fixed={!!me}
            onDoctor={(id) => url.set({ doctor: id })}
            onOpen={(id) => url.set({ open: id })}
            onSlot={onSlot}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3">
          <Legend />
          {view !== "week" && <p className="text-neutral-400 text-micro">{scheduleCopy.slotHint}</p>}
        </div>
      </section>

      <AppointmentSheet id={open} onOpenChange={(o) => !o && url.set({ open: null })} />
      {creating && <NewAppointmentDialog open onOpenChange={(o) => !o && setCreating(null)} defaults={creating} onCreated={(id) => url.set({ open: id })} />}
    </div>
  )
}

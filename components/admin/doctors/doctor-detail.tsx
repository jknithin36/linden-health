"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Calendar03Icon, PlusSignIcon, StarIcon, Video01Icon } from "@hugeicons/core-free-icons"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { adminCopy } from "@/lib/data/admin"
import { doctorsCopy } from "@/lib/data/admin-schedule"
import { fmtDate, fmtPercent, fmtTime, parseLocal, relative } from "@/lib/admin/format"
import { getDoctorDetail, getPatientSync } from "@/lib/admin/queries"
import { useSession } from "@/lib/session-client"
import { useQuery } from "@/components/admin/hooks"
import { Avatar, ChartCard, ChartSkeleton, ClinicBadge, CardSkeleton, chartAxis, chartGrid, DetailSkeleton, EmptyState, ErrorState, KeyValue, panel, StatCard, StatusBadge } from "@/components/admin/ui"
import { NewAppointmentDialog, visitTypeLabel } from "@/components/admin/forms"
import { AppointmentSheet } from "@/components/admin/appointment-sheet"
import { HoursEditor } from "@/components/admin/doctors/hours-editor"
import { TimeOffList } from "@/components/admin/doctors/time-off"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = { utilization: { label: "Utilization", color: "var(--color-sky-500)" } }

function DetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className={panel}>
        <DetailSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
    </div>
  )
}

export function DoctorDetail({ id }: { id: string }) {
  const canEdit = useSession()?.role === "admin"
  const { data, initial, error, retry } = useQuery(() => getDoctorDetail(id), [id])
  const [open, setOpen] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const c = doctorsCopy.detail

  const back = (
    <Link href="/admin/doctors" className={cn("inline-flex w-fit items-center gap-1 rounded-full text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}>
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
      {c.back}
    </Link>
  )

  if (error)
    return (
      <div className="flex flex-col gap-4">
        {back}
        <div className={panel}>
          <ErrorState onRetry={retry} />
        </div>
      </div>
    )
  if (initial || !data) return <DetailLoading />

  const d = data.doctor
  const chart = data.weeks.map((w) => ({ week: format(parseLocal(w.week), "MMM d"), utilization: Math.round(w.utilization * 100), booked: w.booked, capacity: w.capacity }))
  const avgUtil = data.weeks.reduce((s, w) => s + w.booked, 0) / Math.max(1, data.weeks.reduce((s, w) => s + w.capacity, 0))

  return (
    <div className="flex flex-col gap-6">
      {back}

      {/* Profile */}
      <section className={cn(panel, "flex flex-col gap-5 p-5 md:flex-row md:items-start md:p-6")} aria-labelledby="doctor-name">
        <Avatar name={d.name} id={d.id} src={d.avatar} eager className="size-20 text-body" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="doctor-name" className="text-neutral-950 text-page">
              {d.name}
            </h1>
            <StatusBadge kind="doctor" status={d.status} />
            <StatusBadge kind="accepting" status={d.acceptingNew ? "yes" : "no"} />
          </div>
          <p className="mt-1 text-neutral-500 text-body">
            {d.specialty} · {d.credential} · {d.yearsExperience} years in practice
          </p>
          {d.leave && (
            <p className="mt-3 w-fit rounded-xl bg-amber-50 px-3 py-2 text-amber-800 text-caption">
              {d.leave.reason}: {fmtDate(d.leave.from)} – {fmtDate(d.leave.to)}. Not bookable during leave.
            </p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <KeyValue label="Clinics">
              <span className="flex flex-wrap gap-2">
                {d.clinicIds.map((x) => (
                  <ClinicBadge key={x} id={x} />
                ))}
              </span>
            </KeyValue>
            <KeyValue label="Languages">{d.languages.join(", ")}</KeyValue>
            <KeyValue label="Rating">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <HugeiconsIcon icon={StarIcon} strokeWidth={1.8} aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                {d.rating.toFixed(1)} <span className="text-neutral-400">({d.reviewCount} reviews)</span>
              </span>
            </KeyValue>
            <KeyValue label="Avg. utilization">{fmtPercent(avgUtil)} · 8 wk</KeyValue>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10 rounded-full px-4 text-caption" nativeButton={false} render={<Link href={`/admin/schedule?view=doctor&doctor=${d.id}`} />}>
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} data-icon="inline-start" />
            View schedule
          </Button>
          {d.status === "active" && (
            <Button className="h-10 rounded-full px-4 text-caption" onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              {adminCopy.newAppointment}
            </Button>
          )}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={c.stats.noShow} value={fmtPercent(data.noShowRate, 1)} hint={c.stats.noShowHint} tone={data.noShowRate >= 0.08 ? "amber" : undefined} spark={data.weeks.map((w) => w.noShows)} />
        <StatCard label={c.stats.avgVisit} value={data.avgVisit ? `${data.avgVisit} min` : "—"} hint={c.stats.avgVisitHint} />
        <StatCard label={c.stats.panel} value={data.patientsCount} hint={c.stats.panelHint} href={`/admin/patients?primaryDoctorId=${d.id}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <ChartCard title={c.utilization.title} subtitle={c.utilization.text}>
            <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
              <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="week" {...chartAxis} />
                <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} />
                <ChartTooltip cursor={{ fill: "var(--color-neutral-50)" }} content={<ChartTooltipContent formatter={(v, _n, item) => <span className="tabular-nums">{v}% · {item.payload.booked}/{item.payload.capacity} slots</span>} />} />
                <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </ChartCard>
          <HoursEditor doctor={d} canEdit={canEdit} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <TimeOffList doctorId={d.id} items={data.timeOff} canEdit={canEdit} />

          <section className={cn(panel, "flex flex-col")} aria-labelledby="upcoming-title">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 p-5">
              <h2 id="upcoming-title" className="text-neutral-950 text-body">
                {c.upcoming.title}
              </h2>
              <span className="text-neutral-400 tabular-nums text-caption">{data.upcoming.length}</span>
            </div>
            {data.upcoming.length === 0 ? (
              <EmptyState icon={Calendar03Icon} title={c.upcoming.empty} />
            ) : (
              <ul className="flex flex-col divide-y divide-neutral-100">
                {data.upcoming.map((a) => {
                  const p = getPatientSync(a.patientId)
                  return (
                    <li key={a.id}>
                      <button type="button" onClick={() => setOpen(a.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)]">
                        <span className="w-16 shrink-0">
                          <span className="block text-neutral-950 tabular-nums text-caption">{fmtTime(a.start)}</span>
                          <span className="block text-neutral-400 text-micro">{fmtDate(a.start).replace(",", "")}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-neutral-950 text-caption">
                            <span className="truncate">{p?.name}</span>
                            {a.type === "video" && <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} role="img" aria-label="Video visit" className="size-3.5 shrink-0 text-sky-600" />}
                          </span>
                          <span className="block truncate text-neutral-500 text-micro">
                            {visitTypeLabel(a.visitType)} · {a.reason} · {relative(a.start)}
                          </span>
                        </span>
                        <StatusBadge kind="appointment" status={a.status} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <AppointmentSheet id={open} onOpenChange={(o) => !o && setOpen(null)} />
      {creating && <NewAppointmentDialog open onOpenChange={(o) => !o && setCreating(false)} defaults={{ doctorId: d.id }} onCreated={setOpen} />}
    </div>
  )
}

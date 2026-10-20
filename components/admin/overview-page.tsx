"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowRight01Icon, DocumentValidationIcon, File01Icon, Invoice01Icon, Medicine02Icon, Message01Icon, PlusSignIcon, QueueIcon, Shield01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { adminCopy } from "@/lib/data/admin"
import { overviewCopy as c } from "@/lib/data/admin-overview"
import { fmtDate, fmtDateFull, fmtMoneyRound, fmtPercent, fmtTime, relative, TODAY } from "@/lib/admin/format"
import { authorName, getClinicSync, getDoctorSync, getOverview, getPatientSync, waitLevel, waitMinutes } from "@/lib/admin/queries"
import { useAdminState } from "@/lib/admin/store"
import { useQuery } from "@/components/admin/hooks"
import { AppointmentSheet } from "@/components/admin/appointment-sheet"
import { NewAppointmentDialog } from "@/components/admin/forms"
import { CardSkeleton, ChartSkeleton, ErrorState, PageHeader, panel, PatientCell, Section, SectionLink, StatCard, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// The chart library loads on demand, so the rest of the overview doesn't wait for it.
const OverviewTrend = dynamic(() => import("@/components/admin/overview-trend"), { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-xl" /> })

type Overview = Awaited<ReturnType<typeof getOverview>>

const waitText = { red: "text-red-700", amber: "text-amber-700", normal: "text-neutral-700" } as const

export function OverviewPage() {
  const clinic = useAdminState((s) => s.clinic)
  const { data, initial, error, retry } = useQuery(() => getOverview(clinic), [clinic])
  const [open, setOpen] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const where = clinic === "all" ? adminCopy.allClinics : getClinicSync(clinic).name

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={c.greeting(data?.firstName)}
        description={`${fmtDateFull(TODAY)} · ${where}`}
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/queue" />} className="h-10 rounded-full px-4 text-caption">
              <HugeiconsIcon icon={QueueIcon} strokeWidth={1.8} data-icon="inline-start" />
              {c.openQueue}
            </Button>
            <Button className="h-10 rounded-full px-4 text-caption" onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              {adminCopy.newAppointment}
            </Button>
          </>
        }
      />

      {error ? (
        <div className={panel}>
          <ErrorState onRetry={retry} />
        </div>
      ) : initial || !data ? (
        <OverviewSkeleton />
      ) : (
        <>
          <Stats d={data} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex min-w-0 flex-col gap-6">
              <LiveQueue d={data} onOpen={setOpen} />
              <Trend d={data} />
              <UpNext d={data} onOpen={setOpen} />
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <Attention d={data} />
              <Billing d={data} />
              <Activity d={data} />
            </div>
          </div>
        </>
      )}

      <AppointmentSheet id={open} onOpenChange={(o) => !o && setOpen(null)} />
      <NewAppointmentDialog open={creating} onOpenChange={setCreating} onCreated={setOpen} />
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading overview" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <div className={cn(panel, "flex flex-col gap-3 p-5")}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <ChartSkeleton />
        </div>
        <div className="flex flex-col gap-6">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-40" />
        </div>
      </div>
    </div>
  )
}

function Stats({ d }: { d: Overview }) {
  const delta = d.todayDelta
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label={c.stats.today}
        value={d.today}
        delta={{ value: `${delta > 0 ? "+" : ""}${delta}`, direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat" }}
        hint={c.stats.todayHint}
        spark={d.series.map((s) => s.booked)}
        href="/admin/appointments"
      />
      <StatCard label={c.stats.checkedIn} value={`${d.checkedIn}`} hint={`${fmtPercent(d.today ? d.checkedIn / d.today : 0)} ${c.stats.checkedInHint}`} spark={d.series.map((s) => s.completed)} href="/admin/queue" />
      <StatCard label={c.stats.waiting} value={d.waiting} hint={`${c.stats.avg} ${d.avgWait} min · ${c.stats.longest} ${d.longestWait} min`} tone={d.longestWait > 25 ? "red" : d.avgWait >= 15 ? "amber" : undefined} href="/admin/queue" />
      <StatCard label={c.stats.open} value={d.open} hint={`${fmtPercent(d.utilization)} ${c.stats.utilization}`} href="/admin/schedule" />
    </div>
  )
}

function LiveQueue({ d, onOpen }: { d: Overview; onOpen: (id: string) => void }) {
  const rows = d.queue.slice(0, 6)
  return (
    <Section title={c.queue.title} count={d.queue.length} flush action={<SectionLink href="/admin/queue">{c.queue.link}</SectionLink>}>
      {rows.length === 0 ? (
        <p className="px-5 pb-5 text-neutral-500 text-caption">{c.queue.empty}</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
            <caption className="sr-only">{c.queue.title}</caption>
            <thead>
              <tr className="text-neutral-400 text-micro">
                {c.queue.cols.map((h, i) => (
                  <th key={h} scope="col" className={cn("border-y border-neutral-100 px-5 py-2", i === c.queue.cols.length - 1 && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const w = waitMinutes(a)
                return (
                  <tr key={a.id} tabIndex={0} aria-label={`${getPatientSync(a.patientId)?.name}, ${fmtTime(a.start)}`} onClick={() => onOpen(a.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(a.id))} className="cursor-pointer outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)] [&:last-child>td]:border-b-0">
                    <td className="border-b border-neutral-100 px-5 py-2.5">
                      <PatientCell patient={a.patientId} />
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-2.5 whitespace-nowrap text-neutral-700 tabular-nums text-caption">{fmtTime(a.start)}</td>
                    <td className="border-b border-neutral-100 px-5 py-2.5 whitespace-nowrap text-neutral-700 text-caption">{getDoctorSync(a.doctorId)?.name}</td>
                    <td className="border-b border-neutral-100 px-5 py-2.5">
                      <StatusBadge kind="appointment" status={a.status} />
                    </td>
                    <td className={cn("border-b border-neutral-100 px-5 py-2.5 text-right tabular-nums text-caption", a.status === "with-doctor" ? "text-neutral-400" : waitText[waitLevel(w)])}>{a.status === "with-doctor" ? (a.room ? `Room ${a.room}` : "—") : `${w} min`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

function Trend({ d }: { d: Overview }) {
  const data = d.series.map((s) => ({ ...s, label: fmtDate(s.day).replace(/^\w+, /, "") }))
  return (
    <Section title={c.trend.title} flush action={<SectionLink href="/admin/reports">{c.trend.link}</SectionLink>}>
      <div className="px-3 pb-4">
        <OverviewTrend data={data} />
        <div className="flex gap-4 px-3 pt-1 text-neutral-500 text-micro">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-sm bg-neutral-200" />
            {c.trend.booked}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-sm bg-sky-500" />
            {c.trend.completed}
          </span>
        </div>
      </div>
    </Section>
  )
}

function UpNext({ d, onOpen }: { d: Overview; onOpen: (id: string) => void }) {
  return (
    <Section title={c.upNext.title} flush action={<SectionLink href="/admin/schedule">{c.upNext.link}</SectionLink>}>
      {d.upcoming.length === 0 ? (
        <p className="px-5 pb-5 text-neutral-500 text-caption">{c.upNext.empty}</p>
      ) : (
        <ul className="flex flex-col border-t border-neutral-100">
          {d.upcoming.map((a) => (
            <li key={a.id} className="border-b border-neutral-100 last:border-b-0">
              <button type="button" onClick={() => onOpen(a.id)} className="grid w-full grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-2.5 text-left outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)] sm:grid-cols-[4rem_minmax(0,14rem)_minmax(0,1fr)_auto]">
                <span className="text-neutral-950 tabular-nums text-caption">{fmtTime(a.start)}</span>
                <PatientCell patient={a.patientId} link={false} />
                <span className="hidden min-w-0 truncate text-neutral-500 sm:block text-caption">
                  {a.reason} · {getDoctorSync(a.doctorId)?.name}
                </span>
                <span className="flex justify-end gap-1.5">
                  {!a.formsDone && <StatusBadge kind="forms" status="pending" />}
                  {!a.insuranceVerified && <StatusBadge kind="insurance" status="not-verified" className="max-md:hidden" />}
                  {a.formsDone && a.insuranceVerified && <StatusBadge kind="appointment" status={a.status} />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Attention({ d }: { d: Overview }) {
  const items: { icon: IconSvgElement; label: string; n: number; href: string; urgent?: boolean }[] = [
    { icon: Message01Icon, label: c.attention.overdue, n: d.overdueThreads, href: "/admin/messages?unread=yes", urgent: true },
    { icon: Message01Icon, label: c.attention.unread, n: d.unreadThreads, href: "/admin/messages?unread=yes" },
    { icon: Medicine02Icon, label: c.attention.refills, n: d.newRefills, href: "/admin/messages?view=refills" },
    { icon: Invoice01Icon, label: c.attention.denied, n: d.deniedClaims, href: "/admin/billing?status=denied", urgent: true },
    { icon: File01Icon, label: c.attention.forms, n: d.formsPending, href: "/admin/appointments?forms=pending" },
    { icon: Shield01Icon, label: c.attention.insurance, n: d.unverified, href: "/admin/appointments?insurance=not-verified" },
  ]
  const shown = items.filter((i) => i.n > 0)
  return (
    <Section title={c.attention.title} flush>
      {shown.length === 0 ? (
        <p className="flex items-center gap-2 px-5 pb-5 text-neutral-500 text-caption">
          <HugeiconsIcon icon={DocumentValidationIcon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
          {c.attention.clear}
        </p>
      ) : (
        <ul className="flex flex-col border-t border-neutral-100">
          {shown.map((i) => (
            <li key={i.label} className="border-b border-neutral-100 last:border-b-0">
              <Link href={i.href} className="group flex items-center gap-3 px-5 py-3 outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)]">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", i.urgent ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600")}>
                  <HugeiconsIcon icon={i.icon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-neutral-800 text-caption">{i.label}</span>
                <span className={cn("tabular-nums text-body", i.urgent ? "text-red-700" : "text-neutral-950")}>{i.n}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-neutral-300 transition-colors group-hover:text-neutral-600" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Billing({ d }: { d: Overview }) {
  const b = d.billing
  const rows = [
    { label: c.billing.collected, value: fmtMoneyRound(b.collected) },
    { label: c.billing.outstanding, value: fmtMoneyRound(b.outstanding) },
    { label: c.billing.denial, value: fmtPercent(b.denialRate, 1), warn: b.denialRate > 0.08 },
    { label: c.billing.days, value: `${b.daysToPay.toFixed(1)} days` },
  ]
  return (
    <Section title={c.billing.title} flush action={<SectionLink href="/admin/billing">{c.viewAll}</SectionLink>}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl border-t border-neutral-100 bg-neutral-100">
        {rows.map((r) => (
          <div key={r.label} className="bg-white px-5 py-3.5">
            <dt className="text-neutral-500 text-micro">{r.label}</dt>
            <dd className={cn("mt-0.5 tabular-nums text-body", r.warn ? "text-amber-700" : "text-neutral-950")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

function Activity({ d }: { d: Overview }) {
  return (
    <Section title={c.activity.title} flush action={<SectionLink href="/admin/settings?tab=audit">{c.activity.link}</SectionLink>}>
      <ol className="flex flex-col gap-3.5 border-t border-neutral-100 px-5 py-4">
        {d.activity.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neutral-300" />
            <div className="min-w-0">
              <p className="text-pretty text-neutral-800 text-caption">{e.summary}</p>
              <p className="text-neutral-400 text-micro">
                {authorName(e.actorId)} · {relative(e.at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

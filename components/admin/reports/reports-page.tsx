"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Analytics01Icon, Download01Icon } from "@hugeicons/core-free-icons"

import { adminCopy } from "@/lib/data/admin"
import { reportsCopy } from "@/lib/data/admin-reports"
import { categoryLabel } from "@/lib/data/admin-billing"
import { addDays, daysBetween, fmtDateLong, fmtMoneyRound, fmtNumber, fmtPercent, TODAY } from "@/lib/admin/format"
import { getClinicSync, getReport, RANGE } from "@/lib/admin/queries"
import { useAdminState } from "@/lib/admin/store"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DateRangeFilter } from "@/components/admin/data-table"
import { CardSkeleton, ChartSkeleton, EmptyState, ErrorState, notify, PageHeader, panel, StatCard } from "@/components/admin/ui"
import { downloadCsv } from "@/components/admin/csv"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LazyRender } from "@/components/admin/reports/lazy"
import {
  AppointmentsChart,
  NewReturningChart,
  PayerChart,
  RatesChart,
  RevenueChart,
  SpecialtyChart,
  TypeChart,
  UtilizationChart,
  WaitClinicChart,
  WaitHourChart,
  type Report,
} from "@/components/admin/reports/charts"

type Preset = (typeof reportsCopy.presets)[number]["id"]

function rangeFor(preset: Preset, from: string, to: string) {
  if (preset === "7d") return { from: addDays(TODAY, -6), to: TODAY }
  if (preset === "quarter") return { from: `${TODAY.slice(0, 5)}${String(Math.floor((Number(TODAY.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, "0")}-01`, to: TODAY }
  if (preset === "custom" && from) {
    const start = from < RANGE.from ? RANGE.from : from
    const end = to && to >= start ? (to > TODAY ? TODAY : to) : start
    return { from: start > TODAY ? TODAY : start, to: end }
  }
  return { from: addDays(TODAY, -29), to: TODAY }
}

type Delta = { value: string; direction: "up" | "down" | "flat" }
const relDelta = (cur: number, prev: number): Delta | undefined => {
  if (!prev) return undefined
  const d = (cur - prev) / prev
  return { value: fmtPercent(Math.abs(d), Math.abs(d) < 0.1 ? 1 : 0), direction: Math.abs(d) < 0.005 ? "flat" : d > 0 ? "up" : "down" }
}
const pointDelta = (cur: number, prev: number): Delta => {
  const d = (cur - prev) * 100
  return { value: `${Math.abs(d).toFixed(1)}\u00a0pt`, direction: Math.abs(d) < 0.05 ? "flat" : d > 0 ? "up" : "down" }
}
const minuteDelta = (cur: number, prev: number): Delta => {
  const d = cur - prev
  return { value: `${Math.abs(d).toFixed(1)}\u00a0min`, direction: Math.abs(d) < 0.05 ? "flat" : d > 0 ? "up" : "down" }
}

function exportReport(r: Report, prevRevenue: number, meta: { from: string; to: string; clinic: string }) {
  const rows: { Section: string; Metric: string; Value: string | number; Previous?: string | number }[] = []
  const k = r.kpis
  rows.push({ Section: "Range", Metric: "From", Value: meta.from }, { Section: "Range", Metric: "To", Value: meta.to }, { Section: "Range", Metric: "Clinic", Value: meta.clinic })
  rows.push(
    { Section: "KPIs", Metric: reportsCopy.kpis.visits, Value: k.current.visits, Previous: k.previous.visits },
    { Section: "KPIs", Metric: reportsCopy.kpis.noShow, Value: fmtPercent(k.current.noShowRate, 1), Previous: fmtPercent(k.previous.noShowRate, 1) },
    { Section: "KPIs", Metric: `${reportsCopy.kpis.wait} (min)`, Value: k.current.avgWait.toFixed(1), Previous: k.previous.avgWait.toFixed(1) },
    { Section: "KPIs", Metric: reportsCopy.kpis.video, Value: fmtPercent(k.current.video, 1), Previous: fmtPercent(k.previous.video, 1) },
    { Section: "KPIs", Metric: reportsCopy.kpis.revenue, Value: k.revenue.toFixed(2), Previous: prevRevenue.toFixed(2) },
  )
  for (const s of r.bySpecialty) rows.push({ Section: "Visits by specialty", Metric: s.name, Value: s.visits })
  for (const s of r.byType) rows.push({ Section: "Visits by type", Metric: s.name, Value: s.value })
  for (const s of r.waitByClinic) rows.push({ Section: "Avg wait by clinic (min)", Metric: s.name, Value: s.minutes })
  for (const s of r.waitByHour) rows.push({ Section: "Avg wait by hour (min)", Metric: s.hour, Value: s.minutes })
  for (const s of r.revenue) rows.push({ Section: "Revenue billed", Metric: s.month, Value: s.billed.toFixed(2) }, { Section: "Revenue collected", Metric: s.month, Value: s.collected.toFixed(2) })
  for (const s of r.payerMix) rows.push({ Section: "Payer mix (claims)", Metric: categoryLabel[s.name] ?? s.name, Value: s.value })
  for (const s of r.rates) rows.push({ Section: "No-show rate by week", Metric: s.week, Value: fmtPercent(s.noShow, 1) }, { Section: "Cancel rate by week", Metric: s.week, Value: fmtPercent(s.cancel, 1) })
  for (const s of r.newReturning) rows.push({ Section: "New vs returning by week", Metric: s.week, Value: `${s.new} new / ${s.returning} returning` })
  for (const s of r.utilization) rows.push({ Section: "Doctor utilization", Metric: s.name, Value: fmtPercent(s.utilization) })
  downloadCsv(`report-${meta.from}-to-${meta.to}.csv`, rows.map((x) => ({ ...x, Previous: x.Previous ?? "" })))
  notify.success("Report exported", `${fmtDateLong(meta.from)} – ${fmtDateLong(meta.to)}`)
}

export function ReportsPage() {
  const url = useUrlState()
  const clinic = useAdminState((s) => s.clinic)
  const raw = url.get("range", "30d")
  const preset: Preset = reportsCopy.presets.some((p) => p.id === raw) ? (raw as Preset) : "30d"
  const { from, to } = rangeFor(preset, url.get("from"), url.get("to"))
  const span = daysBetween(from, to) + 1

  const { data, initial, loading, error, retry } = useQuery(async () => {
    const [current, prev] = await Promise.all([getReport({ from, to, clinic }), getReport({ from: addDays(from, -span), to: addDays(from, -1), clinic })])
    return { report: current, prevRevenue: prev.kpis.revenue }
  }, [from, to, clinic])

  const c = adminCopy.pages.reports
  const clinicName = clinic === "all" ? adminCopy.allClinics : getClinicSync(clinic).short
  const r = data?.report

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <Button variant="outline" className="h-10 rounded-full px-4 text-caption" disabled={!data} onClick={() => data && exportReport(data.report, data.prevRevenue, { from, to, clinic: clinicName })}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {reportsCopy.export}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs value={preset} onValueChange={(v) => url.set({ range: v === "30d" ? null : String(v), ...(v === "custom" ? { from, to } : { from: null, to: null }) })}>
          <TabsList className="relative h-10 w-full justify-start overflow-x-auto bg-neutral-100 sm:w-fit sm:max-w-full">
            {reportsCopy.presets.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="h-full shrink-0 rounded-full px-4 text-caption">
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {preset === "custom" && <DateRangeFilter from={url.get("from") || from} to={url.get("to") || to} onChange={(f, t) => url.set({ range: "custom", from: f, to: t })} />}
        <p className="text-neutral-500 tabular-nums text-caption sm:ml-auto" aria-live="polite">
          {fmtDateLong(from)} – {fmtDateLong(to)} · {clinicName}
          {loading && !initial && <span className="ml-2 text-neutral-400">Updating…</span>}
        </p>
      </div>

      {error && !r ? (
        <div className={panel}>
          <ErrorState onRetry={retry} />
        </div>
      ) : !r || !data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton className="h-80" />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </>
      ) : (
        <>
          <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label={reportsCopy.kpis.visits} value={fmtNumber(r.kpis.current.visits)} delta={relDelta(r.kpis.current.visits, r.kpis.previous.visits)} hint={reportsCopy.vsPrevious} />
            <StatCard label={reportsCopy.kpis.noShow} value={fmtPercent(r.kpis.current.noShowRate, 1)} delta={pointDelta(r.kpis.current.noShowRate, r.kpis.previous.noShowRate)} deltaGood="down" hint={reportsCopy.vsPrevious} />
            <StatCard label={reportsCopy.kpis.wait} value={`${r.kpis.current.avgWait.toFixed(1)}\u00a0min`} delta={minuteDelta(r.kpis.current.avgWait, r.kpis.previous.avgWait)} deltaGood="down" hint={reportsCopy.vsPrevious} />
            <StatCard label={reportsCopy.kpis.video} value={fmtPercent(r.kpis.current.video, 1)} delta={pointDelta(r.kpis.current.video, r.kpis.previous.video)} hint={reportsCopy.vsPrevious} />
            <StatCard label={reportsCopy.kpis.revenue} value={fmtMoneyRound(r.kpis.revenue)} delta={relDelta(r.kpis.revenue, data.prevRevenue)} hint={reportsCopy.vsPrevious} />
          </section>

          {r.kpis.current.visits === 0 && r.appointments.length === 0 ? (
            <div className={panel}>
              <EmptyState icon={Analytics01Icon} title={reportsCopy.empty.title} text={reportsCopy.empty.text} />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <AppointmentsChart data={r.appointments} />
              <RatesChart data={r.rates} />
              <LazyRender>
                <SpecialtyChart data={r.bySpecialty} />
              </LazyRender>
              <LazyRender>
                <TypeChart data={r.byType} />
              </LazyRender>
              <LazyRender>
                <WaitClinicChart data={r.waitByClinic} />
              </LazyRender>
              <LazyRender>
                <WaitHourChart data={r.waitByHour} />
              </LazyRender>
              <LazyRender>
                <RevenueChart data={r.revenue} />
              </LazyRender>
              <LazyRender>
                <PayerChart data={r.payerMix} />
              </LazyRender>
              <LazyRender>
                <NewReturningChart data={r.newReturning} />
              </LazyRender>
              <LazyRender>
                <UtilizationChart data={r.utilization} />
              </LazyRender>
            </div>
          )}
        </>
      )}
    </div>
  )
}

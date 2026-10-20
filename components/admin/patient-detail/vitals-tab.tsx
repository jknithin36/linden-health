"use client"

import { PulseRectangle01Icon } from "@hugeicons/core-free-icons"
import { CartesianGrid, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts"

import { chartCopy } from "@/lib/data/admin-patients"
import { fmtDate, fmtDateLong } from "@/lib/admin/format"
import type { Patient, Vitals } from "@/lib/admin/types"
import { chartAxis, chartGrid, ChartCard, EmptyState, panel } from "@/components/admin/ui"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const c = chartCopy.vitals
const SKY = "var(--color-sky-600)"
const VIOLET = "var(--color-violet-500)"

type Series = { key: keyof Vitals; label: string; color: string }
type Band = { from: number; to: number }

function VitalChart({ title, unit, rows, series, bands, latest, domain }: { title: string; unit: string; rows: Vitals[]; series: Series[]; bands: Band[]; latest: string; domain: [number, number] }) {
  const config = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig
  const data = rows.map((r) => ({ ...r, label: fmtDate(r.date).split(", ")[1] }))
  const last = rows.at(-1)!
  return (
    <ChartCard title={title} subtitle={`Latest ${latest}${unit ? ` ${unit}` : ""} · ${fmtDateLong(last.date)}`}>
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid {...chartGrid} />
          {bands.map((b) => (
            <ReferenceArea key={`${b.from}-${b.to}`} y1={b.from} y2={b.to} fill="var(--color-emerald-500)" fillOpacity={0.08} stroke="none" ifOverflow="hidden" />
          ))}
          <XAxis dataKey="label" {...chartAxis} minTickGap={16} />
          <YAxis {...chartAxis} width={44} domain={domain} tickFormatter={(v: number) => String(Math.round(v * 10) / 10)} />
          <ChartTooltip cursor={{ stroke: "var(--color-neutral-300)" }} content={<ChartTooltipContent labelFormatter={(_, p) => (p?.[0]?.payload?.date ? fmtDateLong(p[0].payload.date as string) : "")} formatter={(v, name) => (
            <span className="flex w-full items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-neutral-500">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: config[name as string]?.color }} />
                {config[name as string]?.label}
              </span>
              <span className="text-neutral-950 tabular-nums">
                {v as number} {unit}
              </span>
            </span>
          )} />} />
          {series.map((s) => (
            <Line key={s.key} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} dot={{ r: 3.5, fill: "white", strokeWidth: 2 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-500 text-micro">
        {series.length > 1 &&
          series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        {bands.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm bg-emerald-500/15" />
            Normal {bands.map((b) => `${b.from}–${b.to}`).join(" / ")}
            {unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>
    </ChartCard>
  )
}

const pad = (vals: number[], bands: Band[], step: number): [number, number] => {
  const all = [...vals, ...bands.flatMap((b) => [b.from, b.to])]
  return [Math.floor((Math.min(...all) - step) / step) * step, Math.ceil((Math.max(...all) + step) / step) * step]
}

export function VitalsTab({ vitals, patient }: { vitals: Vitals[]; patient: Patient }) {
  if (!vitals.length)
    return (
      <div className={panel}>
        <EmptyState icon={PulseRectangle01Icon} title={c.empty.title} text={c.empty.text} />
      </div>
    )
  const rows = [...vitals].sort((a, b) => (a.date < b.date ? -1 : 1))
  const last = rows.at(-1)!
  const adult = patient.age >= 18
  const h2 = last.heightIn * last.heightIn
  const bpBands: Band[] = adult ? [{ from: 90, to: 120 }, { from: 60, to: 80 }] : []
  const wBand: Band[] = adult ? [{ from: Math.round((18.5 * h2) / 703), to: Math.round((24.9 * h2) / 703) }] : []
  const bmiBand: Band[] = adult ? [{ from: 18.5, to: 24.9 }] : []
  const hrBand: Band[] = [patient.age >= 13 ? { from: 60, to: 100 } : { from: 70, to: 120 }]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <VitalChart
          title={c.charts.bp}
          unit="mmHg"
          rows={rows}
          latest={`${last.systolic}/${last.diastolic}`}
          series={[
            { key: "systolic", label: "Systolic", color: SKY },
            { key: "diastolic", label: "Diastolic", color: VIOLET },
          ]}
          bands={bpBands}
          domain={pad(rows.flatMap((r) => [r.systolic, r.diastolic]), bpBands, 10)}
        />
        <VitalChart title={c.charts.weight} unit="lb" rows={rows} latest={String(last.weightLb)} series={[{ key: "weightLb", label: "Weight", color: SKY }]} bands={wBand} domain={pad(rows.map((r) => r.weightLb), wBand, 5)} />
        <VitalChart title={c.charts.bmi} unit="" rows={rows} latest={String(last.bmi)} series={[{ key: "bmi", label: "BMI", color: SKY }]} bands={bmiBand} domain={pad(rows.map((r) => r.bmi), bmiBand, 1)} />
        <VitalChart title={c.charts.hr} unit="bpm" rows={rows} latest={String(last.heartRate)} series={[{ key: "heartRate", label: "Heart rate", color: SKY }]} bands={hrBand} domain={pad(rows.map((r) => r.heartRate), hrBand, 5)} />
      </div>
      {!adult && <p className="text-neutral-500 text-caption">{c.kidsNote}</p>}
    </div>
  )
}

"use client"

import { format } from "date-fns"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"

import { reportsCopy } from "@/lib/data/admin-reports"
import { categoryLabel } from "@/lib/data/admin-billing"
import { fmtMoney, fmtMoneyRound, fmtNumber, fmtPercent, parseLocal } from "@/lib/admin/format"
import type { getReport } from "@/lib/admin/queries"
import { chartAxis, chartColors, chartGrid, ChartCard } from "@/components/admin/ui"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export type Report = Awaited<ReturnType<typeof getReport>>

const ch = reportsCopy.charts
const shortDay = (d: string) => format(parseLocal(d), "MMM d")
const monthName = (m: string) => format(parseLocal(`${m}-01`), "MMM yyyy")
const pct = (v: number) => fmtPercent(v, 0)

/** One tooltip row: color key, series name, formatted value. */
function tipFormatter(config: ChartConfig, fmt: (v: number) => string) {
  // eslint-disable-next-line react/display-name
  return (value: unknown, name: unknown, item: { color?: string; payload?: { fill?: string } }) => {
    const key = String(name)
    return (
      <span className="flex w-full min-w-32 items-center gap-2">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ background: item.payload?.fill ?? item.color ?? `var(--color-${key})` }} />
        <span className="flex-1 text-neutral-500">{config[key]?.label ?? key}</span>
        <span className="text-neutral-950 tabular-nums">{fmt(Number(value))}</span>
      </span>
    )
  }
}

const tooltip = (config: ChartConfig, fmt: (v: number) => string, labelFormatter?: (l: string) => string, hideLabel?: boolean) => (
  <ChartTooltip
    cursor={{ fill: "var(--color-neutral-50)", stroke: "var(--color-neutral-200)" }}
    content={<ChartTooltipContent className="rounded-xl" hideLabel={hideLabel} labelFormatter={labelFormatter ? (l) => labelFormatter(String(l)) : undefined} formatter={tipFormatter(config, fmt) as never} />}
  />
)

const legend = <ChartLegend content={<ChartLegendContent />} />

export function AppointmentsChart({ data }: { data: Report["appointments"] }) {
  const config: ChartConfig = { booked: { label: ch.appointments.booked, color: "var(--color-neutral-300)" }, completed: { label: ch.appointments.completed, color: "var(--color-sky-500)" } }
  const weekly = data.length > 1 && data.length < 20 && data.some((d, i) => i > 0 && Math.abs(parseLocal(d.day).getTime() - parseLocal(data[i - 1].day).getTime()) > 2 * 86_400_000)
  return (
    <ChartCard title={ch.appointments.title} subtitle={`${ch.appointments.subtitle}${weekly ? " · by week" : " · by day"}`}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="day" {...chartAxis} tickFormatter={shortDay} minTickGap={24} />
          <YAxis {...chartAxis} width={40} allowDecimals={false} />
          {tooltip(config, fmtNumber, (l) => (weekly ? `Week of ${shortDay(l)}` : format(parseLocal(l), "EEE, MMM d")))}
          {legend}
          <Line dataKey="booked" type="monotone" stroke="var(--color-booked)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="completed" type="monotone" stroke="var(--color-completed)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function RatesChart({ data }: { data: Report["rates"] }) {
  const config: ChartConfig = { noShow: { label: ch.rates.noShow, color: "var(--color-red-500)" }, cancel: { label: ch.rates.cancel, color: "var(--color-amber-500)" } }
  return (
    <ChartCard title={ch.rates.title} subtitle={ch.rates.subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="week" {...chartAxis} tickFormatter={shortDay} minTickGap={16} />
          <YAxis {...chartAxis} width={40} tickFormatter={pct} />
          {tooltip(config, (v) => fmtPercent(v, 1), (l) => `Week of ${shortDay(l)}`)}
          {legend}
          <Line dataKey="noShow" type="monotone" stroke="var(--color-noShow)" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
          <Line dataKey="cancel" type="monotone" stroke="var(--color-cancel)" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function SpecialtyChart({ data }: { data: Report["bySpecialty"] }) {
  const config: ChartConfig = { visits: { label: ch.specialty.visits, color: "var(--color-sky-500)" } }
  return (
    <ChartCard title={ch.specialty.title} subtitle={ch.specialty.subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="name" {...chartAxis} interval={0} tickFormatter={(v: string) => v.replace(" medicine", "").replace("Women’s health", "Women’s")} />
          <YAxis {...chartAxis} width={40} allowDecimals={false} />
          {tooltip(config, fmtNumber)}
          <Bar dataKey="visits" fill="var(--color-visits)" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

function Donut({ title, subtitle, data, config, keys, fmt = fmtNumber }: { title: string; subtitle: string; data: { name: string; value: number }[]; config: ChartConfig; keys: string[]; fmt?: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent className="rounded-xl" hideLabel nameKey="name" formatter={tipFormatter(config, (v) => `${fmt(v)} · ${total ? fmtPercent(v / total) : "0%"}`) as never} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={1.5} strokeWidth={0} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={`var(--color-${keys[i]})`} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" className="flex-wrap gap-x-4 gap-y-1" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function TypeChart({ data }: { data: Report["byType"] }) {
  const rows = data.map((d) => ({ ...d, name: d.name === "Video" ? "video" : "inPerson" }))
  const config: ChartConfig = { inPerson: { label: "In person", color: "var(--color-sky-500)" }, video: { label: "Video", color: "var(--color-violet-500)" } }
  return <Donut title={ch.type.title} subtitle={ch.type.subtitle} data={rows} config={config} keys={rows.map((r) => r.name)} />
}

export function PayerChart({ data }: { data: Report["payerMix"] }) {
  const rows = data.filter((d) => d.value > 0)
  const config: ChartConfig = Object.fromEntries(data.map((d, i) => [d.name, { label: categoryLabel[d.name] ?? d.name, color: chartColors[i % chartColors.length] }]))
  return <Donut title={ch.payer.title} subtitle={ch.payer.subtitle} data={rows} config={config} keys={rows.map((r) => r.name)} />
}

export function WaitClinicChart({ data }: { data: Report["waitByClinic"] }) {
  const config: ChartConfig = { minutes: { label: ch.waitClinic.minutes, color: "var(--color-sky-500)" } }
  return (
    <ChartCard title={ch.waitClinic.title} subtitle={ch.waitClinic.subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="name" {...chartAxis} />
          <YAxis {...chartAxis} width={40} />
          {tooltip(config, (v) => `${v.toFixed(1)} min`)}
          <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} maxBarSize={64} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function WaitHourChart({ data }: { data: Report["waitByHour"] }) {
  const config: ChartConfig = { minutes: { label: ch.waitHour.minutes, color: "var(--color-amber-500)" } }
  return (
    <ChartCard title={ch.waitHour.title} subtitle={ch.waitHour.subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wait-hour-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-minutes)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-minutes)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="hour" {...chartAxis} interval={1} />
          <YAxis {...chartAxis} width={40} />
          {tooltip(config, (v) => `${v} min`)}
          <Area dataKey="minutes" type="monotone" stroke="var(--color-minutes)" strokeWidth={2} fill="url(#wait-hour-fill)" isAnimationActive={false} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function RevenueChart({ data }: { data: Report["revenue"] }) {
  const config: ChartConfig = { billed: { label: ch.revenue.billed, color: "var(--color-neutral-300)" }, collected: { label: ch.revenue.collected, color: "var(--color-emerald-500)" } }
  return (
    <ChartCard title={ch.revenue.title} subtitle={ch.revenue.subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="month" {...chartAxis} tickFormatter={(m: string) => format(parseLocal(`${m}-01`), "MMM")} />
          <YAxis {...chartAxis} width={56} tickFormatter={(v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : fmtMoneyRound(v))} />
          {tooltip(config, fmtMoney, monthName)}
          {legend}
          <Bar dataKey="billed" fill="var(--color-billed)" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
          <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function NewReturningChart({ data }: { data: Report["newReturning"] }) {
  const config: ChartConfig = { returning: { label: ch.newReturning.returning, color: "var(--color-sky-500)" }, new: { label: ch.newReturning.new, color: "var(--color-emerald-500)" } }
  return (
    <ChartCard title={ch.newReturning.title} subtitle={ch.newReturning.subtitle}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="week" {...chartAxis} tickFormatter={shortDay} minTickGap={16} />
          <YAxis {...chartAxis} width={40} allowDecimals={false} />
          {tooltip(config, fmtNumber, (l) => `Week of ${shortDay(l)}`)}
          {legend}
          <Bar dataKey="returning" stackId="a" fill="var(--color-returning)" maxBarSize={40} isAnimationActive={false} />
          <Bar dataKey="new" stackId="a" fill="var(--color-new)" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function UtilizationChart({ data }: { data: Report["utilization"] }) {
  const config: ChartConfig = { utilization: { label: ch.utilization.utilization, color: "var(--color-sky-500)" } }
  const height = Math.max(160, data.length * 26 + 24)
  return (
    <ChartCard title={ch.utilization.title} subtitle={ch.utilization.subtitle}>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} vertical horizontal={false} />
          <XAxis type="number" {...chartAxis} domain={[0, 1]} tickFormatter={pct} />
          <YAxis type="category" dataKey="name" {...chartAxis} width={120} interval={0} />
          {tooltip(config, (v) => fmtPercent(v))}
          <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

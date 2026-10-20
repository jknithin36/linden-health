"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { Vital } from "@/lib/data/portal"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

/** Line colours: the first series is green, a second one (diastolic) is blue. */
const seriesColor = ["var(--color-emerald-500)", "var(--color-sky-500)"]

function configFor(vital: Vital): ChartConfig {
  return Object.fromEntries(vital.series.map((s, i) => [s.key, { label: s.label, color: seriesColor[i] }]))
}

/** One measure over the last four visits. Loaded lazily by the Health snapshot. */
export function VitalChart({ vital, gradientId, label }: { vital: Vital; gradientId: string; label: string }) {
  return (
    <ChartContainer config={configFor(vital)} className="mt-4 aspect-auto h-36 w-full" aria-label={label} role="img">
      <AreaChart data={vital.history} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          {vital.series.map((s) => (
            <linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${s.key})`} stopOpacity={0.22} />
              <stop offset="100%" stopColor={`var(--color-${s.key})`} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis dataKey="visit" tickLine={false} axisLine={false} tickMargin={8} interval={0} padding={{ left: 22, right: 22 }} />
        <YAxis hide domain={["dataMin - 3", "dataMax + 3"]} />
        <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent indicator="line" />} />
        {vital.series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            fill={`url(#${gradientId}-${s.key})`}
            dot={{ r: 3, strokeWidth: 2, fill: "white" }}
            activeDot={{ r: 4.5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}

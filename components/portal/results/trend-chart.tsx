"use client"

import { CartesianGrid, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts"

import type { LabTest } from "@/lib/data/results"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

/** Past results as a small line, with the normal range shaded so "good" is obvious. */
export function TrendChart({ test }: { test: LabTest }) {
  const points = test.trend ?? []
  const values = points.map((p) => p.value)
  const bounds = [test.low, test.high].filter((n): n is number => n !== undefined)
  const lo = Math.min(...values, ...bounds)
  const hi = Math.max(...values, ...bounds)
  const pad = (hi - lo) * 0.25 || 5
  const domain: [number, number] = [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)]
  return (
    <ChartContainer config={{ value: { label: test.name, color: "var(--color-neutral-900)" } }} className="mt-2 aspect-auto h-28 w-full">
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <ReferenceArea y1={test.low ?? domain[0]} y2={test.high ?? domain[1]} fill="var(--color-emerald-500)" fillOpacity={0.08} ifOverflow="hidden" />
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} interval={0} padding={{ left: 18, right: 18 }} />
        <YAxis hide domain={domain} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: "white" }} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}

"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { overviewCopy as c } from "@/lib/data/admin-overview"
import { chartAxis, chartGrid } from "@/components/admin/ui"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

/** Booked vs completed for the last 14 days (loaded on demand by the overview). */
export default function OverviewTrend({ data }: { data: { label: string; booked: number; completed: number }[] }) {
  return (
    <ChartContainer config={{ booked: { label: c.trend.booked, color: "var(--color-neutral-200)" }, completed: { label: c.trend.completed, color: "var(--color-sky-500)" } }} className="aspect-auto h-56 w-full">
      <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...chartGrid} />
        <XAxis dataKey="label" {...chartAxis} interval={1} />
        <YAxis {...chartAxis} width={36} />
        <ChartTooltip cursor={{ fill: "var(--color-neutral-50)" }} content={<ChartTooltipContent className="rounded-xl" />} />
        <Bar dataKey="booked" fill="var(--color-booked)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

"use client"

import * as React from "react"
import { Area, AreaChart } from "recharts"

import { ChartContainer } from "@/components/ui/chart"

/** The tiny trend line in a stat card. Loaded on demand (see StatCard) so Recharts stays out of pages without charts. */
export default function Sparkline({ values, label, color }: { values: number[]; label: string; color: string }) {
  const id = React.useId().replace(/:/g, "")
  return (
    <ChartContainer config={{ v: { label, color } }} className="mt-3 aspect-auto h-10 w-full">
      <AreaChart data={values.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area dataKey="v" type="monotone" stroke="var(--color-v)" strokeWidth={1.75} fill={`url(#spark-${id})`} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  )
}

"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"
import { overviewCopy, portalUser, vitals, type Vital } from "@/lib/data/portal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { panel } from "@/components/portal/styles"

const c = overviewCopy.snapshot

/** Recharts loads on its own, after the page: the chart sits at the bottom of the overview. Same height while loading, so nothing shifts. */
const VitalChart = dynamic(() => import("@/components/portal/vital-chart").then((m) => m.VitalChart), {
  ssr: false,
  loading: () => <div className="mt-4 h-36" />,
})

/** Health snapshot: tabs for the four measures, then the chosen one's latest value and a chart of the last four visits. */
export function HealthSnapshot() {
  const [activeId, setActiveId] = React.useState<Vital["id"]>(vitals[0].id)
  const gradientId = React.useId().replace(/:/g, "")
  const active = vitals.find((v) => v.id === activeId) ?? vitals[0]

  return (
    <section aria-labelledby="health-snapshot" className={cn(panel, "flex flex-col p-5 md:p-6")}>
      <h2 id="health-snapshot" className="text-neutral-950 text-body">
        {c.heading(portalUser.firstName)}
      </h2>

      <Tabs value={activeId} onValueChange={(v) => setActiveId(v as Vital["id"])} className="mt-4 gap-0">
        <TabsList activateOnFocus aria-label={c.picker} className="grid h-9 w-full grid-cols-4 bg-neutral-100">
          {vitals.map((v) => (
            <TabsTrigger key={v.id} value={v.id} aria-label={v.label} className="h-full rounded-full px-1 text-caption">
              {v.short}
            </TabsTrigger>
          ))}
        </TabsList>

        {vitals.map((v) => (
          <TabsContent key={v.id} value={v.id} className="mt-5">
            <VitalSummary vital={v} gradientId={`${gradientId}-${v.id}`} />
          </TabsContent>
        ))}
      </Tabs>

      <p className="mt-auto pt-4 text-neutral-400 text-micro">
        {c.source} · {c.latest(active.date)}
      </p>
    </section>
  )
}

function VitalSummary({ vital, gradientId }: { vital: Vital; gradientId: string }) {
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-neutral-500 text-caption">{vital.label}</p>
          <p className="mt-0.5 text-neutral-950 tabular-nums text-title">
            {vital.value}
            {vital.unit && <span className="text-neutral-400 text-caption"> {vital.unit}</span>}
          </p>
        </div>
        <span
          className={cn(
            "mb-1 shrink-0 rounded-full px-2.5 py-0.5 text-micro",
            vital.trend === "good" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
          )}
        >
          {vital.change}
        </span>
      </div>

      <VitalChart vital={vital} gradientId={gradientId} label={c.chartLabel(vital.label)} />
    </>
  )
}

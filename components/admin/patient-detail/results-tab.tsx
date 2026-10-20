"use client"

import { TestTube01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chartCopy } from "@/lib/data/admin-patients"
import { allTests, statusOf, type LabTest } from "@/lib/data/results"
import { getDoctorBySlugSync, type AdminLabResult } from "@/lib/admin/queries"
import { EmptyState, panel } from "@/components/admin/ui"
import { RangeBar, statusTone } from "@/components/portal/results/range-bar"
import { anyDate, Section } from "@/components/admin/patient-detail/shared"

const c = chartCopy.results
const statusText = { normal: "Normal", high: "High", low: "Low", abnormal: "Abnormal" } as const
const valueText = (t: LabTest) => (typeof t.value === "number" ? `${t.value}${t.unit ? ` ${t.unit}` : ""}` : t.value)

function TestRow({ t }: { t: LabTest }) {
  const s = statusOf(t)
  const flagged = s !== "normal"
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_5.5rem]">
      <span className={cn("text-caption", flagged ? "text-neutral-950" : "text-neutral-700")}>{t.name}</span>
      <span className={cn("justify-self-end tabular-nums text-caption sm:justify-self-start", flagged ? "text-neutral-950" : "text-neutral-700")}>{valueText(t)}</span>
      <span className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
        <RangeBar test={t} label={`${t.name}: ${valueText(t)}. Normal range ${t.range}.`} />
        <span className="text-neutral-400 text-micro">{t.range}</span>
      </span>
      <span className="col-span-2 sm:col-span-1 sm:justify-self-end">
        <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-micro", statusTone[s].chip)}>
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", statusTone[s].dot)} />
          {statusText[s]}
        </span>
      </span>
    </li>
  )
}

export function ResultsTab({ results }: { results: AdminLabResult[] }) {
  if (!results.length)
    return (
      <div className={panel}>
        <EmptyState icon={TestTube01Icon} title={c.empty.title} text={c.empty.text} />
      </div>
    )
  const sorted = [...results].sort((a, b) => (a.iso < b.iso ? 1 : -1))
  return (
    <div className="flex flex-col gap-4">
      {sorted.map((r) => {
        const tests = allTests(r as Parameters<typeof allTests>[0])
        const inRange = tests.filter((t) => statusOf(t) === "normal").length
        const doctor = getDoctorBySlugSync(r.orderedBy)
        return (
          <Section
            key={r.id}
            title={r.title}
            flush
            description={
              <>
                {anyDate(r.date)} · {doctor ? `Ordered by ${doctor.name}` : null}
                {doctor ? " · " : null}
                {r.lab}
              </>
            }
            action={<span className={cn("shrink-0 rounded-full px-2.5 py-1 tabular-nums text-micro", inRange === tests.length ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>{c.inRange(inRange, tests.length)}</span>}
          >
            {r.sections.map((s) => (
              <div key={s.title} className="border-t border-neutral-100">
                <h3 className="px-5 pt-3 pb-1 text-neutral-500 text-micro">{s.title}</h3>
                <ul className="flex flex-col divide-y divide-neutral-100">
                  {s.tests.map((t) => (
                    <TestRow key={t.id} t={t} />
                  ))}
                </ul>
              </div>
            ))}
            {r.note?.text && (
              <div className="border-t border-neutral-100 px-5 py-4">
                <p className="text-neutral-500 text-micro">
                  {c.note} · {anyDate(r.note.date)}
                </p>
                <p className="mt-1 text-pretty text-neutral-800 text-caption">{r.note.text}</p>
              </div>
            )}
          </Section>
        )
      })}
    </div>
  )
}

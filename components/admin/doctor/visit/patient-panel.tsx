"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Line, LineChart, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { fmtDate, fmtDateLong, TODAY } from "@/lib/admin/format"
import { statusOf, type LabTest } from "@/lib/data/results"
import type { getVisit } from "@/lib/admin/doctor"
import type { NoteForm } from "@/components/admin/doctor/visit/schema"
import { AllergyChip } from "@/components/admin/doctor/badges"
import { RangeBar, statusTone } from "@/components/portal/results/range-bar"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export type VisitData = NonNullable<Awaited<ReturnType<typeof getVisit>>>

const c = visitCopy.panel
const statusText = { normal: "Normal", high: "High", low: "Low", abnormal: "Abnormal" } as const

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-neutral-100 px-5 py-4 first:border-t-0", className)}>
      <h3 className="mb-2.5 text-neutral-500 text-caption">{title}</h3>
      {children}
    </section>
  )
}

const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-neutral-400 text-caption">{children}</p>

const bpConfig = { sys: { label: "Systolic", color: "var(--color-sky-500)" }, dia: { label: "Diastolic", color: "var(--color-violet-500)" } } satisfies ChartConfig
const wtConfig = { wt: { label: "Weight (lb)", color: "var(--color-sky-500)" } } satisfies ChartConfig

function Spark({ title, value, config, data, keys, legend }: { title: string; value: string; config: ChartConfig; data: Record<string, string | number | null>[]; keys: string[]; legend?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-neutral-700 text-caption">{title}</span>
        <span className="text-neutral-950 tabular-nums text-caption">{value}</span>
      </div>
      <ChartContainer config={config} className="aspect-auto h-14 w-full" aria-label={`${title} trend: ${data.map((d) => `${d.label} ${keys.map((k) => d[k]).join("/")}`).join(", ")}`}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }} accessibilityLayer>
          <YAxis hide domain={["dataMin - 6", "dataMax + 6"]} />
          <ChartTooltip cursor={{ stroke: "var(--color-neutral-200)" }} content={<ChartTooltipContent labelKey="label" indicator="dot" />} />
          {keys.map((k) => (
            <Line key={k} dataKey={k} type="monotone" stroke={`var(--color-${k})`} strokeWidth={2} dot={{ r: 2.5, strokeWidth: 0, fill: `var(--color-${k})` }} activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }} isAnimationActive={false} connectNulls />
          ))}
        </LineChart>
      </ChartContainer>
      {legend && (
        <div className="flex gap-3 text-neutral-500 text-micro">
          {keys.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: (config[k] as { color: string }).color }} />
              {config[k].label}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between text-neutral-400 tabular-nums text-micro">
        <span>{data[0]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  )
}

export function PatientPanel({ data, vitals }: { data: VisitData; vitals: NoteForm["vitals"] }) {
  const { patient, medications, lastVisits, results, preVisit, plan, vitalsTrend } = data
  const active = medications.filter((m) => m.status === "active")
  const today = { label: "Today", sys: vitals.bpSystolic, dia: vitals.bpDiastolic, wt: vitals.weightLb }
  const trend = [...vitalsTrend.filter((v) => v.date !== TODAY).map((v) => ({ label: fmtDate(v.date).replace(/^\w+, /, ""), sys: v.bpSystolic, dia: v.bpDiastolic, wt: v.weightLb })), today].filter((d) => d.sys != null || d.wt != null)

  return (
    <div className="flex flex-col">
      <Block title={c.allergies}>
        {patient.allergies.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {patient.allergies.map((a) => (
              <li key={a}>
                <AllergyChip name={a} />
              </li>
            ))}
          </ul>
        ) : (
          <Muted>{c.noAllergies}</Muted>
        )}
      </Block>

      <Block title={c.conditions}>
        {patient.conditions.length ? (
          <ul className="flex flex-col gap-1 text-neutral-950 text-caption">
            {patient.conditions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <Muted>{c.noConditions}</Muted>
        )}
      </Block>

      <Block title={c.meds}>
        {active.length ? (
          <ul className="flex flex-col gap-2">
            {active.map((m) => (
              <li key={m.id}>
                <p className="text-neutral-950 text-caption">
                  {m.name} {m.dose}
                </p>
                <p className="text-neutral-500 text-micro">
                  {m.frequency} · Last filled {fmtDateLong(m.lastFilledAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Muted>{c.noMeds}</Muted>
        )}
      </Block>

      <Block title={c.visits}>
        {lastVisits.length ? (
          <ul className="flex flex-col gap-2.5">
            {lastVisits.map(({ appointment: a, note }) => (
              <li key={a.id}>
                <p className="flex items-baseline justify-between gap-2 text-caption">
                  <span className="truncate text-neutral-950">{a.reason}</span>
                  <span className="shrink-0 text-neutral-500 tabular-nums text-micro">{fmtDateLong(a.start)}</span>
                </p>
                {note?.assessment.diagnoses.length ? (
                  <p className="text-neutral-500 text-micro">{note.assessment.diagnoses.map((d) => `${d.code} · ${d.label}`).join("; ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Muted>{c.noVisits}</Muted>
        )}
      </Block>

      <Block title={c.results}>
        {results.length ? (
          <ul className="flex flex-col gap-4">
            {results.map((r) => {
              const tests = r.sections.flatMap((s) => s.tests as LabTest[]).filter((t) => typeof t.value === "number").slice(0, 3)
              return (
                <li key={r.id}>
                  <p className="flex items-baseline justify-between gap-2 text-caption">
                    <span className="truncate text-neutral-950">{r.title}</span>
                    <span className="shrink-0 text-neutral-500 tabular-nums text-micro">{/^\d{4}-/.test(r.iso) ? fmtDateLong(r.iso) : r.date}</span>
                  </p>
                  <ul className="mt-2 flex flex-col gap-2.5">
                    {tests.map((t) => {
                      const s = statusOf(t)
                      const val = `${t.value}${t.unit ? ` ${t.unit}` : ""}`
                      return (
                        <li key={t.id} className="flex flex-col gap-1">
                          <span className="flex items-center justify-between gap-2 text-micro">
                            <span className="truncate text-neutral-700">{t.name}</span>
                            <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                              <span className="text-neutral-950">{val}</span>
                              <span className={cn("inline-flex h-5 items-center rounded-full px-1.5", statusTone[s].chip)}>{statusText[s]}</span>
                            </span>
                          </span>
                          <RangeBar test={t} label={`${t.name}: ${val}. Normal range ${t.range}.`} />
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>
        ) : (
          <Muted>{c.noResults}</Muted>
        )}
      </Block>

      <Block title={c.trends}>
        {trend.length > 1 ? (
          <div className="flex flex-col gap-5">
            <Spark title={c.bpTrend} value={vitals.bpSystolic != null && vitals.bpDiastolic != null ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : "—"} config={bpConfig} data={trend} keys={["sys", "dia"]} legend />
            <Spark title={c.weightTrend} value={vitals.weightLb != null ? `${vitals.weightLb} lb` : "—"} config={wtConfig} data={trend} keys={["wt"]} />
          </div>
        ) : (
          <Muted>{c.noTrend}</Muted>
        )}
      </Block>

      <Block title={c.insurance}>
        {patient.insurance ? (
          <div className="text-caption">
            <p className="text-neutral-950">{plan?.name ?? patient.insurance.planId}</p>
            <p className="text-neutral-500 tabular-nums text-micro">
              {patient.insurance.planType} · Member ID {patient.insurance.memberId}
            </p>
          </div>
        ) : (
          <Muted>{c.selfPay}</Muted>
        )}
      </Block>

      <Block title={c.preVisit}>
        {preVisit.length ? (
          <dl className="flex flex-col gap-2.5">
            {preVisit.map((q) => (
              <div key={q.question}>
                <dt className="text-neutral-500 text-micro">{q.question}</dt>
                <dd className="text-pretty text-neutral-950 text-caption">{q.answer}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <Muted>{c.noPreVisit}</Muted>
        )}
      </Block>

      <div className="border-t border-neutral-100 px-5 py-4">
        <Link href={`/admin/patients/${patient.id}`} className="inline-flex items-center gap-1 rounded text-neutral-700 underline-offset-2 outline-none hover:text-neutral-950 hover:underline focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption">
          {c.openChart}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown02Icon,
  ArrowLeft01Icon,
  ArrowUp02Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  Message01Icon,
  CalendarAdd01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chip, focusRing } from "@/lib/styles"
import { personById } from "@/lib/data/portal"
import { visitDoctor } from "@/lib/data/visits"
import { allTests, resultsCopy, statusOf, type LabResult, type LabTest } from "@/lib/data/results"
import { markResultSeen } from "@/lib/seen-results"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { RangeBar, statusTone } from "@/components/portal/results/range-bar"
import { panel } from "@/components/portal/styles"

const c = resultsCopy.detail

/** Recharts only loads when someone opens a test with history; same height while it loads. */
const TrendChart = dynamic(() => import("@/components/portal/results/trend-chart").then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <div className="mt-2 h-28" />,
})
type Show = "all" | "attention" | "normal"

const valueText = (t: LabTest) => (typeof t.value === "number" ? `${t.value}${t.unit ? ` ${t.unit}` : ""}` : t.value)

export function ResultDetail({ result }: { result: LabResult }) {
  const person = personById(result.personId)
  const doctor = visitDoctor(result.orderedBy)
  const tests = allTests(result)
  const flagged = tests.filter((t) => statusOf(t) !== "normal").length
  const [show, setShow] = React.useState<Show>("all")

  React.useEffect(() => markResultSeen(result.id), [result.id])

  const visible = (t: LabTest) => show === "all" || (show === "attention") === (statusOf(t) !== "normal")
  const sections = result.sections.map((s) => ({ ...s, tests: s.tests.filter(visible) })).filter((s) => s.tests.length)
  const hasSide = !!(result.trends?.length || result.nextSteps?.length)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/portal/results" data-print-hide className={cn("inline-flex w-fit items-center gap-1.5 rounded-sm text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}>
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} className="size-4" />
        {c.back}
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <PersonAvatar person={person} className="size-12" />
          <div className="min-w-0">
            <h1 className="text-balance text-neutral-950 text-heading">{result.title}</h1>
            <p className="mt-2 text-neutral-600 text-body">
              {person.name} · {result.collected}
            </p>
            <p className="text-neutral-500 text-caption">{c.orderedBy(`${doctor.name}, ${doctor.credentials}`, result.lab)}</p>
          </div>
        </div>
        <div data-print-hide className="flex flex-wrap gap-2.5">
          <Button size="lg" variant="outline" className="rounded-full px-4 text-caption" onClick={() => window.print()}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {c.download}
          </Button>
          <Button nativeButton={false} render={<Link href={c.messageHref} />} size="lg" variant="outline" className="rounded-full px-4 text-caption">
            <HugeiconsIcon icon={Message01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {c.message(doctor.short)}
          </Button>
          {flagged > 0 && (
            <Button nativeButton={false} render={<Link href={c.recheckHref(doctor.slug)} />} size="lg" className="rounded-full px-5 text-caption">
              <HugeiconsIcon icon={CalendarAdd01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {c.recheck}
            </Button>
          )}
        </div>
      </header>

      <div className={cn("grid gap-6", hasSide && "lg:grid-cols-12")}>
        <div className={cn("flex min-w-0 flex-col gap-6", hasSide && "lg:col-span-8")}>
          {/* Summary + pinned doctor's note */}
          <section aria-label={c.summary(tests.length - flagged, tests.length)} className={cn(panel, "p-5 md:p-6")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-neutral-950 text-title">{c.summary(tests.length - flagged, tests.length)}</p>
              {flagged > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-800 text-caption">{resultsCopy.status.attention(flagged)}</span>}
            </div>
            <div aria-hidden="true" className="mt-3 flex gap-1">
              {tests.map((t) => (
                <span key={t.id} className={cn("h-2 flex-1 rounded-full", statusOf(t) === "normal" ? "bg-emerald-400" : statusTone[statusOf(t)].dot)} />
              ))}
            </div>
            <figure className="mt-5 flex gap-3 rounded-xl bg-neutral-50 p-4">
              {doctor.image && <Image src={doctor.image} alt="" width={80} height={96} className="size-10 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />}
              <div className="min-w-0">
                <figcaption className="text-neutral-500 text-caption">
                  {c.noteLabel} · {doctor.name}, {result.note.date}
                </figcaption>
                <blockquote className="mt-1 text-pretty text-neutral-800 text-body">“{result.note.text}”</blockquote>
              </div>
            </figure>
          </section>

          {/* Show: All · Needs attention · In range */}
          {tests.length > 1 && (
            <ToggleGroup
              aria-label={c.chipsLabel}
              value={[show]}
              onValueChange={(v: string[]) => {
                const next = v[v.length - 1]
                if (next) setShow(next as Show)
              }}
              data-print-hide
              className="flex flex-wrap justify-start gap-2"
            >
              {(
                [
                  ["all", c.chips.all, tests.length],
                  ["attention", c.chips.attention, flagged],
                  ["normal", c.chips.normal, tests.length - flagged],
                ] as const
              ).map(([id, label, n]) => (
                <ToggleGroupItem key={id} value={id} disabled={n === 0} className={cn(chip, "h-9 gap-1.5 px-4 text-caption")}>
                  {label}
                  <span className="opacity-60 tabular-nums">{n}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {sections.length > 0 && (
            <div className={cn(panel, "px-3 py-4 md:px-4")}>
              {/* Column hints once, desktop only */}
              <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.3fr)_5.5rem_1rem] gap-4 px-3 pb-1 text-neutral-400 text-caption sm:grid">
                <span>{c.columns.test}</span>
                <span>{c.columns.result}</span>
                <span>{c.normalRange}</span>
                <span>{c.columns.status}</span>
                <span />
              </div>
              {sections.map((s) => (
                <TestSection key={s.title} title={s.title} tests={s.tests} />
              ))}
            </div>
          )}
        </div>

        {hasSide && (
          <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
            {result.trends && <Trends trends={result.trends} />}
            {result.nextSteps && <NextSteps steps={result.nextSteps} />}
          </aside>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Test sections ------------------------------ */

function TestSection({ title, tests }: { title: string; tests: LabTest[] }) {
  const id = React.useId()
  return (
    <section aria-labelledby={id} className="pt-5 first-of-type:pt-3">
      <h2 id={id} className="px-3 pb-1 text-neutral-950 text-body">
        {title}
      </h2>
      <Accordion multiple className="flex flex-col overflow-visible rounded-none border-0">
        {tests.map((t) => (
          <TestRow key={t.id} test={t} />
        ))}
      </Accordion>
    </section>
  )
}

function TestRow({ test }: { test: LabTest }) {
  const status = statusOf(test)
  const flagged = status !== "normal"
  return (
    <AccordionItem value={test.id} className="rounded-xl border-0 not-last:border-b-0 data-open:bg-neutral-50/70">
      <AccordionTrigger className="items-center gap-4 rounded-xl px-3 py-3 hover:bg-neutral-50 hover:no-underline">
        <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-left sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.3fr)_5.5rem]">
          <span className={cn("text-body", flagged ? "text-neutral-950" : "text-neutral-800")}>{test.name}</span>
          <span className={cn("justify-self-end tabular-nums text-body sm:justify-self-start", flagged ? "text-neutral-950" : "text-neutral-700")}>{valueText(test)}</span>
          <span className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
            <RangeBar test={test} label={c.rangeBar(test.name, valueText(test), test.range)} />
            <span className="text-neutral-400 text-micro">{test.range}</span>
          </span>
          <span className="col-span-2 sm:col-span-1">
            <span className={cn("rounded-full px-2 py-0.5 text-micro", statusTone[status].chip)}>{c.statusLabel[status]}</span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className={cn("grid gap-4 rounded-lg bg-white p-4", test.trend && "sm:grid-cols-2")}>
          <div>
            <p className="text-neutral-500 text-caption">{c.whatItMeasures}</p>
            <p className="mt-1 text-pretty text-neutral-800 text-body">{test.about}</p>
            {test.trendNote && <p className="mt-3 text-emerald-800 text-caption">{test.trendNote}</p>}
          </div>
          {test.trend && (
            <div>
              <p className="text-neutral-500 text-caption">{c.yourTrend}</p>
              <TrendChart test={test} />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

/* ----------------------------- Side cards ---------------------------------- */

function Trends({ trends }: { trends: NonNullable<LabResult["trends"]> }) {
  return (
    <section aria-labelledby="trends" className={cn(panel, "p-5 md:p-6")}>
      <h2 id="trends" className="text-neutral-950 text-body">
        {c.trends.heading}
      </h2>
      <p className="text-neutral-500 text-caption">{c.trends.subtitle}</p>
      <ul className="mt-4 flex flex-col divide-y divide-neutral-100">
        {trends.map((t) => {
          const last = t.points[t.points.length - 1].value
          const first = t.points[0].value
          return (
            <li key={t.test} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-neutral-950 text-body">{t.test}</p>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro", t.better ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                  <HugeiconsIcon icon={last < first ? ArrowDown02Icon : ArrowUp02Icon} strokeWidth={2} className="size-3" />
                  {t.direction}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {t.points.map((p, i) => (
                  <div key={p.label} className={cn("rounded-lg px-2.5 py-2", i === t.points.length - 1 ? "bg-neutral-100" : "bg-neutral-50")}>
                    <dt className="text-neutral-500 text-micro">{p.label}</dt>
                    <dd className="text-neutral-950 tabular-nums text-body">
                      {p.value}
                      <span className="text-neutral-400 text-micro"> {t.unit}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function NextSteps({ steps }: { steps: NonNullable<LabResult["nextSteps"]> }) {
  return (
    <section aria-labelledby="next-steps" className={cn(panel, "p-5 md:p-6")}>
      <h2 id="next-steps" className="text-neutral-950 text-body">
        {c.nextSteps}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {steps.map((s) => (
          <li key={s.label} className="flex gap-3">
            {s.done ? (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <span aria-hidden="true" className="mt-0.5 size-5 shrink-0 rounded-full border-[1.5px] border-neutral-300" />
            )}
            <div className="min-w-0">
              <p className="text-neutral-950 text-body">
                <span className="sr-only">{s.done ? c.done : c.todo}</span>
                {s.label}
              </p>
              {s.detail && <p className="text-neutral-500 text-caption">{s.detail}</p>}
              {s.action && (
                <Button nativeButton={false} render={<Link href={s.action.href} />} variant="outline" size="sm" data-print-hide className="mt-2.5 rounded-full px-3.5 text-caption">
                  {s.action.label}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

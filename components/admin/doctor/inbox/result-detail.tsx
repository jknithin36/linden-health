"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Message01Icon, Note01Icon, Refresh01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Line, LineChart, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { inboxCopy } from "@/lib/data/admin-doctor"
import { fmtDate, fmtDateTime } from "@/lib/admin/format"
import { addPatientNote, getLabPanel, markResultsReviewed, medicationsFor, orderRecheck, testFlag, type InboxRow } from "@/lib/admin/doctor"
import type { LabTest } from "@/lib/admin/types"
import { notify } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChartContainer } from "@/components/ui/chart"

const c = inboxCopy.result
const btn = "h-10 rounded-full px-4 text-caption"

const flagLabel = { high: "High", low: "Low", normal: "Normal" } as const
const flagCls = { high: "bg-red-50 text-red-700", low: "bg-amber-50 text-amber-800", normal: "bg-emerald-50 text-emerald-800" } as const
const dotCls = { high: "bg-red-500", low: "bg-amber-500", normal: "bg-emerald-500" } as const

export const rangeText = (t: { unit: string; low?: number; high?: number }) =>
  t.low !== undefined && t.high !== undefined ? `${t.low}–${t.high} ${t.unit}` : t.high !== undefined ? `Up to ${t.high} ${t.unit}` : `${t.low} ${t.unit} or higher`

/** The normal band shaded on a track, with a dot where the value sits. */
export function RangeTrack({ test }: { test: LabTest }) {
  const { low, high, value } = test
  let min = 0
  let max = value * 2
  if (low !== undefined && high !== undefined) {
    const span = high - low
    min = Math.max(0, low - span * 0.6)
    max = high + span * 0.6
  } else if (high !== undefined) max = high * 1.6
  else if (low !== undefined) max = low * 2
  min = Math.min(min, value * 0.9)
  max = Math.max(max, value * 1.1)
  const pct = (n: number) => ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100
  const from = pct(low ?? min)
  const to = pct(high ?? max)
  const flag = testFlag(test)
  return (
    <div role="img" aria-label={`${test.name} ${value} ${test.unit}, ${flagLabel[flag].toLowerCase()}. Normal range ${rangeText(test)}`} className="relative h-1.5 rounded-full bg-neutral-100">
      <span className="absolute inset-y-0 rounded-full bg-emerald-100" style={{ left: `${from}%`, width: `${to - from}%` }} />
      <span className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", dotCls[flag])} style={{ left: `${pct(value)}%` }} />
    </div>
  )
}

function Spark({ test }: { test: LabTest }) {
  const data = [...test.history, { date: "now", value: test.value }]
  if (data.length < 2) return null
  const flag = testFlag(test)
  return (
    <ChartContainer config={{ value: { label: test.name, color: flag === "high" ? "var(--color-red-500)" : flag === "low" ? "var(--color-amber-500)" : "var(--color-sky-500)" } }} className="aspect-auto h-9 w-24" aria-hidden="true">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={1.75} dot={{ r: 2, fill: "var(--color-value)", strokeWidth: 0 }} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}

function TestRow({ test }: { test: LabTest }) {
  const flag = testFlag(test)
  const prev = test.history.at(-1)
  return (
    <li className="grid gap-3 border-b border-neutral-100 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-neutral-950 text-body">{test.name}</p>
          <p className="flex items-center gap-2">
            <span className="text-neutral-950 tabular-nums text-body">
              {test.value} <span className="text-neutral-500 text-caption">{test.unit}</span>
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-micro", flagCls[flag])}>{flagLabel[flag]}</span>
          </p>
        </div>
        <div className="mt-2.5">
          <RangeTrack test={test} />
        </div>
        <p className="mt-2 flex flex-wrap gap-x-4 text-neutral-500 tabular-nums text-micro">
          <span>
            {c.range}: {rangeText(test)}
          </span>
          <span>{prev ? `${c.previous}: ${prev.value} ${test.unit} (${fmtDate(prev.date)})` : c.noPrevious}</span>
        </p>
      </div>
      <Spark test={test} />
    </li>
  )
}

const noteSchema = z.object({ text: z.string().trim().min(10, c.noteMin).max(1000) })

function NoteForm({ onSend, onCancel }: { onSend: (text: string) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState } = useForm<z.infer<typeof noteSchema>>({ resolver: zodResolver(noteSchema), defaultValues: { text: "" } })
  const id = React.useId()
  const err = formState.errors.text?.message
  return (
    <form onSubmit={handleSubmit((v) => onSend(v.text))} className="flex flex-col gap-2 rounded-2xl border border-neutral-200/70 p-4">
      <label htmlFor={id} className="text-neutral-700 text-caption">
        {c.addNote}
      </label>
      <Textarea
        id={id}
        autoFocus
        {...register("text")}
        aria-invalid={!!err || undefined}
        aria-describedby={err ? `${id}-err` : undefined}
        placeholder={c.notePlaceholder}
        className="min-h-24 border-neutral-200 bg-white shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 aria-invalid:border-red-500 text-caption md:text-caption"
      />
      {err && (
        <p id={`${id}-err`} className="text-red-700 text-micro">
          {err}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className={btn} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className={btn}>
          {c.noteSend}
        </Button>
      </div>
    </form>
  )
}

export function ResultDetail({ item }: { item: InboxRow }) {
  const panel = getLabPanel(item.refId)
  const [noting, setNoting] = React.useState(false)
  if (!panel) return null
  const done = item.status === "done"
  const abnormal = panel.tests.filter((t) => testFlag(t) !== "normal")
  const worst = abnormal[0]
  const meds = medicationsFor(item.patientId).filter((m) => m.status === "active")
  return (
    <div className="flex flex-col gap-5">
      {item.priority === "high" && worst && !done && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-red-800">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-body">{c.banner(worst.name)}</p>
            <p className="text-caption">
              {worst.name} {worst.value} {worst.unit} (normal {rangeText(worst)}).{meds.length ? ` Currently taking ${meds.map((m) => `${m.name} ${m.dose}`).join(", ")}.` : ""}
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-neutral-950 text-body">{panel.title}</h3>
        <p className="text-neutral-500 tabular-nums text-caption">
          {c.collected} {fmtDateTime(panel.collectedAt)} · {c.resulted} {fmtDateTime(panel.resultedAt)}
        </p>
        <ul className="mt-1 flex flex-col">
          {panel.tests.map((t) => (
            <TestRow key={t.name} test={t} />
          ))}
        </ul>
      </div>

      {noting && !done ? (
        <NoteForm
          onCancel={() => setNoting(false)}
          onSend={(text) => {
            const undo = addPatientNote(item.id, item.patientId, text)
            setNoting(false)
            notify.undo("Note sent to the patient’s portal", undo)
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          className={btn}
          disabled={done}
          onClick={() => {
            const undo = markResultsReviewed([item.id])
            notify.undo("Result marked reviewed", undo)
          }}
        >
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />
          {c.markReviewed}
        </Button>
        <Button variant="outline" className={btn} disabled={done || noting} onClick={() => setNoting(true)}>
          <HugeiconsIcon icon={Note01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
          {c.addNote}
        </Button>
        <Button
          variant="outline"
          className={btn}
          disabled={done}
          onClick={() => {
            const test = worst?.name ?? panel.title
            const undo = orderRecheck(item.id, item.patientId, test)
            notify.undo(`${test} recheck ordered`, undo)
          }}
        >
          <HugeiconsIcon icon={Refresh01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
          {c.recheck}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/admin/messages?patient=${item.patientId}`} />} className={btn}>
          <HugeiconsIcon icon={Message01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
          {c.message}
        </Button>
      </div>
    </div>
  )
}

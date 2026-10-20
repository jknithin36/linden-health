"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chartCopy } from "@/lib/data/admin-patients"
import { fmtDate, fmtDateLong, fmtMoney, fmtTime, relative } from "@/lib/admin/format"
import { getClinicSync, getDoctorSync, type PatientDetail } from "@/lib/admin/queries"
import type { Appointment } from "@/lib/admin/types"
import { DoctorCell, StatusBadge } from "@/components/admin/ui"
import { visitTypeLabel } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { anyDate, Muted, Section } from "@/components/admin/patient-detail/shared"

const c = chartCopy.overview

function VisitRow({ a, onOpen }: { a: Appointment; onOpen: (id: string) => void }) {
  return (
    <li>
      <button type="button" onClick={() => onOpen(a.id)} className="flex w-full items-center gap-4 px-5 py-3 text-left outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)]">
        <span className="w-24 shrink-0 tabular-nums">
          <span className="block text-neutral-950 text-caption">{fmtDate(a.start)}</span>
          <span className="block text-neutral-400 text-micro">{relative(a.start)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-neutral-950 text-caption">{visitTypeLabel(a.visitType)}</span>
          <span className="block truncate text-neutral-500 text-micro">
            {a.reason} · {getDoctorSync(a.doctorId)?.name}
          </span>
        </span>
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="size-4 shrink-0 text-neutral-300" />
      </button>
    </li>
  )
}

export function OverviewTab({ detail, onOpen, onBook, onPay }: { detail: NonNullable<PatientDetail>; onOpen: (id: string) => void; onBook: () => void; onPay?: () => void }) {
  const { patient: p, next, recent, tasks, results } = detail
  const notes = results
    .filter((r) => r.note?.text)
    .slice(0, 3)
    .map((r) => ({ id: r.id, text: r.note.text, when: anyDate(r.note.date), about: r.title }))
  const lastPayment = [...detail.payments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
        <Section title={c.next}>
          {next ? (
            <button type="button" onClick={() => onOpen(next.id)} className="-m-2 flex w-[calc(100%+1rem)] flex-col gap-4 rounded-xl p-2 text-left outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)] sm:flex-row sm:items-center">
              <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-neutral-100 tabular-nums">
                <span className="text-neutral-500 text-micro">{fmtDate(next.start).split(",")[0]}</span>
                <span className="text-neutral-950 text-title">{next.start.slice(8, 10).replace(/^0/, "")}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-neutral-950 text-body">
                  {fmtDateLong(next.start)} · {fmtTime(next.start)}
                  {next.type === "video" && <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} role="img" aria-label="Video visit" className="size-4 text-sky-600" />}
                </span>
                <span className="mt-0.5 block text-neutral-500 text-caption">
                  {visitTypeLabel(next.visitType)} · {next.reason} · {next.type === "video" ? "Video" : getClinicSync(next.clinicId).short} · {relative(next.start)}
                </span>
              </span>
              <span className="flex shrink-0 flex-wrap items-center gap-3">
                <DoctorCell id={next.doctorId} sub={false} />
                <StatusBadge kind="appointment" status={next.status} />
                {!next.formsDone && <StatusBadge kind="flag" status="forms-pending" />}
              </span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Muted>{c.noNext}</Muted>
              <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={onBook}>
                {c.book}
              </Button>
            </div>
          )}
        </Section>

        <Section title={c.recent} flush>
          {recent.length ? (
            <ul className="flex flex-col divide-y divide-neutral-100 border-t border-neutral-100 pb-1">
              {recent.map((a) => (
                <VisitRow key={a.id} a={a} onOpen={onOpen} />
              ))}
            </ul>
          ) : (
            <Muted className="px-5 pb-5">{c.noRecent}</Muted>
          )}
        </Section>

        <Section title={c.careNotes}>
          {notes.length ? (
            <ul className="flex flex-col gap-4">
              {notes.map((n) => (
                <li key={n.id} className="border-l-2 border-neutral-200 pl-3">
                  <p className="text-pretty text-neutral-800 text-body">{n.text}</p>
                  <p className="mt-1 text-neutral-400 text-micro">
                    {n.about} · {n.when}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{c.noNotes}</Muted>
          )}
        </Section>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <Section title={c.balance}>
          <p className={cn("tabular-nums text-title", p.balance > 0 ? "text-neutral-950" : "text-emerald-700")}>{p.balance > 0 ? fmtMoney(p.balance) : c.paidUp}</p>
          {lastPayment && (
            <p className="mt-1 text-neutral-500 text-caption">
              Last payment {fmtMoney(lastPayment.amount)} on {fmtDate(lastPayment.createdAt)}
            </p>
          )}
          {p.balance > 0 && onPay && (
            <Button size="sm" variant="outline" className="mt-4 rounded-full px-4 text-caption" onClick={onPay}>
              {chartCopy.actions.pay}
            </Button>
          )}
        </Section>

        <Section title={c.tasks} description={tasks.length ? `${tasks.length} open` : undefined}>
          {tasks.length ? (
            <ul className="flex flex-col gap-2.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5 text-neutral-800 text-caption">
                  <span aria-hidden="true" className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", t.tone === "attention" ? "bg-amber-500" : "bg-sky-500")} />
                  <span>{t.label.replace(/for (\d{4}-\d{2}-\d{2})/, (_, d: string) => `for ${fmtDate(d)}`)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{c.noTasks}</Muted>
          )}
        </Section>

        <Section title={c.conditions}>
          {p.conditions.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {p.conditions.map((x) => (
                <li key={x} className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700 text-micro">
                  {x}
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{c.noConditions}</Muted>
          )}
        </Section>
      </div>
    </div>
  )
}

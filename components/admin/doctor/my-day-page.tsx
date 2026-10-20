"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Calendar03Icon, Clock01Icon, Door01Icon, Hospital01Icon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { myDayCopy as c } from "@/lib/data/admin-doctor"
import { ageLabel, fmtDate, fmtDateFull, fmtTime, minutesBetween, minutesOfDay, NOW, relative, TODAY } from "@/lib/admin/format"
import { getClinicSync, getPatientSync } from "@/lib/admin/queries"
import { getMyDay, getNoteSync, lastCompletedVisit, medicationsFor, startVisit, type InboxRow, type NoteState } from "@/lib/admin/doctor"
import { preVisitAnswers, vitalFlags } from "@/lib/admin/clinical"
import type { Appointment } from "@/lib/admin/types"
import { useQuery } from "@/components/admin/hooks"
import { visitTypeLabel } from "@/components/admin/forms"
import { Avatar, CardSkeleton, EmptyState, ErrorState, notify, panel, PatientCell, patientPhoto, StatCard } from "@/components/admin/ui"
import { AllergyChip, DoctorStatusBadge, inboxTypeIcon, NoteStatusBadge, PriorityLabel } from "@/components/admin/doctor/badges"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type MyDay = Awaited<ReturnType<typeof getMyDay>>

const visitLine = (a: Appointment) => {
  const v = visitTypeLabel(a.visitType)
  return a.reason.toLowerCase().startsWith(v.toLowerCase()) ? a.reason : `${v} · ${a.reason}`
}

const btn = "h-10 rounded-full px-4 text-caption"
const btnSm = "h-8 rounded-full px-3 text-caption"

/* -------------------------------- Sections --------------------------------- */

function Section({ title, action, children, className, count }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string; count?: number }) {
  const id = React.useId()
  return (
    <section aria-labelledby={id} className={cn(panel, "flex min-w-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 id={id} className="flex items-center gap-2 text-neutral-950 text-body">
          {title}
          {count !== undefined && <span className="rounded-full bg-neutral-100 px-2 text-neutral-600 tabular-nums text-micro">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function useStart() {
  const router = useRouter()
  return React.useCallback(
    (id: string) => {
      startVisit(id)
      router.push(`/admin/visit/${id}`)
    },
    [router]
  )
}

/* ---------------------------------- Now ------------------------------------ */

function NowCard({ a }: { a: Appointment | null }) {
  if (!a)
    return (
      <Section title={c.now.title}>
        <p className="px-5 pb-6 text-neutral-500 text-caption">{c.now.empty}</p>
      </Section>
    )
  const p = getPatientSync(a.patientId)!
  const started = a.roomedAt ?? a.start
  const elapsed = Math.max(0, minutesBetween(started, NOW))
  return (
    <section aria-labelledby="now-title" className={cn(panel, "flex flex-col gap-5 p-5 md:p-6")}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="now-title" className="flex items-center gap-2 text-neutral-950 text-body">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-sky-400 opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
          </span>
          {c.now.title}
        </h2>
        <DoctorStatusBadge status={a.status} />
      </div>
      <div className="flex items-start gap-4">
        <Avatar name={p.name} id={p.id} src={patientPhoto(p)} eager className="size-14 text-body" />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/patients/${p.id}`} className={cn("rounded text-neutral-950 hover:underline text-title", focusRing.dark)}>
            {p.name}
          </Link>
          <p className="mt-0.5 text-neutral-500 tabular-nums text-caption">
            {ageLabel(p.dob, p.sex)} · {p.mrn}
          </p>
          <p className="mt-2 text-neutral-950 text-body">{a.reason}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-neutral-400 text-micro">{a.type === "video" ? c.now.video : c.now.room}</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-neutral-950 text-caption">
            <HugeiconsIcon icon={a.type === "video" ? Video01Icon : Door01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5 text-neutral-500" />
            {a.type === "video" ? "Video" : `Room ${a.room ?? "—"}`}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400 text-micro">Visit</dt>
          <dd className="mt-0.5 text-neutral-950 text-caption">{visitTypeLabel(a.visitType)}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-neutral-400 text-micro">In visit</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-neutral-950 tabular-nums text-caption">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5 text-neutral-500" />
            {c.now.started} {fmtTime(started)} · {elapsed} min
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<Link href={`/admin/visit/${a.id}`} />} className={btn}>
          {c.now.open}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </section>
  )
}

/* -------------------------------- Up next ---------------------------------- */

function NextCard({ a, onStart }: { a: Appointment | null; onStart: (id: string) => void }) {
  if (!a)
    return (
      <Section title={c.next.title}>
        <p className="px-5 pb-6 text-neutral-500 text-caption">{c.next.empty}</p>
      </Section>
    )
  const p = getPatientSync(a.patientId)!
  const arrived = a.checkedInAt ?? a.arrivedAt
  return (
    <section aria-labelledby="next-title" className={cn(panel, "flex flex-col gap-4 p-5 md:p-6")}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="next-title" className="text-neutral-950 text-body">
          {c.next.title}
        </h2>
        <span className="text-neutral-500 tabular-nums text-caption">{fmtTime(a.start)}</span>
      </div>
      <div className="flex items-start gap-3">
        <Avatar name={p.name} id={p.id} src={patientPhoto(p)} className="size-11" />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/patients/${p.id}`} className={cn("rounded text-neutral-950 hover:underline text-body", focusRing.dark)}>
            {p.name}, {ageLabel(p.dob, p.sex).split(" · ")[0]}
          </Link>
          <p className="mt-0.5 text-neutral-500 text-caption">{arrived ? `${c.next.checkedIn} ${relative(arrived)}` : `${c.next.scheduled} ${fmtTime(a.start)}`}</p>
        </div>
        <DoctorStatusBadge status={a.status} />
      </div>
      <div>
        <p className="text-neutral-950 text-caption">{visitTypeLabel(a.visitType)}</p>
        <p className="text-neutral-500 text-caption">{a.reason}</p>
      </div>
      <div>
        <p className="text-neutral-400 text-micro">{c.next.allergies}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">{p.allergies.length ? p.allergies.map((x) => <AllergyChip key={x} name={x} />) : <span className="text-neutral-600 text-caption">{c.next.noAllergies}</span>}</div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button className={btn} onClick={() => onStart(a.id)}>
          {c.next.start}
        </Button>
      </div>
    </section>
  )
}

/* -------------------------------- Timeline --------------------------------- */

type Row = { kind: "appt"; a: Appointment; note: NoteState } | { kind: "open"; start: string } | { kind: "now" }

function RowAction({ a, note, onStart }: { a: Appointment; note: NoteState; onStart: (id: string) => void }) {
  const router = useRouter()
  const name = getPatientSync(a.patientId)?.name
  const label = (verb: string) => `${verb} for ${name}`
  const href = `/admin/visit/${a.id}`
  if (a.status === "completed" && note !== "signed")
    return (
      <Button nativeButton={false} render={<Link href={href} aria-label={label(c.actions.sign)} />} className={btnSm}>
        {c.actions.sign}
      </Button>
    )
  if (a.status === "with-doctor")
    return (
      <Button nativeButton={false} render={<Link href={href} aria-label={label(c.actions.open)} />} className={btnSm}>
        {c.actions.open}
      </Button>
    )
  if (a.type === "video" && a.status !== "completed" && a.status !== "no-show")
    return (
      <Button
        variant="outline"
        aria-label={label(c.actions.join)}
        className={btnSm}
        onClick={() => {
          notify.info(c.actions.videoToast)
          onStart(a.id)
          router.push(href)
        }}
      >
        <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
        {c.actions.join}
      </Button>
    )
  if (a.status === "checked-in" || a.status === "waiting" || a.status === "arrived")
    return (
      <Button aria-label={label(c.actions.start)} className={btnSm} onClick={() => onStart(a.id)}>
        {c.actions.start}
      </Button>
    )
  if (a.status === "no-show") return null
  return (
    <Button variant="outline" nativeButton={false} render={<Link href={href} aria-label={label(c.actions.open)} />} className={btnSm}>
      {c.actions.open}
    </Button>
  )
}

function Timeline({ data, onStart }: { data: MyDay; onStart: (id: string) => void }) {
  const rows = React.useMemo(() => {
    const list: Row[] = [...data.rows.map((r): Row => ({ kind: "appt", a: r.appointment, note: r.note })), ...data.open.map((s): Row => ({ kind: "open", start: s }))]
    const startOf = (r: Row) => (r.kind === "appt" ? r.a.start : r.kind === "open" ? r.start : NOW)
    list.sort((x, y) => (startOf(x) < startOf(y) ? -1 : 1))
    const idx = list.findIndex((r) => startOf(r) > NOW)
    list.splice(idx === -1 ? list.length : idx, 0, { kind: "now" })
    return list
  }, [data])

  return (
    <Section title={c.timeline.title} count={data.rows.length}>
      <ol className="flex flex-col border-t border-neutral-100">
        {rows.map((r) => {
          if (r.kind === "now")
            return (
              <li key="now" aria-label={`${c.timeline.now}, ${fmtTime(NOW)}`} className="flex items-center gap-3 px-5 py-1.5">
                <span className="w-16 shrink-0 text-sky-700 tabular-nums text-micro">{fmtTime(NOW)}</span>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-sky-500" />
                <span aria-hidden="true" className="h-px flex-1 bg-sky-200" />
                <span className="text-sky-700 text-micro">{c.timeline.now}</span>
              </li>
            )
          if (r.kind === "open")
            return (
              <li key={r.start} className="flex items-center gap-3 border-b border-neutral-100 px-5 py-3 last:border-b-0">
                <span className="w-16 shrink-0 text-neutral-400 tabular-nums text-caption">{fmtTime(r.start)}</span>
                <span className="flex-1 rounded-lg border border-dashed border-neutral-200 px-3 py-1.5 text-neutral-400 text-caption">{c.timeline.openSlot}</span>
              </li>
            )
          const { a, note } = r
          const done = a.status === "completed"
          const current = a.status === "with-doctor"
          return (
            <li key={a.id} className={cn("flex flex-col gap-3 border-b border-neutral-100 px-5 py-3 last:border-b-0 lg:flex-row lg:items-center", current && "bg-sky-50/40")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={cn("w-16 shrink-0 pt-1.5 tabular-nums text-caption", done ? "text-neutral-400" : "text-neutral-950")}>{fmtTime(a.start)}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                    <PatientCell patient={a.patientId} className="min-w-0 max-w-56" />
                    <DoctorStatusBadge status={a.status} />
                  </div>
                  <p className="flex min-w-0 items-center gap-1.5 pl-10.5 text-neutral-500 text-caption">
                    <HugeiconsIcon icon={a.type === "video" ? Video01Icon : Hospital01Icon} strokeWidth={1.8} aria-hidden="true" className={cn("size-3.5 shrink-0", a.type === "video" ? "text-sky-600" : "text-neutral-400")} />
                    <span className="sr-only">{a.type === "video" ? c.timeline.video : c.timeline.inPerson}: </span>
                    <span className="truncate">
                      {visitLine(a)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pl-19 lg:justify-end lg:pl-0">
                <span className="flex items-center gap-1.5">
                  <span className="sr-only">Note: </span>
                  <NoteStatusBadge state={note} />
                </span>
                <span className="flex w-28 justify-end">
                  <RowAction a={a} note={note} onStart={onStart} />
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}

/* ------------------------------- Right column ------------------------------ */

function InboxPreview({ items, total }: { items: InboxRow[]; total: number }) {
  return (
    <Section
      title={c.inbox.title}
      count={total}
      action={
        <Link href="/admin/inbox" className={cn("inline-flex items-center gap-1 rounded-full text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}>
          {c.inbox.open}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-neutral-500 text-caption">{c.inbox.empty}</p>
      ) : (
        <ul className="flex flex-col border-t border-neutral-100">
          {items.map((i) => {
            const p = getPatientSync(i.patientId)
            return (
              <li key={i.id} className="border-b border-neutral-100 last:border-b-0">
                <Link href={`/admin/inbox?item=${i.id}`} className={cn("flex items-start gap-3 px-5 py-3 hover:bg-neutral-50", focusRing.dark)}>
                  <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", i.priority === "high" ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600")}>
                    <HugeiconsIcon icon={inboxTypeIcon[i.type]} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-neutral-950 text-caption">{p?.name}</span>
                      <span className="shrink-0 text-neutral-400 tabular-nums text-micro">{relative(i.createdAt)}</span>
                    </span>
                    <span className="block truncate text-neutral-500 text-caption">{i.summary}</span>
                    <PriorityLabel priority={i.priority} className="mt-0.5" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

function SnapshotBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-neutral-100 px-5 py-3.5 last:border-b-0">
      <h3 className="text-neutral-400 text-micro">{label}</h3>
      {children}
    </div>
  )
}

function Snapshot({ a }: { a: Appointment | null }) {
  if (!a) return null
  const s = c.snapshot
  const p = getPatientSync(a.patientId)!
  const last = lastCompletedVisit(p.id)
  const meds = medicationsFor(p.id).filter((m) => m.status === "active")
  const v = getNoteSync(a.id)?.vitals
  const flags = v ? vitalFlags(v, p.age) : {}
  const answers = preVisitAnswers(a)
  const vitals = v
    ? ([
        ["BP", v.bpSystolic != null && v.bpDiastolic != null ? `${v.bpSystolic}/${v.bpDiastolic} mmHg` : null, flags.bpSystolic],
        ["Heart rate", v.heartRate != null ? `${v.heartRate} bpm` : null, flags.heartRate],
        ["Temp", v.tempF != null ? `${v.tempF} °F` : null, flags.tempF],
        ["Resp rate", v.respRate != null ? `${v.respRate} /min` : null, flags.respRate],
        ["SpO₂", v.spo2 != null ? `${v.spo2}%` : null, flags.spo2],
        ["Weight", v.weightLb != null ? `${v.weightLb} lb` : null, undefined],
      ] as const).filter((x) => x[1])
    : []
  return (
    <Section title={s.title} action={<span className="truncate text-neutral-500 text-caption">{p.name}</span>}>
      <div className="flex flex-col border-t border-neutral-100">
        <SnapshotBlock label={s.lastVisit}>
          {last ? (
            <p className="text-neutral-950 text-caption">
              {fmtDate(last.start)} · {last.reason} <span className="text-neutral-400">({relative(last.start)})</span>
            </p>
          ) : (
            <p className="text-neutral-500 text-caption">{s.noLastVisit}</p>
          )}
        </SnapshotBlock>
        <SnapshotBlock label={s.allergies}>
          <div className="flex flex-wrap gap-1.5">{p.allergies.length ? p.allergies.map((x) => <AllergyChip key={x} name={x} />) : <span className="text-neutral-600 text-caption">{c.next.noAllergies}</span>}</div>
        </SnapshotBlock>
        <SnapshotBlock label={s.conditions}>
          {p.conditions.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {p.conditions.map((x) => (
                <li key={x} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-700 text-micro">
                  {x}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-caption">{s.noConditions}</p>
          )}
        </SnapshotBlock>
        <SnapshotBlock label={s.medications}>
          {meds.length ? (
            <ul className="flex flex-col gap-1">
              {meds.map((m) => (
                <li key={m.id} className="text-neutral-950 text-caption">
                  {m.name} {m.dose} <span className="text-neutral-500">· {m.frequency}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-caption">{s.noMedications}</p>
          )}
        </SnapshotBlock>
        <SnapshotBlock label={s.vitals}>
          {vitals.length ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {vitals.map(([label, value, flag]) => (
                <div key={label}>
                  <dt className="text-neutral-500 text-micro">{label}</dt>
                  <dd className="flex flex-wrap items-center gap-1.5 text-neutral-950 tabular-nums text-caption">
                    {value}
                    {flag && <span className={cn("rounded-full px-1.5 text-micro", flag.tone === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>{flag.label}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-neutral-500 text-caption">{s.noVitals}</p>
          )}
        </SnapshotBlock>
        <SnapshotBlock label={s.form}>
          {answers.length ? (
            <dl className="flex flex-col gap-2">
              {answers.map((q) => (
                <div key={q.question}>
                  <dt className="text-neutral-500 text-micro">{q.question}</dt>
                  <dd className="text-pretty text-neutral-950 text-caption">{q.answer}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-neutral-500 text-caption">{s.noForm}</p>
          )}
        </SnapshotBlock>
      </div>
    </Section>
  )
}

/* -------------------------------- Skeleton --------------------------------- */

function MyDaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <CardSkeleton key={i} className={i === 4 ? "hidden lg:flex" : undefined} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CardSkeleton className="h-64" />
            <CardSkeleton className="h-64" />
          </div>
          <div className={cn(panel, "flex flex-col gap-4 p-5")}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3 w-14 rounded-full" />
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3.5 flex-1 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <CardSkeleton className="h-72" />
          <CardSkeleton className="h-96" />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- Page ----------------------------------- */

export function MyDayPage() {
  const { data, initial, error, retry } = useQuery(() => getMyDay(), [])
  const onStart = useStart()
  const hour = Math.floor(minutesOfDay(NOW) / 60)
  const clinicId = data?.current?.clinicId ?? data?.doctor.clinicIds[0]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {data ? <h1 className="text-neutral-950 text-page">{c.greeting(hour, data.doctor.lastName)}</h1> : <Skeleton className="h-8 w-72 rounded-lg" />}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-neutral-500 text-body">
            <span>{fmtDateFull(TODAY)}</span>
            {clinicId && (
              <>
                <span aria-hidden="true">·</span>
                <span>{getClinicSync(clinicId).name}</span>
              </>
            )}
          </p>
        </div>
        {data && data.late > 0 && (
          <span role="status" className="inline-flex h-8 w-fit shrink-0 items-center gap-1.5 rounded-full bg-amber-50 whitespace-nowrap px-3 text-amber-800 text-caption">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
            {c.late(data.late)}
          </span>
        )}
      </header>

      {error ? (
        <div className={panel}>
          <ErrorState onRetry={retry} />
        </div>
      ) : initial || !data ? (
        <MyDaySkeleton />
      ) : data.rows.length === 0 ? (
        <div className={panel}>
          <EmptyState
            icon={Calendar03Icon}
            title={c.empty.title}
            text={c.empty.text}
            action={
              <Button variant="outline" nativeButton={false} render={<Link href="/admin/inbox" />} className={btn}>
                {c.inbox.open}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label={c.stats.patients} value={data.stats.patients} />
            <StatCard label={c.stats.seen} value={data.stats.seen} />
            <StatCard label={c.stats.remaining} value={data.stats.remaining} />
            <StatCard label={c.stats.notes} value={data.stats.notesToSign} tone={data.stats.notesToSign ? "amber" : undefined} href="/admin/inbox?tab=note-to-sign" />
            <StatCard label={c.stats.inbox} value={data.stats.inbox} hint={c.stats.inboxHint} href="/admin/inbox" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <NowCard a={data.current} />
                <NextCard a={data.next} onStart={onStart} />
              </div>
              <Timeline data={data} onStart={onStart} />
            </div>
            <div className="flex min-w-0 flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start xl:flex xl:items-stretch">
              <InboxPreview items={data.inboxPreview} total={data.stats.inbox} />
              <Snapshot a={data.next} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

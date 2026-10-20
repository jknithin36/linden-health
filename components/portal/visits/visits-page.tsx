"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CalendarAdd01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Location01Icon,
  Navigation03Icon,
  InjectionIcon,
  StethoscopeIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { family, personById, type PersonId } from "@/lib/data/portal"
import {
  cancelledVisits as initialCancelled,
  pastVisits,
  suggestions,
  upcomingVisits as initialUpcoming,
  visitDoctor,
  visitsCopy as copy,
  type CancelledVisit,
  type PastVisit,
  type RescheduleDay,
  type UpcomingVisit,
  type VisitType,
} from "@/lib/data/visits"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { PersonFilter, SegmentedFilter, type PersonFilterValue } from "@/components/portal/person-filter"
import { CancelVisitDialog, RescheduleSheet, VisitDetailSheet } from "@/components/portal/visits/visit-dialogs"
import { download } from "@/components/portal/download"
import { EmptyState as Empty, HalfDot } from "@/components/portal/status-parts"
import { panel } from "@/components/portal/styles"

type TypeFilter = "all" | VisitType

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

type Status = "action" | "ready" | "confirmed"

/** Forms done → ready; forms open but not done → action needed; forms not open yet → confirmed. */
function statusOf(visit: UpcomingVisit): Status {
  const forms = visit.checklist.find((c) => c.id === "forms")
  if (!forms || forms.done) return "ready"
  return forms.note ? "confirmed" : "action"
}

const statusStyle: Record<Status, string> = {
  action: "bg-amber-50 text-amber-800",
  ready: "bg-emerald-50 text-emerald-800",
  confirmed: "bg-neutral-100 text-neutral-700",
}

/** Download a one-event .ics file, so "Add to calendar" works with any calendar app. */
function addToCalendar(visit: UpcomingVisit) {
  const doc = visitDoctor(visit.doctorSlug)
  const start = new Date(visit.calendar.start)
  const end = new Date(start.getTime() + visit.calendar.minutes * 60_000)
  const stamp = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Linden Health//Patient portal//EN",
    "BEGIN:VEVENT",
    `UID:${visit.id}@lindenhealth.example`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${visit.title} with ${doc.name}`,
    `LOCATION:${visit.type === "video" ? copy.typeLabel.video : `${doc.clinic.name}, ${doc.clinic.address}`}`,
    `DESCRIPTION:${visit.reason}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  download(`${visit.id}.ics`, ics, "text/calendar")
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

/** Reads ?person= (from the Family page's "View care") to preselect the family filter. */
export function VisitsPageWithParams() {
  const params = useSearchParams()
  const p = params.get("person")
  return <VisitsPage initialPerson={family.some((m) => m.id === p) ? (p as PersonId) : "all"} />
}

export function VisitsPage({ initialPerson = "all" }: { initialPerson?: PersonFilterValue }) {
  const [person, setPerson] = React.useState<PersonFilterValue>(initialPerson)
  const [type, setType] = React.useState<TypeFilter>("all")
  const [upcoming, setUpcoming] = React.useState(initialUpcoming)
  const [cancelled, setCancelled] = React.useState(initialCancelled)
  const [fluAdded, setFluAdded] = React.useState<string[]>([])
  const [notesFor, setNotesFor] = React.useState<PastVisit | null>(null)
  const [rescheduling, setRescheduling] = React.useState<UpcomingVisit | null>(null)
  const [cancelling, setCancelling] = React.useState<UpcomingVisit | null>(null)

  const matches = (v: { personId: PersonId; type: VisitType }) => (person === "all" || v.personId === person) && (type === "all" || v.type === type)
  const shown = {
    upcoming: upcoming.filter(matches),
    past: pastVisits.filter(matches),
    cancelled: cancelled.filter(matches),
  }

  const completeForms = (id: string) =>
    setUpcoming((list) => list.map((v) => (v.id === id ? { ...v, checklist: v.checklist.map((c) => (c.id === "forms" ? { ...c, label: copy.actions.formsDone, done: true } : c)) } : v)))

  const reschedule = (id: string, when: RescheduleDay & { time: string; start: string }) =>
    setUpcoming((list) =>
      list.map((v) =>
        v.id === id ? { ...v, date: when.date, shortDate: when.shortDate, listDate: when.listDate, time: when.time, calendar: { ...v.calendar, start: when.start } } : v
      )
    )

  const cancel = (id: string) => {
    const visit = upcoming.find((v) => v.id === id)
    if (!visit) return
    setUpcoming((list) => list.filter((v) => v.id !== id))
    setCancelled((list) => [
      { id: `c-${visit.id}`, date: visit.listDate, personId: visit.personId, title: visit.kind, doctorSlug: visit.doctorSlug, type: visit.type, by: copy.cancel.by },
      ...list,
    ])
    setCancelling(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />
      <Filters person={person} onPerson={setPerson} type={type} onType={setType} />

      <Tabs defaultValue="upcoming" className="gap-5">
        <TabsList className="h-10 w-full justify-start bg-neutral-100 sm:w-fit">
          {(["upcoming", "past", "cancelled"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="h-full flex-1 gap-1.5 rounded-full px-4 text-caption sm:flex-none">
              {copy.tabs[t]}
              <span className="text-neutral-400 tabular-nums">{shown[t].length}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="upcoming" className="flex flex-col gap-4">
          {shown.upcoming.length ? (
            shown.upcoming.map((v) => (
              <VisitCard
                key={v.id}
                visit={v}
                fluShot={fluAdded.includes(v.id)}
                onCompleteForms={() => completeForms(v.id)}
                onReschedule={() => setRescheduling(v)}
                onCancel={() => setCancelling(v)}
              />
            ))
          ) : (
            <Empty>
              <p>{copy.empty.upcoming.text}</p>
              <Button nativeButton={false} render={<Link href={copy.book.href} />} size="lg" className="mt-4 rounded-full px-5 text-caption">
                {copy.empty.upcoming.action}
              </Button>
            </Empty>
          )}
          <Suggested person={person} fluAdded={fluAdded} onAddFlu={(id) => setFluAdded((l) => [...l, id])} upcoming={upcoming} />
        </TabsContent>

        <TabsContent value="past">
          {shown.past.length ? <PastList visits={shown.past} onNotes={setNotesFor} /> : <Empty>{copy.empty.past}</Empty>}
        </TabsContent>

        <TabsContent value="cancelled">
          {shown.cancelled.length ? <CancelledList visits={shown.cancelled} /> : <Empty>{copy.empty.cancelled}</Empty>}
        </TabsContent>
      </Tabs>

      <VisitDetailSheet visit={notesFor} onOpenChange={(open) => !open && setNotesFor(null)} />
      <RescheduleSheet visit={rescheduling} onOpenChange={(open) => !open && setRescheduling(null)} onConfirm={reschedule} />
      <CancelVisitDialog visit={cancelling} onOpenChange={(open) => !open && setCancelling(null)} onConfirm={cancel} />
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
        <p className="mt-2 text-pretty text-neutral-500 text-body">{copy.intro}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button nativeButton={false} render={<Link href={copy.book.href} />} size="lg" className="rounded-full px-5 text-caption">
          {copy.book.label}
        </Button>
        <Button nativeButton={false} render={<Link href={copy.video.href} />} size="lg" variant="outline" className="rounded-full px-5 text-caption">
          <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} data-icon="inline-start" />
          {copy.video.label}
        </Button>
      </div>
    </header>
  )
}

function Filters({ person, onPerson, type, onType }: { person: PersonFilterValue; onPerson: (p: PersonFilterValue) => void; type: TypeFilter; onType: (t: TypeFilter) => void }) {
  const f = copy.filters
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <PersonFilter value={person} onValueChange={onPerson} label={f.person} allLabel={f.allFamily} />
      <SegmentedFilter value={type} onValueChange={onType} options={f.types} label={f.type} />
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Upcoming
 * ------------------------------------------------------------------------- */

function VisitCard({
  visit,
  fluShot,
  onCompleteForms,
  onReschedule,
  onCancel,
}: {
  visit: UpcomingVisit
  fluShot: boolean
  onCompleteForms: () => void
  onReschedule: () => void
  onCancel: () => void
}) {
  const doc = visitDoctor(visit.doctorSlug)
  const person = personById(visit.personId)
  const status = statusOf(visit)
  const titleId = `${visit.id}-title`
  const a = copy.actions

  return (
    <article aria-labelledby={titleId} className={cn(panel, "p-5 md:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar person={person} className="size-10" />
          <div className="min-w-0">
            <h2 id={titleId} className="text-neutral-950 text-title">
              {visit.title}
            </h2>
            <p className="text-neutral-600 text-caption">
              {visit.date} · {visit.time} · {visit.duration} · {copy.typeLabel[visit.type]}
            </p>
          </div>
        </div>
        <Badge className={cn("h-6 gap-1.5 px-2.5", statusStyle[status])}>
          {status === "action" ? <HalfDot className="size-2.5" /> : <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} data-icon="inline-start" />}
          {copy.status[status]}
        </Badge>
      </div>

      <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2">
        <Link href={doc.href} className={cn("flex items-center gap-3 rounded-lg", focusRing.dark)}>
          {doc.image && <Image src={doc.image} alt="" width={80} height={96} className="size-10 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />}
          <span className="min-w-0">
            <span className="block text-neutral-950 text-body">{`${doc.name}, ${doc.credentials}`}</span>
            <span className="block text-neutral-500 text-caption">{doc.specialty}</span>
          </span>
        </Link>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600">
            <HugeiconsIcon icon={visit.type === "video" ? Video01Icon : Location01Icon} strokeWidth={1.7} className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-neutral-950 text-body">{visit.type === "video" ? copy.typeLabel.video : doc.clinic.name}</span>
            <span className="block text-neutral-500 text-caption">{doc.clinic.address}</span>
          </span>
        </div>
      </div>

      <dl className="mt-5 flex flex-wrap items-center gap-2.5">
        <dt className="text-neutral-500 text-caption">{copy.reasonLabel}</dt>
        <dd className="flex flex-wrap gap-2">
          <Badge className="h-6 gap-1.5 bg-neutral-100 px-2.5 text-neutral-800">
            <HugeiconsIcon icon={StethoscopeIcon} strokeWidth={1.8} data-icon="inline-start" />
            {visit.reason}
          </Badge>
          {fluShot && (
            <Badge className="h-6 gap-1.5 bg-emerald-50 px-2.5 text-emerald-800">
              <HugeiconsIcon icon={InjectionIcon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.fluAdded}
            </Badge>
          )}
        </dd>
      </dl>

      {visit.prep && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-pretty text-amber-900 text-caption">
          <span className="text-amber-700">{copy.prepLabel} · </span>
          {visit.prep}
        </p>
      )}

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {visit.checklist.map((c) => (
          <li key={c.id} className={cn("flex items-center gap-2 text-caption", c.done ? "text-neutral-700" : "text-neutral-500")}>
            {c.done ? (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4 text-emerald-600" />
            ) : (
              <span aria-hidden="true" className="size-3.5 rounded-full border-[1.5px] border-neutral-300" />
            )}
            <span className="sr-only">{c.done ? copy.checklistSr.done : copy.checklistSr.todo}</span>
            {c.label}
            {c.note && <span className="text-neutral-400">({c.note})</span>}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {status === "action" && (
          <Button size="lg" className="rounded-full px-5 text-caption" onClick={onCompleteForms}>
            {a.forms}
          </Button>
        )}
        <Button size="lg" variant="outline" className="rounded-full px-5 text-caption" onClick={onReschedule}>
          {a.reschedule}
        </Button>
        <Button size="lg" variant="ghost" className="rounded-full px-4 text-red-600 text-caption hover:bg-red-50 hover:text-red-700" onClick={onCancel}>
          {a.cancel}
        </Button>
        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block" />
        <Button size="lg" variant="ghost" className="rounded-full px-4 text-caption" onClick={() => addToCalendar(visit)}>
          <HugeiconsIcon icon={CalendarAdd01Icon} strokeWidth={1.8} data-icon="inline-start" />
          {a.calendar}
        </Button>
        {visit.type === "in-person" && visit.directions && (
          <Button
            nativeButton={false}
            render={<a href={doc.clinic.directions} target="_blank" rel="noreferrer" />}
            size="lg"
            variant="ghost"
            className="rounded-full px-4 text-caption"
          >
            <HugeiconsIcon icon={Navigation03Icon} strokeWidth={1.8} data-icon="inline-start" />
            {a.directions}
          </Button>
        )}
      </div>
    </article>
  )
}

function Suggested({
  person,
  upcoming,
  fluAdded,
  onAddFlu,
}: {
  person: PersonFilterValue
  upcoming: UpcomingVisit[]
  fluAdded: string[]
  onAddFlu: (visitId: string) => void
}) {
  const items = suggestions.filter((s) => {
    if (person !== "all" && s.personId !== person) return false
    const target = s.action.addFluShotTo
    return !target || (upcoming.some((v) => v.id === target) && !fluAdded.includes(target))
  })
  if (!items.length) return null
  return (
    <section aria-labelledby="suggested" className="rounded-2xl bg-neutral-50 p-5 md:p-6">
      <h2 id="suggested" className="text-neutral-950 text-body">
        {copy.suggestedHeading}
      </h2>
      <ul className="mt-4 flex flex-col divide-y divide-neutral-200/70">
        {items.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <PersonAvatar person={personById(s.personId)} className="size-8" />
              <p className="text-pretty text-neutral-700 text-body">{s.text}</p>
            </div>
            {s.action.href ? (
              <Button nativeButton={false} render={<Link href={s.action.href} />} variant="outline" size="sm" className="shrink-0 self-start rounded-full bg-white px-3.5 text-caption sm:self-center">
                {s.action.label}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 self-start rounded-full bg-white px-3.5 text-caption sm:self-center"
                onClick={() => s.action.addFluShotTo && onAddFlu(s.action.addFluShotTo)}
              >
                {s.action.label}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Past + cancelled
 * ------------------------------------------------------------------------- */

function TypeBadge({ type }: { type: VisitType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-neutral-600 text-caption">
      <HugeiconsIcon icon={type === "video" ? Video01Icon : Location01Icon} strokeWidth={1.7} className="size-3.5" />
      {copy.typeLabel[type]}
    </span>
  )
}

function Outcomes({ items }: { items: string[] }) {
  return (
    <>
      {items.map((o) => (
        <span key={o} className="rounded-full bg-emerald-50 px-2 py-0.5 whitespace-nowrap text-emerald-800 text-micro">
          {o}
        </span>
      ))}
    </>
  )
}

function PastList({ visits, onNotes }: { visits: PastVisit[]; onNotes: (v: PastVisit) => void }) {
  const p = copy.past
  return (
    <div className={cn(panel, "px-5 py-2 md:px-6")}>
      {/* Desktop: a table */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            {[p.columns.date, p.columns.patient, p.columns.visit, p.columns.doctor, p.columns.type, p.columns.summary].map((h, i) => (
              <TableHead key={h} className={cn("h-11 text-neutral-400 text-caption", i === 0 && "pl-0")}>
                {h}
              </TableHead>
            ))}
            <TableHead className="h-11 pr-0">
              <span className="sr-only">{p.bookAgain}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((v) => {
            const person = personById(v.personId)
            return (
              <TableRow key={v.id} className="border-neutral-100 hover:bg-neutral-50/70">
                <TableCell className="py-3 pl-0 text-neutral-600 tabular-nums text-caption">{v.date}</TableCell>
                <TableCell className="py-3">
                  <span className="flex items-center gap-2 text-neutral-950 text-caption">
                    <PersonAvatar person={person} className="size-6" />
                    {person.firstName}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-neutral-950 text-body">{v.title}</TableCell>
                <TableCell className="py-3 text-neutral-600 text-caption">{visitDoctor(v.doctorSlug).name}</TableCell>
                <TableCell className="py-3">
                  <TypeBadge type={v.type} />
                </TableCell>
                <TableCell className="py-3">
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => onNotes(v)} className={cn("rounded-sm text-neutral-950 underline underline-offset-4 hover:no-underline text-caption", focusRing.dark)}>
                      {p.viewNotes}
                    </button>
                    <Outcomes items={v.outcomes} />
                  </span>
                </TableCell>
                <TableCell className="py-3 pr-0 text-right">
                  <Button nativeButton={false} render={<Link href={p.bookAgainHref(v.doctorSlug)} />} variant="outline" size="sm" className="rounded-full px-3 text-caption">
                    {p.bookAgain}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Phones: a stacked list */}
      <ul className="divide-y divide-neutral-100 md:hidden">
        {visits.map((v) => {
          const person = personById(v.personId)
          return (
            <li key={v.id} className="flex flex-col gap-2.5 py-4">
              <div className="flex items-start gap-3">
                <PersonAvatar person={person} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-neutral-950 text-body">{v.title}</p>
                  <p className="text-neutral-500 text-caption">
                    {person.firstName} · {v.date} · {visitDoctor(v.doctorSlug).short}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-11">
                <TypeBadge type={v.type} />
                <Outcomes items={v.outcomes} />
              </div>
              <div className="flex gap-2 pl-11">
                <Button variant="outline" size="sm" className="rounded-full px-3 text-caption" onClick={() => onNotes(v)}>
                  {p.viewNotes}
                </Button>
                <Button nativeButton={false} render={<Link href={p.bookAgainHref(v.doctorSlug)} />} variant="ghost" size="sm" className="rounded-full px-3 text-caption">
                  {p.bookAgain}
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CancelledList({ visits }: { visits: CancelledVisit[] }) {
  return (
    <ul className={cn(panel, "divide-y divide-neutral-100 px-5 md:px-6")}>
      {visits.map((v) => {
        const person = personById(v.personId)
        const doc = visitDoctor(v.doctorSlug)
        return (
          <li key={v.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <PersonAvatar person={person} className="size-8" />
              <div className="min-w-0">
                <p className="text-neutral-950 text-body">
                  {person.firstName} · {v.title}
                </p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-neutral-500 text-caption">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.7} className="size-3.5" />
                  {v.date} · {doc.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-11 sm:pl-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-600 text-micro">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-3" />
                {v.by}
              </span>
              <Button nativeButton={false} render={<Link href={copy.past.bookAgainHref(v.doctorSlug)} />} variant="outline" size="sm" className="rounded-full px-3 text-caption">
                {copy.past.bookAgain}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

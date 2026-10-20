"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Download01Icon, Location01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chip } from "@/lib/styles"
import { personById } from "@/lib/data/portal"
import { doctorBySlug } from "@/lib/data/doctors"
import { availabilityFor, timeOf } from "@/lib/data/availability"
import { rescheduleDates, visitDoctor, visitsCopy as copy, type PastVisit, type RescheduleDay, type UpcomingVisit } from "@/lib/data/visits"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SlotPicker } from "@/components/doctors/slot-picker"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { download } from "@/components/portal/download"
import { sheetClass } from "@/components/portal/styles"


function DoctorLine({ slug }: { slug: string }) {
  const d = visitDoctor(slug)
  return (
    <div className="flex items-center gap-3">
      {d.image && <Image src={d.image} alt="" width={80} height={96} className="size-10 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />}
      <div className="min-w-0">
        <p className="text-neutral-950 text-body">{`${d.name}, ${d.credentials}`}</p>
        <p className="flex items-center gap-1 text-neutral-500 text-caption">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={1.7} className="size-3.5 shrink-0" />
          {d.clinic.name}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------- Visit notes ------------------------------- */

/** A plain-text copy of the visit summary, for "Download summary". */
export function summaryText(visit: PastVisit) {
  const d = visit.detail
  const c = copy.detail
  const doc = visitDoctor(visit.doctorSlug)
  return [
    `${personById(visit.personId).name} · ${d.heading}`,
    d.when,
    `${doc.name}, ${doc.credentials} · ${doc.clinic.name}`,
    "",
    `${c.diagnosis}: ${d.diagnosis}`,
    `${c.vitals}: ${d.vitals.join(" · ")}`,
    `${c.treatment}: ${d.treatment}`,
    `${c.note}: “${d.note}”`,
    `${c.followUp}: ${d.followUp}`,
    `${c.billing}: ${c.billingLine(d.billing.insurance, d.billing.you)}`,
  ].join("\n")
}

export function VisitDetailSheet({ visit, onOpenChange }: { visit: PastVisit | null; onOpenChange: (open: boolean) => void }) {
  const c = copy.detail
  return (
    <Sheet open={visit !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        {visit && (
          <>
            <SheetHeader className="gap-3 border-b border-neutral-100 p-6">
              <div className="flex items-center gap-2.5 text-neutral-500 text-caption">
                <PersonAvatar person={personById(visit.personId)} className="size-6" />
                {personById(visit.personId).firstName}
              </div>
              <SheetTitle className="pr-8 text-neutral-950 text-title">{visit.detail.heading}</SheetTitle>
              <SheetDescription className="text-neutral-500 text-caption">{visit.detail.when}</SheetDescription>
              <div className="pt-1">
                <DoctorLine slug={visit.doctorSlug} />
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 p-6">
              <h3 className="text-neutral-500 text-caption">{c.summary}</h3>
              <dl className="flex flex-col gap-4">
                {[
                  [c.diagnosis, visit.detail.diagnosis],
                  [c.vitals, visit.detail.vitals.join(" · ")],
                  [c.treatment, visit.detail.treatment],
                  [c.followUp, visit.detail.followUp],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-neutral-400 text-caption">{label}</dt>
                    <dd className="mt-0.5 text-pretty text-neutral-950 text-body">{value}</dd>
                  </div>
                ))}
              </dl>
              <figure className="rounded-xl bg-neutral-50 p-4">
                <figcaption className="text-neutral-500 text-caption">{c.note}</figcaption>
                <blockquote className="mt-1 text-pretty text-neutral-800 text-body">“{visit.detail.note}”</blockquote>
              </figure>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                <span className="text-neutral-400 text-caption">{c.billing}</span>
                <span className="text-neutral-700 tabular-nums text-caption">{c.billingLine(visit.detail.billing.insurance, visit.detail.billing.you)}</span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2.5 border-t border-neutral-100 p-6">
              <Button size="lg" className="w-full rounded-full text-caption" onClick={() => download(`visit-summary-${visit.id}.txt`, summaryText(visit))}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
                {c.download}
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button nativeButton={false} render={<Link href={c.messageHref} />} variant="outline" size="lg" className="rounded-full text-caption">
                  {c.message(visitDoctor(visit.doctorSlug).short)}
                </Button>
                <Button nativeButton={false} render={<Link href={copy.past.bookAgainHref(visit.doctorSlug)} />} variant="outline" size="lg" className="rounded-full text-caption">
                  {c.followUpBook}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------- Reschedule ------------------------------- */

export function RescheduleSheet({
  visit,
  onOpenChange,
  onConfirm,
}: {
  visit: UpcomingVisit | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string, when: RescheduleDay & { time: string; start: string }) => void
}) {
  const c = copy.reschedule
  const [slot, setSlot] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<string | null>(null)
  const doctor = visit ? doctorBySlug(visit.doctorSlug) ?? null : null
  const days = React.useMemo(() => availabilityFor(doctor), [doctor])

  // Start fresh each time the sheet opens for a visit.
  const [lastId, setLastId] = React.useState<string | null>(null)
  if ((visit?.id ?? null) !== lastId) {
    setLastId(visit?.id ?? null)
    setSlot(null)
    setDone(null)
  }

  const confirm = () => {
    if (!visit || !slot) return
    const label = days.flatMap((d) => d.slots).find((s) => s.value === slot)?.label ?? ""
    const [dayId, hhmm] = slot.split("-")
    const day = rescheduleDates[dayId]
    const time = timeOf(label)
    if (!day || !hhmm) return
    onConfirm(visit.id, { ...day, time, start: `${day.iso}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}` })
    setDone(c.success(personById(visit.personId).firstName, day.date, time))
  }

  return (
    <Sheet open={visit !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        {visit && (
          <>
            <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
              <SheetTitle className="pr-8 text-neutral-950 text-title">{c.title(personById(visit.personId).firstName)}</SheetTitle>
              <SheetDescription className="text-neutral-500 text-caption">
                {c.current(visit.shortDate, visit.time, visitDoctor(visit.doctorSlug).short)}
              </SheetDescription>
            </SheetHeader>
            <div aria-live="polite" className="flex flex-1 flex-col p-6">
              {done ? (
                <div className="flex flex-col items-start gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-5" />
                  </span>
                  <p className="text-pretty text-neutral-950 text-lead">{done}</p>
                  <Button size="lg" variant="outline" className="rounded-full px-6 text-caption" onClick={() => onOpenChange(false)}>
                    {c.close}
                  </Button>
                </div>
              ) : (
                <SlotPicker days={days} value={slot} onValueChange={setSlot} dayLabel={c.day} timeLabel={c.time} openLabel={c.open} compact />
              )}
            </div>
            {!done && (
              <div className="border-t border-neutral-100 p-6">
                <Button size="lg" disabled={!slot} className="w-full rounded-full text-caption" onClick={confirm}>
                  {c.confirm}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ---------------------------------- Cancel --------------------------------- */

export function CancelVisitDialog({
  visit,
  onOpenChange,
  onConfirm,
}: {
  visit: UpcomingVisit | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string, reason: string | null) => void
}) {
  const c = copy.cancel
  const [reason, setReason] = React.useState<string | null>(null)
  const labelId = React.useId()
  return (
    <AlertDialog
      open={visit !== null}
      onOpenChange={(open) => {
        if (!open) setReason(null)
        onOpenChange(open)
      }}
    >
      <AlertDialogContent className="gap-5 rounded-3xl">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-neutral-950 text-title">{c.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty text-neutral-500 text-body">{c.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <p id={labelId} className="text-neutral-600 text-caption">
            {c.reasonLabel}
          </p>
          <ToggleGroup
            aria-labelledby={labelId}
            value={reason ? [reason] : []}
            onValueChange={(v: string[]) => setReason(v[v.length - 1] ?? null)}
            className="mt-2 flex flex-wrap justify-start gap-2"
          >
            {c.reasons.map((r) => (
              <ToggleGroupItem key={r} value={r} className={cn(chip, "h-9 px-3.5 text-caption")}>
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <AlertDialogFooter className="gap-2.5 sm:justify-end">
          <AlertDialogCancel variant="outline" size="lg" className="rounded-full px-5 text-caption">
            {c.keep}
          </AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            className="rounded-full bg-red-600 px-5 text-white text-caption hover:bg-red-700"
            onClick={() => visit && onConfirm(visit.id, reason)}
          >
            {c.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Clock01Icon, FloppyDiskIcon, SignatureIcon, UserIcon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { fmtTime } from "@/lib/admin/format"
import type { NoteState } from "@/lib/admin/doctor"
import type { Appointment, Patient } from "@/lib/admin/types"
import { visitTypeLabel } from "@/components/admin/forms"
import { NoteStatusBadge } from "@/components/admin/doctor/badges"
import { Button } from "@/components/ui/button"

const c = visitCopy

export function TopBar({
  patient,
  appointment,
  state,
  timer,
  live,
  saved,
  readOnly,
  onSave,
  onSign,
  onPatientInfo,
  barRef,
}: {
  patient: Patient
  appointment: Appointment
  state: NoteState
  timer: string
  live: boolean
  saved: string
  readOnly: boolean
  onSave: () => void
  onSign: () => void
  onPatientInfo: () => void
  barRef: React.Ref<HTMLDivElement>
}) {
  const meta = [
    `${patient.age} · ${patient.sex === "F" ? "Female" : "Male"}`,
    patient.mrn,
    fmtTime(appointment.start),
    appointment.type === "video" ? "Video visit" : appointment.room ? `Room ${appointment.room}` : "No room yet",
    visitTypeLabel(appointment.visitType),
  ]
  return (
    <div ref={barRef} className="sticky top-16 z-20 -mx-5 -mt-8 border-b border-neutral-200/70 bg-white/95 px-5 pt-4 pb-3 backdrop-blur-md md:-mx-8 md:-mt-9 md:px-8">
      <Link href="/admin/my-day" className="inline-flex items-center gap-1 rounded text-neutral-500 outline-none hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption">
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
        {c.back}
      </Link>
      <div className="mt-1.5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-neutral-950 text-title">{patient.name}</h1>
            <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 tabular-nums text-micro", live ? "bg-sky-50 text-sky-800" : "bg-neutral-100 text-neutral-600")}>
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
              <span aria-live="off">{timer}</span>
            </span>
            <NoteStatusBadge state={state} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-neutral-500 tabular-nums text-caption">
            {meta.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <span className="inline-flex items-center gap-1">
                  {i === 3 && appointment.type === "video" && <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5 text-sky-600" />}
                  {m}
                </span>
              </React.Fragment>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <span role="status" className="mr-1 text-neutral-500 tabular-nums text-micro">
              {saved}
            </span>
          )}
          <Button type="button" variant="outline" className="h-10 rounded-full px-4 text-caption lg:hidden" onClick={onPatientInfo}>
            <HugeiconsIcon icon={UserIcon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
            {c.patientInfo}
          </Button>
          {!readOnly && (
            <>
              <Button type="button" variant="outline" className="h-10 rounded-full px-4 text-caption" onClick={onSave} aria-keyshortcuts="Meta+S Control+S">
                <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
                {c.saveDraft}
              </Button>
              <Button type="button" className="h-10 rounded-full px-4 text-caption" onClick={onSign} aria-keyshortcuts="Meta+Enter Control+Enter">
                <HugeiconsIcon icon={SignatureIcon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
                {c.signNote}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

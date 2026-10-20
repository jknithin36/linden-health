"use client"

import * as React from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon, Door01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE } from "@/lib/motion"
import { queueCopy } from "@/lib/data/admin-queue"
import { fmtTime, minutesBetween } from "@/lib/admin/format"
import { getDoctorSync, getPatientSync, queueColumn, waitLevel, waitMinutes, type QueueColumn } from "@/lib/admin/queries"
import type { Appointment } from "@/lib/admin/types"
import { PatientCell, touchTarget } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const waitText = { normal: "text-neutral-600", amber: "text-amber-700", red: "text-red-700" } as const

export function QueueCard({
  a,
  now,
  reduced,
  highlighted,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
  onOpen,
}: {
  a: Appointment
  now: string
  reduced: boolean
  highlighted: boolean
  dragging: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onMove: (a: Appointment, to: QueueColumn) => void
  onOpen: (id: string) => void
}) {
  const col = queueColumn(a.status)!
  const patient = getPatientSync(a.patientId)
  const doctor = getDoctorSync(a.doctorId)
  const name = patient?.name ?? "Patient"

  let timer: React.ReactNode = null
  if (col === "arrived" || col === "checked-in" || col === "waiting") {
    const min = waitMinutes(a, now)
    const t = waitLevel(min)
    timer = (
      <span className={cn("inline-flex items-center gap-1 tabular-nums text-caption", waitText[t], t !== "normal" && "font-emphasis")}>
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-3.5" aria-hidden="true" />
        {min} min
        <span className="sr-only">{t === "red" ? " waiting, over 25 minutes" : t === "amber" ? " waiting, over 15 minutes" : " waiting"}</span>
      </span>
    )
  } else if (col === "with-doctor") {
    const min = a.roomedAt ? Math.max(0, minutesBetween(a.roomedAt, now)) : 0
    timer = (
      <span className="inline-flex items-center gap-1 text-neutral-500 tabular-nums text-caption">
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-3.5" aria-hidden="true" />
        In room {min} min
      </span>
    )
  } else if (a.completedAt) {
    timer = <span className="text-neutral-500 tabular-nums text-caption">Done {fmtTime(a.completedAt)}</span>
  }

  const badges = col === "done" ? [] : [...(!a.formsDone ? [queueCopy.badges.forms] : []), ...(!a.insuranceVerified ? [queueCopy.badges.insurance] : []), ...(a.source === "walk-in" ? [queueCopy.badges.walkIn] : [])]

  return (
    <motion.li layout={reduced ? false : "position"} layoutId={reduced ? undefined : `queue-${a.id}`} transition={{ duration: 0.25, ease: EASE }} className="list-none">
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", a.id)
          e.dataTransfer.effectAllowed = "move"
          onDragStart(a.id)
        }}
        onDragEnd={onDragEnd}
        className={cn(
          "group/card relative flex cursor-grab flex-col gap-2.5 rounded-xl border bg-white p-3 transition-[background-color,border-color,opacity] duration-700 active:cursor-grabbing",
          highlighted ? "border-sky-200 bg-sky-50/70" : "border-neutral-200/70 hover:border-neutral-300",
          dragging && "opacity-40",
          col === "done" && "bg-neutral-50/60"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <PatientCell patient={a.patientId} link={false} className="[&_.size-8]:size-7" />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Move ${name} or view details`} className={cn("-mt-1 -mr-1 size-7 shrink-0 rounded-full text-neutral-500", touchTarget)} />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.8} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 py-1.5 text-micro">{queueCopy.moveTo}</DropdownMenuLabel>
                {queueCopy.columns
                  .filter((c) => c.id !== col)
                  .map((c) => (
                    <DropdownMenuItem key={c.id} className="rounded-xl text-caption" onClick={() => onMove(a, c.id)}>
                      {c.label}
                      {c.id === "with-doctor" && <span className="ml-auto text-neutral-400 text-micro">Room…</span>}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-xl text-caption" onClick={() => onOpen(a.id)}>
                View appointment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-neutral-500 text-micro">
          <span className="text-neutral-900 tabular-nums">
            <span className="sr-only">Appointment </span>
            {fmtTime(a.start)}
          </span>
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <span className="truncate">{doctor?.name}</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap">
          <span className="contents">
            {a.room && col === "with-doctor" && (
              <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2 text-sky-800 text-micro">
                <HugeiconsIcon icon={Door01Icon} strokeWidth={1.8} className="size-3" aria-hidden="true" />
                Room {a.room}
              </span>
            )}
            {timer}
          </span>
        </div>
        {badges.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <li key={b} className={cn("inline-flex h-5 items-center rounded-full px-2 text-micro", b === queueCopy.badges.walkIn ? "bg-neutral-100 text-neutral-600" : "bg-amber-50 text-amber-800")}>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.li>
  )
}

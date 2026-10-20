"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { inboxCopy as c } from "@/lib/data/admin-doctor"
import { relative } from "@/lib/admin/format"
import { getPatientSync } from "@/lib/admin/queries"
import type { InboxRow } from "@/lib/admin/doctor"
import { Avatar, patientPhoto } from "@/components/admin/ui"
import { inboxTypeIcon, PriorityLabel } from "@/components/admin/doctor/badges"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

export function InboxListSkeleton() {
  return (
    <ul aria-hidden="true" className="flex flex-col">
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="flex items-start gap-3 border-b border-neutral-100 px-4 py-3.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function InboxList({
  rows,
  selectedId,
  onSelect,
  checked,
  onCheck,
}: {
  rows: InboxRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  checked: string[]
  onCheck: (id: string, on: boolean) => void
}) {
  return (
    <ul aria-label="Inbox items" className="flex flex-col">
      {rows.map((r) => {
        const p = getPatientSync(r.patientId)
        const done = r.status === "done"
        const active = r.id === selectedId
        const canCheck = r.type === "result" && !done
        return (
          <li key={r.id} className={cn("relative flex items-start gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0", active ? "bg-neutral-100/70" : "hover:bg-neutral-50", done && "opacity-60")}>
            {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-neutral-950" />}
            <span className="relative mt-0.5 shrink-0">
              {canCheck ? (
                <span className="grid size-8 place-items-center">
                  <Checkbox checked={checked.includes(r.id)} onCheckedChange={(v) => onCheck(r.id, !!v)} aria-label={`Select ${r.summary} for ${p?.name}`} className="relative z-10" />
                </span>
              ) : p ? (
                <Avatar name={p.name} id={p.id} src={patientPhoto(p)} />
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              aria-current={active || undefined}
              className="min-w-0 flex-1 rounded-lg text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-neutral-950 focus-visible:after:ring-inset"
            >
              <span className="flex items-center justify-between gap-2">
                <span className={cn("truncate text-caption", done ? "text-neutral-600" : "text-neutral-950")}>{p?.name}</span>
                <span className="shrink-0 text-neutral-400 tabular-nums text-micro">{relative(r.createdAt)}</span>
              </span>
              <span className={cn("mt-0.5 block truncate text-caption", done ? "text-neutral-500 line-through decoration-neutral-300" : "text-neutral-600")}>{r.summary}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="inline-flex items-center gap-1 text-neutral-500 text-micro">
                  <HugeiconsIcon icon={inboxTypeIcon[r.type]} strokeWidth={1.8} aria-hidden="true" className="size-3" />
                  {c.typeLabel[r.type]}
                </span>
                <PriorityLabel priority={r.priority} />
                {done && (
                  <span className="inline-flex items-center gap-1 text-neutral-600 text-micro">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" className="size-3" />
                    {c.done}
                    {r.action ? ` · ${r.action}` : ""}
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

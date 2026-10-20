"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { panel } from "@/components/admin/ui"
import type { SectionId } from "@/components/admin/doctor/visit/schema"

/** One numbered note section: the header toggles the body; the check turns on when its required bits are filled. */
export function SectionCard({ id, done, children }: { id: SectionId; done: boolean; children: React.ReactNode }) {
  const meta = visitCopy.sections[id]
  const [open, setOpen] = React.useState(true)
  const bodyId = `visit-section-${id}`
  return (
    <section aria-labelledby={`${bodyId}-title`} className={cn(panel, "scroll-mt-48")} id={`section-${id}`}>
      <h2 id={`${bodyId}-title`} className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 md:px-6"
        >
          <span aria-hidden="true" className={cn("grid size-7 shrink-0 place-items-center rounded-full tabular-nums text-caption", done ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600")}>
            {meta.n}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-neutral-950 text-body">{meta.title}</span>
            <span className="block truncate text-neutral-500 text-micro">{meta.hint}</span>
          </span>
          <span className={cn("inline-flex shrink-0 items-center gap-1 text-micro", done ? "text-emerald-700" : "text-neutral-400")}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} aria-hidden="true" className={cn("size-4", !done && "opacity-60")} />
            {done ? visitCopy.done : visitCopy.todo}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} aria-hidden="true" className={cn("size-4 shrink-0 text-neutral-400 transition-transform motion-reduce:transition-none", !open && "-rotate-90")} />
        </button>
      </h2>
      <div id={bodyId} hidden={!open} className="border-t border-neutral-100 px-5 py-5 md:px-6">
        {children}
      </div>
    </section>
  )
}

/** A small label + control stack used inside sections. */
export function Labeled({ label, htmlFor, children, hint, className, id }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label id={id} htmlFor={htmlFor} className="text-neutral-700 text-caption">
        {label}
      </label>
      {children}
      {hint}
    </div>
  )
}

const fieldCls = "w-full rounded-xl border border-neutral-200 bg-white px-3 text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus-visible:border-neutral-950 aria-invalid:border-red-500 disabled:bg-neutral-50 text-caption"
export const inputCls = cn(fieldCls, "h-10")
export const textareaCls = cn(fieldCls, "min-h-28 resize-y py-2.5 leading-5")

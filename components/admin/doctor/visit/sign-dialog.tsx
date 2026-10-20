"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, CheckmarkCircle02Icon, SignatureIcon } from "@hugeicons/core-free-icons"

import { visitCopy } from "@/lib/data/admin-visit"
import type { VisitNote } from "@/lib/admin/types"
import { NoteSummary } from "@/components/admin/doctor/visit/note-summary"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const c = visitCopy.sign

export function SignDialog({
  open,
  onOpenChange,
  note,
  missing,
  age,
  allergies,
  onSign,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  note: VisitNote | null
  missing: string[]
  age: number
  allergies: string[]
  onSign: () => void
}) {
  const [confirmed, setConfirmed] = React.useState(false)
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setConfirmed(false)
  }
  const blocked = missing.length > 0
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const checkRef = React.useRef<HTMLButtonElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={blocked ? cancelRef : checkRef} className="flex max-h-[min(90dvh,760px)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1.5 border-b border-neutral-100 p-6 pr-14 text-left">
          <DialogTitle className="text-neutral-950 text-title">{c.title}</DialogTitle>
          <DialogDescription className="text-pretty text-neutral-500 text-caption">{c.description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {blocked ? (
            <div role="alert" className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="flex items-center gap-2 text-caption">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="size-4" />
                <span className="font-emphasis">{c.missingTitle}</span>
              </p>
              <ul className="mt-2 list-disc pl-10 text-caption">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mb-2 flex items-center gap-2 text-emerald-700 text-caption">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} aria-hidden="true" className="size-4" />
              {c.ready}
            </p>
          )}
          {note && <NoteSummary note={note} age={age} allergies={allergies} compact />}
        </div>
        <DialogFooter className="m-0 flex-col gap-4 rounded-none border-t border-neutral-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <label className="flex items-center gap-2.5 text-neutral-900 text-caption has-disabled:text-neutral-400">
            <Checkbox ref={checkRef} checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} disabled={blocked} />
            {c.confirm}
          </label>
          <div className="flex gap-2">
            <Button ref={cancelRef} type="button" variant="outline" className="h-10 rounded-full px-4 text-caption" onClick={() => onOpenChange(false)}>
              {c.cancel}
            </Button>
            <Button type="button" className="h-10 rounded-full px-4 text-caption" disabled={blocked || !confirmed} onClick={onSign}>
              <HugeiconsIcon icon={SignatureIcon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
              {c.submit}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

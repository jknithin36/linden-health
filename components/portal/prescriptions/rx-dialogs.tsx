"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Medicine02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chip, focusRing } from "@/lib/styles"
import { personById, type PersonId } from "@/lib/data/portal"
import { visitDoctor } from "@/lib/data/visits"
import { pharmacies, prescriptionsCopy as copy, refillSteps, type ActiveMed, type MedDetail, type Pharmacy } from "@/lib/data/prescriptions"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { sheetClass } from "@/components/portal/styles"

/** Requested → Approved → Sent to pharmacy → Ready for pickup. `done` steps are ticked. */
export function RefillSteps({ doctor, done = 1, className }: { doctor: string; done?: number; className?: string }) {
  const steps = refillSteps(doctor)
  return (
    <ol className={cn("flex flex-col gap-0", className)}>
      {steps.map((s, i) => {
        const isDone = i < done
        return (
          <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden="true" className={cn("absolute top-5 left-[9px] h-[calc(100%-12px)] w-px", isDone ? "bg-emerald-300" : "bg-neutral-200")} />}
            {isDone ? (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="relative size-5 shrink-0 text-emerald-600" />
            ) : (
              <span aria-hidden="true" className="relative mt-0.5 size-[18px] shrink-0 rounded-full border-[1.5px] border-neutral-300 bg-white" />
            )}
            <p className={cn("text-caption", isDone ? "text-neutral-950" : "text-neutral-500")}>
              <span className="sr-only">{isDone ? copy.refill.stepDone : copy.refill.stepNext}</span>
              {s.label}
              {s.detail && <span className="text-neutral-400"> · {s.detail}</span>}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function MedHeader({ personId, name, sub }: { personId: PersonId; name: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-neutral-600">
        <HugeiconsIcon icon={Medicine02Icon} strokeWidth={1.7} className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-neutral-950 text-body">{name}</p>
        <p className="text-neutral-500 text-caption">{sub}</p>
      </div>
      <PersonAvatar person={personById(personId)} className="size-8" />
    </div>
  )
}

/* ------------------------------ Medication detail --------------------------- */

export type DetailTarget = { personId: PersonId; name: string; doctorSlug: string; detail: MedDetail; refillable?: boolean; medId: string }

export function MedDetailSheet({
  med,
  onOpenChange,
  onRefill,
}: {
  med: DetailTarget | null
  onOpenChange: (open: boolean) => void
  onRefill: (medId: string) => void
}) {
  const d = copy.detail
  return (
    <Sheet open={med !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        {med && (
          <>
            <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
              <SheetTitle className="pr-8 text-neutral-950 text-title">{med.name}</SheetTitle>
              <SheetDescription className="text-neutral-500 text-caption">
                {personById(med.personId).firstName} · {visitDoctor(med.doctorSlug).name}
              </SheetDescription>
            </SheetHeader>
            <dl className="flex flex-col gap-4 p-6">
              {(
                [
                  [d.howToTake, med.detail.howToTake],
                  [d.whatFor, med.detail.whatFor],
                  [d.sideEffects, med.detail.sideEffects],
                  [d.tips, med.detail.tips],
                  [d.history, med.detail.history],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-neutral-400 text-caption">{label}</dt>
                  <dd className="mt-0.5 text-pretty text-neutral-950 text-body">{value}</dd>
                </div>
              ))}
              <div className="rounded-xl bg-red-50 p-4">
                <dt className="text-red-800 text-caption">{d.callIf}</dt>
                <dd className="mt-0.5 text-pretty text-red-950 text-body">{med.detail.callIf}</dd>
              </div>
            </dl>
            <div className="mt-auto grid gap-2.5 border-t border-neutral-100 p-6 sm:grid-cols-2">
              {med.refillable && (
                <Button size="lg" className="rounded-full text-caption" onClick={() => onRefill(med.medId)}>
                  {copy.actions.refill}
                </Button>
              )}
              <Button
                nativeButton={false}
                render={<Link href={copy.actions.messageHref} />}
                variant="outline"
                size="lg"
                className={cn("rounded-full text-caption", !med.refillable && "sm:col-span-2")}
              >
                {copy.actions.message(visitDoctor(med.doctorSlug).short)}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------- Pharmacy picker ---------------------------- */

function PharmacyPicker({ value, onValueChange }: { value: string; onValueChange: (id: string) => void }) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onValueChange(v as string)} aria-label={copy.pharmacy.pick} className="gap-2">
      {pharmacies.map((p) => (
        <label
          key={p.id}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
            value === p.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <RadioGroupItem value={p.id} className="mt-0.5" />
          <span className="min-w-0">
            <span className="block text-neutral-950 text-body">{p.name}</span>
            <span className="block text-neutral-500 text-caption">{p.address}</span>
            <span className="block text-neutral-400 text-micro">
              {p.phone} · {p.hours}
            </span>
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}

export function PharmacySheet({
  open,
  onOpenChange,
  current,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: Pharmacy
  onSave: (id: string) => void
}) {
  const [picked, setPicked] = React.useState(current.id)
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setPicked(current.id)
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
          <SheetTitle className="pr-8 text-neutral-950 text-title">{copy.pharmacy.title}</SheetTitle>
          <SheetDescription className="text-neutral-500 text-caption">{copy.pharmacy.pick}</SheetDescription>
        </SheetHeader>
        <div className="p-6">
          <PharmacyPicker value={picked} onValueChange={setPicked} />
        </div>
        <div className="mt-auto border-t border-neutral-100 p-6">
          <Button
            size="lg"
            className="w-full rounded-full text-caption"
            onClick={() => {
              onSave(picked)
              onOpenChange(false)
            }}
          >
            {copy.pharmacy.save}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------- Refill request ---------------------------- */

export function RefillSheet({
  med,
  pharmacy,
  onPharmacy,
  onOpenChange,
  onSent,
}: {
  med: ActiveMed | null
  pharmacy: Pharmacy
  onPharmacy: (id: string) => void
  onOpenChange: (open: boolean) => void
  onSent: (medId: string) => void
}) {
  const r = copy.refill
  const [quantity, setQuantity] = React.useState<string | null>(null)
  const [changing, setChanging] = React.useState(false)
  const [note, setNote] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const [lastId, setLastId] = React.useState<string | null>(null)
  if ((med?.id ?? null) !== lastId) {
    setLastId(med?.id ?? null)
    setQuantity(med?.quantities?.[0]?.id ?? null)
    setChanging(false)
    setNote("")
    setSent(false)
  }
  const ids = { qty: React.useId(), note: React.useId() }

  return (
    <Sheet open={med !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        {med && (
          <>
            <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
              <SheetTitle className="pr-8 text-neutral-950 text-title">{r.title}</SheetTitle>
              <SheetDescription className="sr-only">{`${med.name} · ${personById(med.personId).firstName}`}</SheetDescription>
            </SheetHeader>
            <div aria-live="polite" className="flex flex-1 flex-col gap-6 p-6">
              <div>
                <p className="mb-2 text-neutral-500 text-caption">{r.medication}</p>
                <MedHeader personId={med.personId} name={med.name} sub={`${personById(med.personId).firstName} · ${med.supply.label}`} />
              </div>

              {sent ? (
                <>
                  <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="mt-px size-5 shrink-0 text-emerald-600" />
                    <p className="text-pretty text-body">{r.success(pharmacy.name)}</p>
                  </div>
                  <div>
                    <p className="mb-3 text-neutral-500 text-caption">{r.progress}</p>
                    <RefillSteps doctor={visitDoctor(med.doctorSlug).short} />
                  </div>
                </>
              ) : (
                <>
                  {med.quantities && (
                    <div>
                      <p id={ids.qty} className="mb-2 text-neutral-500 text-caption">
                        {r.quantity}
                      </p>
                      <ToggleGroup
                        aria-labelledby={ids.qty}
                        value={quantity ? [quantity] : []}
                        onValueChange={(v: string[]) => {
                          const next = v[v.length - 1]
                          if (next) setQuantity(next)
                        }}
                        className="flex flex-col items-stretch gap-2"
                      >
                        {med.quantities.map((q) => (
                          <ToggleGroupItem key={q.id} value={q.id} className={cn(chip, "h-11 justify-start rounded-xl px-4 text-caption")}>
                            {q.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-neutral-500 text-caption">{r.pharmacy}</p>
                      {!changing && (
                        <button type="button" onClick={() => setChanging(true)} className={cn("rounded-sm text-neutral-950 underline underline-offset-4 hover:no-underline text-caption", focusRing.dark)}>
                          {r.change}
                        </button>
                      )}
                    </div>
                    {changing ? (
                      <PharmacyPicker
                        value={pharmacy.id}
                        onValueChange={(id) => {
                          onPharmacy(id)
                          setChanging(false)
                        }}
                      />
                    ) : (
                      <div className="rounded-xl border border-neutral-200 p-3.5">
                        <p className="text-neutral-950 text-body">{pharmacy.name}</p>
                        <p className="text-neutral-500 text-caption">{pharmacy.address}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor={ids.note} className="mb-2 block text-neutral-500 text-caption">
                      {r.note}
                    </label>
                    <Textarea
                      id={ids.note}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={r.notePlaceholder}
                      className="min-h-24 rounded-xl border-neutral-200 bg-white px-4 py-3 shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 text-body md:text-body"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="border-t border-neutral-100 p-6">
              {sent ? (
                <Button size="lg" variant="outline" className="w-full rounded-full text-caption" onClick={() => onOpenChange(false)}>
                  {r.done}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full rounded-full text-caption"
                  onClick={() => {
                    onSent(med.id)
                    setSent(true)
                  }}
                >
                  {r.send}
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

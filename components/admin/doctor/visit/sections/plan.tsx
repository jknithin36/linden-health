"use client"

import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Alert02Icon, Cancel01Icon, Medicine02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { allergyConflict, medicationCatalog, orderCatalog, pharmacyOptions, type OrderOption } from "@/lib/admin/clinical"
import type { PrescriptionDraft } from "@/lib/admin/types"
import type { NoteForm } from "@/components/admin/doctor/visit/schema"
import { inputCls, Labeled, textareaCls } from "@/components/admin/doctor/visit/sections/section-card"
import { SearchCombobox } from "@/components/admin/doctor/visit/sections/search-combobox"
import { SelectInput } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const c = visitCopy.plan
type Med = (typeof medicationCatalog)[number]
const orderTypes = ["lab", "imaging", "referral", "vaccine"] as const
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")

function SubHead({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-neutral-950 text-body">{children}</h3>
      {action}
    </div>
  )
}

export function AllergyAlert({ text, className }: { text: string; className?: string }) {
  return (
    <div role="alert" className={cn("flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-800", className)}>
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="text-caption">
        <span className="font-emphasis">{c.allergyTitle}: </span>
        {text}
      </p>
    </div>
  )
}

/* --------------------------------- Orders ---------------------------------- */

function Orders() {
  const { control } = useFormContext<NoteForm>()
  return (
    <Controller
      control={control}
      name="plan.orders"
      render={({ field }) => {
        const has = (o: OrderOption) => field.value.some((x) => x.name === o.name)
        return (
          <div className="flex flex-col gap-3">
            <SubHead
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className="rounded-full px-3 text-caption" />}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />
                    {c.addOrder}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-80 w-64">
                    {orderTypes.map((t, i) => (
                      <React.Fragment key={t}>
                        {i > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-neutral-500 text-micro">{c.orderTypes[t]}</DropdownMenuLabel>
                          {orderCatalog
                            .filter((o) => o.type === t)
                            .map((o) => (
                              <DropdownMenuItem key={o.name} disabled={has(o)} className="text-caption" onClick={() => field.onChange([...field.value, { id: `o-new-${slug(o.name)}`, type: o.type, name: o.name, status: "ordered" as const }])}>
                                {o.name}
                                {has(o) && <span className="ml-auto text-neutral-400 text-micro">{c.ordered}</span>}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                      </React.Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            >
              {c.orders}
            </SubHead>
            {field.value.length ? (
              <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200/70">
                {field.value.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="w-16 shrink-0 text-neutral-500 text-micro">{c.orderTypes[o.type]}</span>
                    <span className="min-w-0 flex-1 truncate text-neutral-950 text-caption">{o.name}</span>
                    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-sky-50 px-2.5 text-sky-800 text-micro">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-sky-500" />
                      {o.status === "resulted" ? "Resulted" : o.status === "cancelled" ? "Cancelled" : c.ordered}
                    </span>
                    <RemoveButton label={c.removeOrder(o.name)} onClick={() => field.onChange(field.value.filter((x) => x.id !== o.id))} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-caption">{c.noOrders}</p>
            )}
          </div>
        )
      }}
    />
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-7 shrink-0 place-items-center rounded-full text-neutral-500 outline-none hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950">
      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
    </button>
  )
}

/* ------------------------------ Prescriptions ------------------------------ */

type Draft = { med: Med | null; dose: string; frequency: string; quantity: string; refills: string; pharmacy: string }
const emptyDraft: Draft = { med: null, dose: "", frequency: "", quantity: "", refills: "0", pharmacy: pharmacyOptions[0] }

function Prescriptions({ allergies }: { allergies: string[] }) {
  const { control } = useFormContext<NoteForm>()
  const [d, setD] = React.useState<Draft>(emptyDraft)
  const [error, setError] = React.useState<string | null>(null)
  const warning = d.med ? allergyConflict(allergies, d.med.name) : null
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }))

  return (
    <Controller
      control={control}
      name="plan.prescriptions"
      render={({ field }) => {
        const add = () => {
          if (!d.med) return setError("Choose a medication.")
          if (!d.dose) return setError("Choose a dose.")
          const qty = Number(d.quantity)
          if (!d.quantity || !Number.isFinite(qty) || qty < 1) return setError("Enter a quantity of 1 or more.")
          const refills = Number(d.refills)
          if (!Number.isInteger(refills) || refills < 0 || refills > 11) return setError("Refills must be 0–11.")
          const rx: PrescriptionDraft = { medication: d.med.name, dose: d.dose, frequency: d.frequency.trim() || d.med.frequency, quantity: qty, refills, pharmacy: d.pharmacy }
          field.onChange([...field.value, rx])
          setD(emptyDraft)
          setError(null)
        }
        return (
          <div className="flex flex-col gap-3">
            <SubHead>{c.rx}</SubHead>
            {field.value.length ? (
              <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200/70">
                {field.value.map((rx, i) => {
                  const w = allergyConflict(allergies, rx.medication)
                  return (
                    <li key={`${rx.medication}-${i}`} className="flex flex-col gap-2 px-3.5 py-3">
                      <div className="flex items-start gap-3">
                        <HugeiconsIcon icon={Medicine02Icon} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-neutral-950 text-caption">
                            {rx.medication} {rx.dose}
                          </p>
                          <p className="text-neutral-500 tabular-nums text-micro">
                            {rx.frequency} · Qty {rx.quantity} · {rx.refills} refill{rx.refills === 1 ? "" : "s"} · {rx.pharmacy}
                          </p>
                        </div>
                        <RemoveButton label={c.removeRx(rx.medication)} onClick={() => field.onChange(field.value.filter((_, j) => j !== i))} />
                      </div>
                      {w && <AllergyAlert text={w} />}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-neutral-500 text-caption">{c.noRx}</p>
            )}

            <div className="flex flex-col gap-4 rounded-xl bg-neutral-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Labeled label={c.med} htmlFor="rx-med" className="sm:col-span-2">
                  {d.med ? (
                    <div className={cn(inputCls, "flex items-center justify-between gap-2 bg-white")}>
                      <span className="truncate">{d.med.name}</span>
                      <button type="button" onClick={() => set({ ...emptyDraft, pharmacy: d.pharmacy })} className="shrink-0 rounded text-neutral-500 underline-offset-2 outline-none hover:text-neutral-950 hover:underline focus-visible:ring-2 focus-visible:ring-neutral-950 text-micro">
                        Change
                      </button>
                    </div>
                  ) : (
                    <SearchCombobox
                      id="rx-med"
                      label={c.medSearch}
                      placeholder={c.medPlaceholder}
                      emptyText={c.medEmpty}
                      items={medicationCatalog}
                      filter={(m, q) => m.name.toLowerCase().includes(q)}
                      getKey={(m) => m.name}
                      onSelect={(m) => {
                        set({ med: m, dose: m.doses.length === 1 ? m.doses[0] : "", frequency: m.frequency, quantity: "" })
                        setError(null)
                      }}
                      renderItem={(m) => (
                        <span className="flex items-baseline justify-between gap-2">
                          <span>{m.name}</span>
                          <span className="text-neutral-400 text-micro">{m.doses.join(", ")}</span>
                        </span>
                      )}
                    />
                  )}
                </Labeled>
                {warning && <AllergyAlert text={warning} className="sm:col-span-2" />}
                <Labeled label={c.dose} htmlFor="rx-dose">
                  <SelectInput id="rx-dose" value={d.dose} onChange={(v) => set({ dose: v })} options={(d.med?.doses ?? []).map((x) => ({ value: x, label: x }))} placeholder="Choose dose" disabled={!d.med} className="bg-white" />
                </Labeled>
                <Labeled label={c.frequency} htmlFor="rx-frequency">
                  <input id="rx-frequency" type="text" value={d.frequency} onChange={(e) => set({ frequency: e.target.value })} placeholder="e.g. Twice a day for 10 days" className={inputCls} />
                </Labeled>
                <div className="grid grid-cols-2 gap-4">
                  <Labeled label={c.quantity} htmlFor="rx-qty">
                    <input id="rx-qty" type="number" inputMode="numeric" min={1} value={d.quantity} onChange={(e) => set({ quantity: e.target.value })} className={cn(inputCls, "tabular-nums")} />
                  </Labeled>
                  <Labeled label={c.refills} htmlFor="rx-refills">
                    <input id="rx-refills" type="number" inputMode="numeric" min={0} max={11} value={d.refills} onChange={(e) => set({ refills: e.target.value })} className={cn(inputCls, "tabular-nums")} />
                  </Labeled>
                </div>
                <Labeled label={c.pharmacy} htmlFor="rx-pharmacy">
                  <SelectInput id="rx-pharmacy" value={d.pharmacy} onChange={(v) => set({ pharmacy: v })} options={pharmacyOptions.map((p) => ({ value: p, label: p }))} className="bg-white" />
                </Labeled>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant={warning ? "outline" : "default"} className={cn("h-10 rounded-full px-4 text-caption", warning && "border-red-300 text-red-700 hover:bg-red-50")} onClick={add}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />
                  {warning ? c.addRxAnyway : c.addRx}
                </Button>
                {error && (
                  <p role="alert" className="text-red-700 text-micro">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

/* -------------------------------- Follow-up -------------------------------- */

function FollowUp() {
  const { register, control, formState } = useFormContext<NoteForm>()
  const err = formState.errors.plan?.followUp?.amount?.message
  return (
    <div className="flex flex-col gap-3">
      <SubHead>{c.followUp}</SubHead>
      <div className="grid gap-4 sm:grid-cols-[8rem_9rem_minmax(0,1fr)]">
        <Labeled label={c.followIn} htmlFor="fu-amount" hint={err ? <p className="text-red-700 text-micro">{err}</p> : null}>
          <Controller
            control={control}
            name="plan.followUp.amount"
            render={({ field }) => (
              <input
                id="fu-amount"
                ref={field.ref}
                type="number"
                inputMode="numeric"
                min={1}
                aria-invalid={err ? true : undefined}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                onBlur={field.onBlur}
                className={cn(inputCls, "tabular-nums")}
              />
            )}
          />
        </Labeled>
        <Labeled label={c.followUnit} htmlFor="fu-unit">
          <Controller
            control={control}
            name="plan.followUp.unit"
            render={({ field }) => (
              <SelectInput
                id="fu-unit"
                value={field.value}
                onChange={(v) => field.onChange(v as "days" | "weeks")}
                options={[
                  { value: "days", label: c.days },
                  { value: "weeks", label: c.weeks },
                ]}
              />
            )}
          />
        </Labeled>
        <Labeled label={c.followReason} htmlFor="fu-reason">
          <input id="fu-reason" type="text" placeholder={c.followReasonPlaceholder} className={inputCls} {...register("plan.followUp.reason")} />
        </Labeled>
      </div>
    </div>
  )
}

export function PlanSection({ allergies }: { allergies: string[] }) {
  const { register } = useFormContext<NoteForm>()
  return (
    <div className="flex flex-col gap-6">
      <Labeled label={c.text} htmlFor="note-plan">
        <textarea id="note-plan" rows={4} placeholder={c.textPlaceholder} className={textareaCls} {...register("plan.text")} />
      </Labeled>
      <div className="border-t border-neutral-100 pt-5">
        <Orders />
      </div>
      <div className="border-t border-neutral-100 pt-5">
        <Prescriptions allergies={allergies} />
      </div>
      <div className="border-t border-neutral-100 pt-5">
        <FollowUp />
      </div>
    </div>
  )
}

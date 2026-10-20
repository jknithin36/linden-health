"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { CalendarRemove01Icon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { doctorsCopy } from "@/lib/data/admin-schedule"
import { daysBetween, fmtDate, fmtDateLong, TODAY } from "@/lib/admin/format"
import { addTimeOff, removeTimeOff } from "@/lib/admin/actions"
import type { TimeOff } from "@/lib/admin/types"
import { ConfirmDialog, notify, panel, touchTarget } from "@/components/admin/ui"
import { DateInput, FormActions, FormDialog, FormRow, inputCls } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const schema = z
  .object({
    from: z.string().min(1, "Pick a start date"),
    to: z.string().min(1, "Pick an end date"),
    reason: z.string().trim().min(3, "Add a short reason").max(80, "Keep it under 80 characters"),
  })
  .refine((v) => !v.from || !v.to || v.to >= v.from, { path: ["to"], message: "End date can’t be before the start" })
type Form = z.infer<typeof schema>

function AddTimeOffDialog({ doctorId, open, onOpenChange }: { doctorId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { control, handleSubmit, reset, formState } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { from: "", to: "", reason: "" } })
  React.useEffect(() => {
    if (open) reset({ from: "", to: "", reason: "" })
  }, [open, reset])
  const submit = handleSubmit((v) => {
    notify.success(addTimeOff(doctorId, v), `${fmtDate(v.from)}${v.to !== v.from ? ` – ${fmtDate(v.to)}` : ""} · ${v.reason}`)
    onOpenChange(false)
  })
  const e = formState.errors
  const past = (d: Date) => format(d, "yyyy-MM-dd") < TODAY
  const c = doctorsCopy.detail.timeOff
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={c.add} description={c.dialogText} onSubmit={submit} className="sm:max-w-md" footer={<FormActions onCancel={() => onOpenChange(false)} submit={c.add} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="From" error={e.from?.message} htmlFor="to-from">
          <Controller control={control} name="from" render={({ field, fieldState }) => <DateInput id="to-from" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} disabledDays={past} />} />
        </FormRow>
        <FormRow label="To" error={e.to?.message} htmlFor="to-to">
          <Controller control={control} name="to" render={({ field, fieldState }) => <DateInput id="to-to" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} disabledDays={past} />} />
        </FormRow>
      </div>
      <FormRow label="Reason" error={e.reason?.message} htmlFor="to-reason">
        <Controller control={control} name="reason" render={({ field, fieldState }) => <Input id="to-reason" {...field} autoComplete="off" aria-invalid={!!fieldState.error || undefined} placeholder="e.g. Conference, vacation…" className={inputCls} />} />
      </FormRow>
    </FormDialog>
  )
}

/** Planned leave and time off, with add/remove for admins. */
export function TimeOffList({ doctorId, items, canEdit }: { doctorId: string; items: TimeOff[]; canEdit: boolean }) {
  const [adding, setAdding] = React.useState(false)
  const [removing, setRemoving] = React.useState<TimeOff | null>(null)
  const c = doctorsCopy.detail.timeOff
  const sorted = [...items].sort((a, b) => a.from.localeCompare(b.from))

  const addButton = (
    <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-caption" onClick={() => setAdding(true)} disabled={!canEdit}>
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
      {c.add}
    </Button>
  )

  return (
    <section className={cn(panel, "flex flex-col")} aria-labelledby="timeoff-title">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-5">
        <div>
          <h2 id="timeoff-title" className="text-neutral-950 text-body">
            {c.title}
          </h2>
          <p className="mt-0.5 text-neutral-500 text-caption">{c.text}</p>
        </div>
        {canEdit ? (
          addButton
        ) : (
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-950" />}>{addButton}</TooltipTrigger>
            <TooltipContent>{c.locked}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {sorted.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-6 text-neutral-500 text-caption">
          <HugeiconsIcon icon={CalendarRemove01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-neutral-400" />
          {c.empty}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100">
          {sorted.map((t) => {
            const days = daysBetween(t.from, t.to) + 1
            const current = TODAY >= t.from && TODAY <= t.to
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl tabular-nums text-caption", current ? "bg-amber-50 text-amber-800" : "bg-neutral-100 text-neutral-700")}>{days}d</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-neutral-950 tabular-nums text-caption">
                    {fmtDateLong(t.from)}
                    {t.to !== t.from && ` – ${fmtDateLong(t.to)}`}
                  </span>
                  <span className="block truncate text-neutral-500 text-micro">
                    {t.reason}
                    {current && <span className="text-amber-700"> · In progress</span>}
                  </span>
                </span>
                {t.id !== "leave" && canEdit && (
                  <Button variant="ghost" size="icon" className={cn("size-8 rounded-full text-neutral-500", touchTarget)} aria-label={`Remove time off ${fmtDate(t.from)}`} onClick={() => setRemoving(t)}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <AddTimeOffDialog doctorId={doctorId} open={adding} onOpenChange={setAdding} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove time off?"
        description={removing ? `${fmtDateLong(removing.from)} – ${fmtDateLong(removing.to)} (${removing.reason}) becomes bookable again.` : ""}
        confirmLabel="Remove"
        destructive
        onConfirm={() => removing && notify.success(removeTimeOff(doctorId, removing.id))}
      />
    </section>
  )
}

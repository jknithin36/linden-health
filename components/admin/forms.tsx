"use client"

import * as React from "react"
import { useForm, useWatch, Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { methodLabel } from "@/lib/data/admin-billing"
import { at, dayOf, fmtDateLong, fmtMoney, fmtPhone, fmtTime, parseLocal, TODAY } from "@/lib/admin/format"
import { allDoctors, allPatients, allPlans, blockOn, clinics, getClinicSync, getDoctorSync, getPatientSync, getPlanSync, isLateCancel, openSlots } from "@/lib/admin/queries"
import { cancelAppointment, createAppointment, createPatient, recordPayment, rescheduleAppointment } from "@/lib/admin/actions"
import type { Appointment, ClinicId, Patient, PaymentMethod, VisitType } from "@/lib/admin/types"
import { notify, PatientCell } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/* ------------------------------ Field pieces ------------------------------- */

export const inputCls = "h-10 rounded-xl border-neutral-200 bg-white shadow-none hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 aria-invalid:border-red-500 text-caption"

export function FormRow({ label, error, children, className, htmlFor }: { label: string; error?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <Field data-invalid={error ? true : undefined} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={htmlFor} className="text-neutral-700 text-caption">
        {label}
      </FieldLabel>
      {children}
      {error && <FieldError className="text-micro">{error}</FieldError>}
    </Field>
  )
}

export type Option = { value: string; label: string }

/** `label`: accessible name when there's no visible <label htmlFor={id}>. */
export function SelectInput({ id, value, onChange, options, placeholder = "Choose…", invalid, disabled, className, label }: { id?: string; value: string; onChange: (v: string) => void; options: Option[]; placeholder?: string; invalid?: boolean; disabled?: boolean; className?: string; label?: string }) {
  return (
    <Select items={options} value={value || null} onValueChange={(v) => v !== null && onChange(String(v))} disabled={disabled}>
      <SelectTrigger id={id} aria-label={label} aria-invalid={invalid || undefined} className={cn(inputCls, "w-full justify-between data-[size=default]:h-10", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-72 rounded-xl">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-caption">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DateInput({ id, value, onChange, invalid, disabledDays }: { id?: string; value: string; onChange: (v: string) => void; invalid?: boolean; disabledDays?: (d: Date) => boolean }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} aria-invalid={invalid || undefined} className={cn(inputCls, "flex w-full items-center justify-between gap-2 border px-3 text-left outline-none data-popup-open:border-neutral-950", value ? "text-neutral-950" : "text-neutral-400")}>
        {value ? fmtDateLong(value) : "Pick a date"}
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} className="size-4 text-neutral-500" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-0">
        <Calendar
          mode="single"
          selected={value ? parseLocal(value) : undefined}
          defaultMonth={value ? parseLocal(value) : parseLocal(TODAY)}
          disabled={disabledDays}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function ControlledSelect<T extends FieldValues>({ control, name, options, id, placeholder }: { control: Control<T>; name: Path<T>; options: Option[]; id: string; placeholder?: string }) {
  return <Controller control={control} name={name} render={({ field, fieldState }) => <SelectInput id={id} value={field.value ?? ""} onChange={field.onChange} options={options} invalid={!!fieldState.error} placeholder={placeholder} />} />
}

/**
 * The admin's form dialog: title and description, a padded body, and a footer of actions
 * (usually <FormActions>). `className` sets the width, e.g. "sm:max-w-2xl" (default lg).
 */
export function FormDialog({ open, onOpenChange, title, description, children, footer, onSubmit, className }: { open: boolean; onOpenChange: (o: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode; footer: React.ReactNode; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; className?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90dvh] gap-0 overflow-y-auto overscroll-contain rounded-3xl p-0 sm:max-w-lg", className)}>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader className="gap-1 p-6 pb-2 text-left">
            <DialogTitle className="text-neutral-950 text-title">{title}</DialogTitle>
            {description ? <DialogDescription className="text-neutral-500 text-caption">{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6 py-4">{children}</div>
          <DialogFooter className="gap-2 border-t border-neutral-100 px-6 py-4 sm:justify-end">{footer}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Cancel + submit buttons for a FormDialog footer. */
export function FormActions({ onCancel, submit, destructive, disabled }: { onCancel: () => void; submit: string; destructive?: boolean; disabled?: boolean }) {
  return (
    <>
      <Button type="button" variant="outline" className="h-10 rounded-full px-5 text-caption" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={disabled} className={cn("h-10 rounded-full px-5 text-caption", destructive && "bg-red-600 text-white hover:bg-red-700")}>
        {submit}
      </Button>
    </>
  )
}

/* ------------------------------ Patient picker ----------------------------- */

export function PatientPicker({ value, onChange, invalid, id }: { value: string; onChange: (id: string) => void; invalid?: boolean; id?: string }) {
  const [q, setQ] = React.useState("")
  const results = React.useMemo(() => {
    const n = q.trim().toLowerCase()
    if (n.length < 2) return [] as Patient[]
    return allPatients()
      .filter((p) => p.name.toLowerCase().includes(n) || p.mrn.toLowerCase().includes(n))
      .slice(0, 6)
  }, [q])
  const chosen = value ? getPatientSync(value) : null
  if (chosen)
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2">
        <PatientCell patient={chosen} link={false} />
        <Button type="button" variant="ghost" size="sm" className="rounded-full text-caption" onClick={() => onChange("")}>
          Change
        </Button>
      </div>
    )
  return (
    <div className="relative">
      <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} className="pointer-events-none absolute top-3 left-3 size-4 text-neutral-400" />
      <Input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or MRN…" aria-invalid={invalid || undefined} autoComplete="off" className={cn(inputCls, "pl-9")} />
      {results.length > 0 && (
        <ul role="listbox" aria-label="Matching patients" className="mt-1.5 flex flex-col rounded-xl border border-neutral-200 p-1">
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" role="option" aria-selected={false} onClick={() => onChange(p.id)} className="w-full rounded-lg px-2 py-1.5 text-left outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100">
                <PatientCell patient={p} link={false} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && results.length === 0 && <p className="mt-1.5 text-neutral-500 text-micro">No patients match “{q}”.</p>}
    </div>
  )
}

/* ------------------------------ Open time slots ---------------------------- */

function SlotPicker({ slots, value, onChange, invalid }: { slots: number[]; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  if (!slots.length) return <p className={cn("rounded-xl bg-neutral-50 px-3 py-3 text-neutral-500 text-caption", invalid && "text-red-700")}>No open times this day. Try another date or provider.</p>
  return (
    <div role="radiogroup" aria-label="Time" className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
      {slots.map((t) => {
        const v = String(t)
        const on = value === v
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={cn("h-9 rounded-lg border tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption", on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 text-neutral-800 hover:border-neutral-400")}
          >
            {fmtTime(at(TODAY, t))}
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------- New appointment ----------------------------- */

const visitTypes: Option[] = [
  { value: "sick", label: "Sick visit" },
  { value: "annual", label: "Annual physical" },
  { value: "follow-up", label: "Follow-up" },
  { value: "new-patient", label: "New patient" },
  { value: "specialist", label: "Specialist consult" },
  { value: "vaccine", label: "Vaccine" },
  { value: "lab", label: "Lab work" },
]
export const visitTypeLabel = (v: string) => visitTypes.find((o) => o.value === v)?.label ?? v
export const visitTypeOptions = visitTypes

const apptSchema = z.object({
  patientId: z.string().min(1, "Choose a patient"),
  doctorId: z.string().min(1, "Choose a provider"),
  clinicId: z.string().min(1, "Choose a clinic"),
  day: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  type: z.enum(["in-person", "video"]),
  visitType: z.string().min(1, "Choose a visit type"),
  reason: z.string().trim().min(3, "Add a short reason").max(120),
})
type ApptForm = z.infer<typeof apptSchema>

export function NewAppointmentDialog({ open, onOpenChange, defaults, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; defaults?: Partial<ApptForm>; onCreated?: (id: string) => void }) {
  const form = useForm<ApptForm>({ resolver: zodResolver(apptSchema), defaultValues: { patientId: "", doctorId: "", clinicId: "", day: TODAY, time: "", type: "in-person", visitType: "", reason: "", ...defaults } })
  const { control, handleSubmit, setValue, formState, reset } = form
  React.useEffect(() => {
    if (open) reset({ patientId: "", doctorId: "", clinicId: "", day: TODAY, time: "", type: "in-person", visitType: "", reason: "", ...defaults })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const doctorId = useWatch({ control, name: "doctorId" })
  const day = useWatch({ control, name: "day" })
  const doctor = doctorId ? getDoctorSync(doctorId) : null
  const slots = openSlots(doctorId, day)
  const block = doctor && day ? blockOn(doctor, day) : null
  // A new provider or date clears the picked time and follows that day's clinic.
  React.useEffect(() => {
    if (block) setValue("clinicId", block.clinicId)
  }, [block, setValue])
  const clearTime = () => setValue("time", "")

  const submit = handleSubmit((v) => {
    const { id, message } = createAppointment({
      patientId: v.patientId,
      doctorId: v.doctorId,
      clinicId: v.clinicId as ClinicId,
      start: at(v.day, Number(v.time)),
      durationMin: block?.slotMin ?? 20,
      type: v.type,
      visitType: v.visitType as VisitType,
      reason: v.reason,
      formsDone: false,
      insuranceVerified: !!getPatientSync(v.patientId)?.insurance,
      copay: v.type === "video" ? 15 : doctor?.specialtyId === "family-medicine" || doctor?.specialtyId === "pediatrics" ? 20 : 50,
      source: "phone",
    })
    notify.success(message)
    onOpenChange(false)
    onCreated?.(id)
  })
  const e = formState.errors
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New appointment" description="Book a visit for an existing patient." onSubmit={submit} className="sm:max-w-2xl" footer={<FormActions onCancel={() => onOpenChange(false)} submit="Book appointment" />}>
      <FormRow label="Patient" error={e.patientId?.message} htmlFor="na-patient">
        <Controller control={control} name="patientId" render={({ field, fieldState }) => <PatientPicker id="na-patient" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />} />
      </FormRow>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Provider" error={e.doctorId?.message} htmlFor="na-doctor">
          <Controller
            control={control}
            name="doctorId"
            render={({ field, fieldState }) => (
              <SelectInput
                id="na-doctor"
                value={field.value}
                onChange={(v) => (field.onChange(v), clearTime())}
                invalid={!!fieldState.error}
                options={allDoctors()
                  .filter((d) => d.status === "active")
                  .map((d) => ({ value: d.id, label: `${d.name} · ${d.specialty}` }))}
              />
            )}
          />
        </FormRow>
        <FormRow label="Date" error={e.day?.message} htmlFor="na-day">
          <Controller control={control} name="day" render={({ field }) => <DateInput id="na-day" value={field.value} onChange={(v) => (field.onChange(v), clearTime())} disabledDays={(d) => format(d, "yyyy-MM-dd") < TODAY} />} />
        </FormRow>
      </div>
      <FormRow label={block ? `Time · ${getClinicSync(block.clinicId).short}` : "Time"} error={e.time?.message}>
        {doctorId ? <Controller control={control} name="time" render={({ field, fieldState }) => <SlotPicker slots={slots} value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />} /> : <p className="rounded-xl bg-neutral-50 px-3 py-3 text-neutral-500 text-caption">Choose a provider to see open times.</p>}
      </FormRow>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Visit type" error={e.visitType?.message} htmlFor="na-vt">
          <ControlledSelect control={control} name="visitType" id="na-vt" options={visitTypes} />
        </FormRow>
        <FormRow label="Where">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex h-10 items-center gap-5">
                {(["in-person", "video"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-neutral-800 text-caption">
                    <RadioGroupItem value={t} />
                    {t === "video" ? "Video" : "In person"}
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </FormRow>
      </div>
      <FormRow label="Reason" error={e.reason?.message} htmlFor="na-reason">
        <Controller control={control} name="reason" render={({ field, fieldState }) => <Input id="na-reason" {...field} aria-invalid={!!fieldState.error || undefined} placeholder="e.g. Sore throat for three days…" className={inputCls} />} />
      </FormRow>
    </FormDialog>
  )
}

/* --------------------------- Reschedule / cancel --------------------------- */

const rescheduleSchema = z.object({ doctorId: z.string().min(1), day: z.string().min(1, "Pick a date"), time: z.string().min(1, "Pick a time") })

export function RescheduleDialog({ appointment, open, onOpenChange }: { appointment: Appointment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { control, handleSubmit, setValue, formState } = useForm<z.infer<typeof rescheduleSchema>>({ resolver: zodResolver(rescheduleSchema), defaultValues: { doctorId: appointment.doctorId, day: dayOf(appointment.start) < TODAY ? TODAY : dayOf(appointment.start), time: "" } })
  const doctorId = useWatch({ control, name: "doctorId" })
  const day = useWatch({ control, name: "day" })
  const slots = openSlots(doctorId, day, appointment.id)
  const submit = handleSubmit((v) => {
    notify.success(rescheduleAppointment(appointment.id, at(v.day, Number(v.time)), v.doctorId !== appointment.doctorId ? v.doctorId : undefined), "The patient gets a text and email with the new time.")
    onOpenChange(false)
  })
  const doctors = allDoctors().filter((d) => d.specialtyId === getDoctorSync(appointment.doctorId)?.specialtyId && d.status === "active")
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Reschedule" description={`${getPatientSync(appointment.patientId)?.name} · currently ${fmtDateLong(appointment.start)} at ${fmtTime(appointment.start)}`} onSubmit={submit} footer={<FormActions onCancel={() => onOpenChange(false)} submit="Move appointment" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Provider" htmlFor="rs-doctor">
          <Controller control={control} name="doctorId" render={({ field }) => <SelectInput id="rs-doctor" value={field.value} onChange={(v) => (field.onChange(v), setValue("time", ""))} options={doctors.map((d) => ({ value: d.id, label: d.name }))} />} />
        </FormRow>
        <FormRow label="Date" error={formState.errors.day?.message} htmlFor="rs-day">
          <Controller control={control} name="day" render={({ field }) => <DateInput id="rs-day" value={field.value} onChange={(v) => (field.onChange(v), setValue("time", ""))} disabledDays={(d) => format(d, "yyyy-MM-dd") < TODAY} />} />
        </FormRow>
      </div>
      <FormRow label="New time" error={formState.errors.time?.message}>
        <Controller control={control} name="time" render={({ field, fieldState }) => <SlotPicker slots={slots} value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />} />
      </FormRow>
    </FormDialog>
  )
}

const cancelReasons: Option[] = [
  { value: "Patient request", label: "Patient request" },
  { value: "Feeling better", label: "Feeling better" },
  { value: "Provider unavailable", label: "Provider unavailable" },
  { value: "Insurance issue", label: "Insurance issue" },
  { value: "Booked in error", label: "Booked in error" },
  { value: "Other", label: "Other" },
]
const cancelSchema = z.object({ reason: z.string().min(1, "Choose a reason"), note: z.string().max(200).optional() })

export function CancelDialog({ appointment, open, onOpenChange }: { appointment: Appointment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { control, handleSubmit, formState } = useForm<z.infer<typeof cancelSchema>>({ resolver: zodResolver(cancelSchema), defaultValues: { reason: "", note: "" } })
  const late = isLateCancel(appointment)
  const submit = handleSubmit((v) => {
    notify.success(cancelAppointment(appointment.id, v.note ? `${v.reason}: ${v.note}` : v.reason))
    onOpenChange(false)
  })
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel appointment?"
      description={`${getPatientSync(appointment.patientId)?.name} · ${fmtDateLong(appointment.start)} at ${fmtTime(appointment.start)}${late ? ". Less than 24 hours away, so it counts as a late cancel." : ""}`}
      onSubmit={submit}
      footer={<FormActions onCancel={() => onOpenChange(false)} submit="Cancel appointment" destructive />}
    >
      <FormRow label="Reason" error={formState.errors.reason?.message} htmlFor="cx-reason">
        <ControlledSelect control={control} name="reason" id="cx-reason" options={cancelReasons} />
      </FormRow>
      <FormRow label="Note (optional)" htmlFor="cx-note">
        <Controller control={control} name="note" render={({ field }) => <Textarea id="cx-note" {...field} rows={3} className="rounded-xl border-neutral-200 shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 text-caption" />} />
      </FormRow>
    </FormDialog>
  )
}

/* ------------------------------ Record payment ----------------------------- */

const paySchema = z.object({
  amount: z.string().refine((v) => Number(v) > 0, "Enter an amount above $0"),
  method: z.enum(["card", "hsa", "cash", "check"]),
  last4: z.string().optional(),
})

export function RecordPaymentDialog({ patientId, open, onOpenChange, suggested }: { patientId: string; open: boolean; onOpenChange: (o: boolean) => void; suggested?: number }) {
  const p = getPatientSync(patientId)
  const { control, handleSubmit, formState, reset } = useForm<z.infer<typeof paySchema>>({ resolver: zodResolver(paySchema), defaultValues: { amount: suggested ? suggested.toFixed(2) : "", method: "card", last4: "" } })
  React.useEffect(() => {
    if (open) reset({ amount: suggested ? suggested.toFixed(2) : "", method: "card", last4: "" })
  }, [open, suggested, reset])
  const method = useWatch({ control, name: "method" })
  const submit = handleSubmit((v) => {
    notify.success(recordPayment({ patientId, amount: Math.round(Number(v.amount) * 100) / 100, method: v.method as PaymentMethod, last4: v.last4 || undefined }))
    onOpenChange(false)
  })
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Record a payment" description={p ? `${p.name} · balance ${fmtMoney(p.balance)}` : undefined} onSubmit={submit} footer={<FormActions onCancel={() => onOpenChange(false)} submit="Record payment" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Amount" error={formState.errors.amount?.message} htmlFor="pay-amount">
          <Controller control={control} name="amount" render={({ field, fieldState }) => <Input id="pay-amount" inputMode="decimal" {...field} onChange={(e) => field.onChange(e.target.value.replace(/[^\d.]/g, ""))} aria-invalid={!!fieldState.error || undefined} className={cn(inputCls, "tabular-nums")} />} />
        </FormRow>
        <FormRow label="Method" htmlFor="pay-method">
          <ControlledSelect control={control} name="method" id="pay-method" options={Object.entries(methodLabel).map(([value, label]) => ({ value, label }))} />
        </FormRow>
      </div>
      {(method === "card" || method === "hsa") && (
        <FormRow label="Card last 4 (optional)" htmlFor="pay-last4">
          <Controller control={control} name="last4" render={({ field }) => <Input id="pay-last4" inputMode="numeric" maxLength={4} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "w-28 tabular-nums")} />} />
        </FormRow>
      )}
      <p className="text-neutral-500 text-micro">Demo only. No card is charged.</p>
    </FormDialog>
  )
}

/* ------------------------------- New patient ------------------------------- */

const patientSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  dob: z.string().min(1, "Required"),
  sex: z.enum(["F", "M"]),
  phone: z.string().refine((v) => v.replace(/\D/g, "").length === 10, "Enter a 10-digit phone number"),
  email: z.email("Enter a valid email"),
  address: z.string().trim().min(3, "Required"),
  city: z.string().trim().min(2, "Required"),
  preferredClinicId: z.string().min(1, "Choose a clinic"),
  primaryDoctorId: z.string().min(1, "Choose a provider"),
  planId: z.string(),
  memberId: z.string(),
  allergies: z.string(),
})

export function NewPatientDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: (p: Patient) => void }) {
  const blank = { firstName: "", lastName: "", dob: "", sex: "F" as const, phone: "", email: "", address: "", city: "", preferredClinicId: "", primaryDoctorId: "", planId: "self-pay", memberId: "", allergies: "" }
  const { control, handleSubmit, formState, reset } = useForm<z.infer<typeof patientSchema>>({ resolver: zodResolver(patientSchema), defaultValues: blank })
  React.useEffect(() => {
    if (open) reset(blank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const planId = useWatch({ control, name: "planId" })
  const submit = handleSubmit((v) => {
    const plan = v.planId !== "self-pay" ? getPlanSync(v.planId) : null
    const p = createPatient({
      firstName: v.firstName,
      lastName: v.lastName,
      dob: v.dob,
      sex: v.sex,
      phone: fmtPhone(v.phone),
      email: v.email,
      address: v.address,
      city: v.city,
      preferredClinicId: v.preferredClinicId as ClinicId,
      primaryDoctorId: v.primaryDoctorId,
      insurance: plan ? { planId: plan.id, planType: plan.planTypes[0], memberId: v.memberId || "Pending" } : null,
      allergies: v.allergies.split(",").map((s) => s.trim()).filter(Boolean),
    })
    notify.success(`Added ${p.name}`, `MRN ${p.mrn}`)
    onOpenChange(false)
    onCreated?.(p)
  })
  const e = formState.errors
  const text = (name: "firstName" | "lastName" | "phone" | "email" | "address" | "city" | "memberId" | "allergies", label: string, props?: React.ComponentProps<typeof Input>) => (
    <FormRow label={label} error={e[name]?.message} htmlFor={`np-${name}`}>
      <Controller control={control} name={name} render={({ field, fieldState }) => <Input id={`np-${name}`} {...field} {...props} aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
    </FormRow>
  )
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New patient" description="Creates a chart and an MRN. The patient gets a portal invite by email." onSubmit={submit} className="sm:max-w-2xl" footer={<FormActions onCancel={() => onOpenChange(false)} submit="Add patient" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("firstName", "First name", { autoComplete: "off" })}
        {text("lastName", "Last name", { autoComplete: "off" })}
        <FormRow label="Date of birth" error={e.dob?.message} htmlFor="np-dob">
          <Controller control={control} name="dob" render={({ field, fieldState }) => <DateInput id="np-dob" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} disabledDays={(d) => format(d, "yyyy-MM-dd") > TODAY} />} />
        </FormRow>
        <FormRow label="Sex" htmlFor="np-sex">
          <ControlledSelect control={control} name="sex" id="np-sex" options={[{ value: "F", label: "Female" }, { value: "M", label: "Male" }]} />
        </FormRow>
        {text("phone", "Phone", { type: "tel", inputMode: "tel", autoComplete: "off", placeholder: "(216) 555-0100" })}
        {text("email", "Email", { type: "email", autoComplete: "off", spellCheck: false, placeholder: "name@example.com" })}
        {text("address", "Street address")}
        {text("city", "City")}
        <FormRow label="Preferred clinic" error={e.preferredClinicId?.message} htmlFor="np-clinic">
          <ControlledSelect control={control} name="preferredClinicId" id="np-clinic" options={clinics.map((c) => ({ value: c.id, label: c.name }))} />
        </FormRow>
        <FormRow label="Primary care provider" error={e.primaryDoctorId?.message} htmlFor="np-pcp">
          <ControlledSelect control={control} name="primaryDoctorId" id="np-pcp" options={allDoctors().filter((d) => ["family-medicine", "pediatrics"].includes(d.specialtyId) && d.acceptingNew).map((d) => ({ value: d.id, label: `${d.name} · ${d.specialty}` }))} />
        </FormRow>
        <FormRow label="Insurance" htmlFor="np-plan">
          <ControlledSelect control={control} name="planId" id="np-plan" options={[{ value: "self-pay", label: "Self-pay (no insurance)" }, ...allPlans().filter((p) => p.active).map((p) => ({ value: p.id, label: p.name }))]} />
        </FormRow>
        {planId !== "self-pay" && text("memberId", "Member ID")}
      </div>
      {text("allergies", "Allergies (comma separated)", { placeholder: "e.g. Penicillin, Latex…" })}
    </FormDialog>
  )
}

"use client"

import * as React from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { chartCopy } from "@/lib/data/admin-patients"
import { fmtPhone } from "@/lib/admin/format"
import { allDoctors, allPlans, clinics, getPlanSync } from "@/lib/admin/queries"
import { updatePatient } from "@/lib/admin/actions"
import type { ClinicId, Patient } from "@/lib/admin/types"
import { FormActions, FormDialog, FormRow, inputCls, SelectInput } from "@/components/admin/forms"
import { notify } from "@/components/admin/ui"
import { Input } from "@/components/ui/input"

const schema = z
  .object({
    phone: z.string().refine((v) => v.replace(/\D/g, "").length === 10, "Enter a 10-digit phone number"),
    email: z.email("Enter a valid email"),
    address: z.string().trim().min(3, "Required"),
    city: z.string().trim().min(2, "Required"),
    preferredClinicId: z.string().min(1, "Choose a clinic"),
    primaryDoctorId: z.string().min(1, "Choose a provider"),
    planId: z.string(),
    memberId: z.string().trim(),
    allergies: z.string(),
    conditions: z.string(),
  })
  .refine((v) => v.planId === "self-pay" || v.memberId.length >= 3, { path: ["memberId"], message: "Add the member ID from the card" })
type Form = z.infer<typeof schema>

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

const valuesFor = (p: Patient): Form => ({
  phone: p.phone,
  email: p.email,
  address: p.address,
  city: p.city,
  preferredClinicId: p.preferredClinicId,
  primaryDoctorId: p.primaryDoctorId,
  planId: p.insurance?.planId ?? "self-pay",
  memberId: p.insurance?.memberId ?? "",
  allergies: p.allergies.join(", "),
  conditions: p.conditions.join(", "),
})

export function EditPatientDialog({ patient, open, onOpenChange }: { patient: Patient; open: boolean; onOpenChange: (o: boolean) => void }) {
  const c = chartCopy.edit
  const { control, handleSubmit, formState, reset } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: valuesFor(patient) })
  React.useEffect(() => {
    if (open) reset(valuesFor(patient))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const planId = useWatch({ control, name: "planId" })
  const e = formState.errors

  const submit = handleSubmit((v) => {
    const plan = v.planId !== "self-pay" ? getPlanSync(v.planId) : null
    const samePlan = plan && patient.insurance?.planId === plan.id
    notify.success(
      updatePatient(patient.id, {
        phone: fmtPhone(v.phone),
        email: v.email,
        address: v.address,
        city: v.city,
        preferredClinicId: v.preferredClinicId as ClinicId,
        primaryDoctorId: v.primaryDoctorId,
        insurance: plan ? { planId: plan.id, planType: samePlan ? patient.insurance!.planType : plan.planTypes[0], memberId: v.memberId } : null,
        allergies: list(v.allergies),
        conditions: list(v.conditions),
      })
    )
    onOpenChange(false)
  })

  const text = (name: "phone" | "email" | "address" | "city" | "memberId" | "allergies" | "conditions", label: string, props?: React.ComponentProps<typeof Input>) => (
    <FormRow label={label} error={e[name]?.message} htmlFor={`ep-${name}`}>
      <Controller control={control} name={name} render={({ field, fieldState }) => <Input id={`ep-${name}`} {...field} {...props} aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
    </FormRow>
  )
  const select = (name: "preferredClinicId" | "primaryDoctorId" | "planId", label: string, options: { value: string; label: string }[]) => (
    <FormRow label={label} error={e[name]?.message} htmlFor={`ep-${name}`}>
      <Controller control={control} name={name} render={({ field, fieldState }) => <SelectInput id={`ep-${name}`} value={field.value} onChange={field.onChange} options={options} invalid={!!fieldState.error} />} />
    </FormRow>
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${c.title} · ${patient.name}`}
      description={c.description}
      onSubmit={submit}
      className="sm:max-w-2xl"
      footer={<FormActions onCancel={() => onOpenChange(false)} submit={c.save} disabled={formState.isSubmitting} />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {text("phone", "Phone", { type: "tel", inputMode: "tel", autoComplete: "off" })}
        {text("email", "Email", { type: "email", autoComplete: "off", spellCheck: false })}
        {text("address", "Street address")}
        {text("city", "City")}
        {select(
          "preferredClinicId",
          "Preferred clinic",
          clinics.map((x) => ({ value: x.id, label: x.name }))
        )}
        {select(
          "primaryDoctorId",
          "Primary care provider",
          allDoctors()
            .filter((d) => ["family-medicine", "pediatrics"].includes(d.specialtyId) || d.id === patient.primaryDoctorId)
            .map((d) => ({ value: d.id, label: `${d.name} · ${d.specialty}` }))
        )}
        {select("planId", "Insurance", [{ value: "self-pay", label: "Self-pay (no insurance)" }, ...allPlans().map((p) => ({ value: p.id, label: p.name }))])}
        {planId !== "self-pay" && text("memberId", "Member ID", { autoComplete: "off" })}
      </div>
      {text("allergies", "Allergies (comma separated)", { placeholder: "e.g. Penicillin, Latex…" })}
      {text("conditions", c.conditions, { placeholder: "e.g. Asthma, High blood pressure…" })}
    </FormDialog>
  )
}

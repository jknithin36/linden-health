"use client"

import * as React from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { queueCopy } from "@/lib/data/admin-queue"
import { at, fmtPhone, minutesOfDay, TODAY } from "@/lib/admin/format"
import { allDoctors, blockOn, getClinicSync, getPatientSync } from "@/lib/admin/queries"
import { createAppointment, createPatient } from "@/lib/admin/actions"
import type { ClinicId } from "@/lib/admin/types"
import { FormActions, FormDialog, FormRow, inputCls, PatientPicker, SelectInput } from "@/components/admin/forms"
import { notify } from "@/components/admin/ui"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const schema = z
  .object({
    mode: z.enum(["existing", "new"]),
    patientId: z.string(),
    firstName: z.string().trim().max(40),
    lastName: z.string().trim().max(40),
    dob: z.string(),
    sex: z.string(),
    phone: z.string().trim(),
    reason: z.string().trim().min(3, "Add a short reason").max(120),
    doctorId: z.string().min(1, "Choose a provider"),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "existing") {
      if (!v.patientId) ctx.addIssue({ code: "custom", path: ["patientId"], message: "Choose a patient" })
      return
    }
    if (!v.firstName) ctx.addIssue({ code: "custom", path: ["firstName"], message: "Add a first name" })
    if (!v.lastName) ctx.addIssue({ code: "custom", path: ["lastName"], message: "Add a last name" })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.dob) || v.dob > TODAY || v.dob < "1900-01-01") ctx.addIssue({ code: "custom", path: ["dob"], message: "Enter a valid date of birth" })
    if (!v.sex) ctx.addIssue({ code: "custom", path: ["sex"], message: "Choose one" })
    if (v.phone.replace(/\D/g, "").length !== 10) ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a 10-digit phone number" })
  })
type Form = z.infer<typeof schema>

const blank: Form = { mode: "existing", patientId: "", firstName: "", lastName: "", dob: "", sex: "", phone: "", reason: "", doctorId: "" }

export function WalkInDialog({ open, onOpenChange, clinic, now, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; clinic: ClinicId; now: string; onAdded: (id: string) => void }) {
  const { control, handleSubmit, reset, formState, setValue } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: blank })
  React.useEffect(() => {
    if (open) reset(blank)
  }, [open, reset])
  const mode = useWatch({ control, name: "mode" })
  const doctors = React.useMemo(() => allDoctors().filter((d) => d.status === "active" && blockOn(d, TODAY)?.clinicId === clinic), [clinic])
  const e = formState.errors

  const submit = handleSubmit((v) => {
    const start = at(TODAY, Math.round(minutesOfDay(now) / 5) * 5)
    let patientId = v.patientId
    if (v.mode === "new") {
      const p = createPatient({
        firstName: v.firstName,
        lastName: v.lastName,
        dob: v.dob,
        sex: v.sex as "F" | "M",
        phone: fmtPhone(v.phone),
        email: "",
        address: "",
        city: getClinicSync(clinic).short,
        preferredClinicId: clinic,
        primaryDoctorId: v.doctorId,
        insurance: null,
        allergies: [],
      })
      patientId = p.id
    }
    const { id } = createAppointment({
      patientId,
      doctorId: v.doctorId,
      clinicId: clinic,
      start,
      durationMin: 20,
      type: "in-person",
      visitType: "sick",
      reason: v.reason,
      formsDone: false,
      insuranceVerified: v.mode === "existing" && !!getPatientSync(patientId)?.insurance,
      copay: 20,
      source: "walk-in",
      status: "arrived",
      arrivedAt: start,
    })
    notify.success(`Added ${getPatientSync(patientId)?.name ?? "walk-in"} to the queue`, `${getClinicSync(clinic).short} · Arrived`)
    onOpenChange(false)
    onAdded(id)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={queueCopy.walkIn.title}
      description={queueCopy.walkIn.description(getClinicSync(clinic).short)}
      onSubmit={submit}
      footer={<FormActions onCancel={() => onOpenChange(false)} submit={queueCopy.walkIn.submit} disabled={formState.isSubmitting} />}
    >
      <Tabs value={mode} onValueChange={(m) => setValue("mode", m as Form["mode"], { shouldValidate: formState.isSubmitted })}>
        <TabsList className="h-10 w-full bg-neutral-100">
          <TabsTrigger value="existing" className="h-full flex-1 rounded-full text-caption">
            {queueCopy.walkIn.existing}
          </TabsTrigger>
          <TabsTrigger value="new" className="h-full flex-1 rounded-full text-caption">
            {queueCopy.walkIn.create}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "existing" ? (
        <FormRow label="Patient" error={e.patientId?.message} htmlFor="wi-patient">
          <Controller control={control} name="patientId" render={({ field, fieldState }) => <PatientPicker id="wi-patient" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />} />
        </FormRow>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="First name" error={e.firstName?.message} htmlFor="wi-first">
              <Controller control={control} name="firstName" render={({ field, fieldState }) => <Input id="wi-first" {...field} autoComplete="off" aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
            </FormRow>
            <FormRow label="Last name" error={e.lastName?.message} htmlFor="wi-last">
              <Controller control={control} name="lastName" render={({ field, fieldState }) => <Input id="wi-last" {...field} autoComplete="off" aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
            </FormRow>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem_1fr]">
            <FormRow label="Date of birth" error={e.dob?.message} htmlFor="wi-dob">
              <Controller control={control} name="dob" render={({ field, fieldState }) => <Input id="wi-dob" type="date" max={TODAY} {...field} aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
            </FormRow>
            <FormRow label="Sex" error={e.sex?.message} htmlFor="wi-sex">
              <Controller control={control} name="sex" render={({ field, fieldState }) => <SelectInput id="wi-sex" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} options={[{ value: "F", label: "Female" }, { value: "M", label: "Male" }]} />} />
            </FormRow>
            <FormRow label="Phone" error={e.phone?.message} htmlFor="wi-phone">
              <Controller control={control} name="phone" render={({ field, fieldState }) => <Input id="wi-phone" type="tel" inputMode="tel" placeholder="(216) 555-0100" {...field} aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
            </FormRow>
          </div>
        </>
      )}

      <FormRow label="Reason for visit" error={e.reason?.message} htmlFor="wi-reason">
        <Controller control={control} name="reason" render={({ field, fieldState }) => <Input id="wi-reason" {...field} autoComplete="off" placeholder={queueCopy.walkIn.reasonPlaceholder} aria-invalid={!!fieldState.error || undefined} className={inputCls} />} />
      </FormRow>
      <FormRow label="Provider working today" error={e.doctorId?.message} htmlFor="wi-doctor">
        {doctors.length ? (
          <Controller control={control} name="doctorId" render={({ field, fieldState }) => <SelectInput id="wi-doctor" value={field.value} onChange={field.onChange} invalid={!!fieldState.error} options={doctors.map((d) => ({ value: d.id, label: `${d.name} · ${d.specialty}` }))} />} />
        ) : (
          <p className="rounded-xl bg-neutral-50 px-3 py-3 text-neutral-500 text-caption">{queueCopy.walkIn.noDoctors}</p>
        )}
      </FormRow>
    </FormDialog>
  )
}

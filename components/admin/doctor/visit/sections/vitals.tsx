"use client"

import * as React from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { bmiOf, vitalFlags } from "@/lib/admin/clinical"
import type { NoteForm, VitalKey } from "@/components/admin/doctor/visit/schema"
import { inputCls } from "@/components/admin/doctor/visit/sections/section-card"

const c = visitCopy.vitals
type Flag = { label: string; tone: "amber" | "red" }

/** Out-of-range label: text + icon + tone, never color alone. */
export function FlagLabel({ flag, id, className }: { flag: Flag; id?: string; className?: string }) {
  return (
    <span id={id} className={cn("inline-flex min-h-6 w-fit items-center gap-1 rounded-full px-2 py-0.5 text-micro", flag.tone === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800", className)}>
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
      {flag.label}
    </span>
  )
}

function NumberInput({ name, id, unit, step = 1, label, describedBy }: { name: VitalKey; id: string; unit: string; step?: number; label?: string; describedBy?: string }) {
  const { control } = useFormContext<NoteForm>()
  return (
    <Controller
      control={control}
      name={`vitals.${name}`}
      render={({ field, fieldState }) => (
        <div className="relative">
          <input
            id={id}
            ref={field.ref}
            type="number"
            inputMode="decimal"
            step={step}
            aria-label={label}
            aria-invalid={fieldState.error ? true : undefined}
            aria-describedby={[describedBy, fieldState.error ? `${id}-err` : undefined].filter(Boolean).join(" ") || undefined}
            value={field.value ?? ""}
            onChange={(e) => {
              const v = e.target.value
              field.onChange(v === "" ? null : Number(v))
            }}
            onBlur={field.onBlur}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className={cn(inputCls, "tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", unit && "pr-14")}
          />
          {unit && (
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 text-micro">
              {unit}
            </span>
          )}
        </div>
      )}
    />
  )
}

function ErrorText({ name, id }: { name: VitalKey; id: string }) {
  const { formState } = useFormContext<NoteForm>()
  const err = formState.errors.vitals?.[name]?.message
  return err ? (
    <p id={`${id}-err`} className="text-red-700 text-micro">
      {err}
    </p>
  ) : null
}

function VitalField({ name, label, unit, step, flag, className }: { name: VitalKey; label: string; unit: string; step?: number; flag?: Flag; className?: string }) {
  const id = `vital-${name}`
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-neutral-700 text-caption">
        {label}
      </label>
      <NumberInput name={name} id={id} unit={unit} step={step} describedBy={flag ? `${id}-flag` : undefined} />
      {flag && <FlagLabel flag={flag} id={`${id}-flag`} />}
      <ErrorText name={name} id={id} />
    </div>
  )
}

export function VitalsSection({ age }: { age: number }) {
  const { control } = useFormContext<NoteForm>()
  const v = useWatch({ control, name: "vitals" })
  const bmi = bmiOf(v.weightLb, v.heightIn)
  const flags = vitalFlags({ ...v, bmi }, age)
  const bpFlag = flags.bpSystolic

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
      <fieldset className="col-span-2 flex min-w-0 flex-col gap-1.5">
        <legend className="mb-1.5 text-neutral-700 text-caption">{c.bp}</legend>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <NumberInput name="bpSystolic" id="vital-bpSystolic" unit="" label={`${c.systolic} (mmHg)`} describedBy={bpFlag ? "vital-bp-flag" : undefined} />
          </div>
          <span aria-hidden="true" className="text-neutral-400 text-body">
            /
          </span>
          <div className="min-w-0 flex-1">
            <NumberInput name="bpDiastolic" id="vital-bpDiastolic" unit="" label={`${c.diastolic} (mmHg)`} describedBy={bpFlag ? "vital-bp-flag" : undefined} />
          </div>
          <span className="shrink-0 text-neutral-400 text-micro">mmHg</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral-400 text-micro">
            {c.systolic} / {c.diastolic}
          </span>
          {bpFlag && <FlagLabel flag={bpFlag} id="vital-bp-flag" />}
        </div>
        <ErrorText name="bpSystolic" id="vital-bpSystolic" />
        <ErrorText name="bpDiastolic" id="vital-bpDiastolic" />
      </fieldset>
      <VitalField name="heartRate" label={c.heartRate} unit="bpm" flag={flags.heartRate} />
      <VitalField name="tempF" label={c.tempF} unit="°F" step={0.1} flag={flags.tempF} />
      <VitalField name="respRate" label={c.respRate} unit="/min" flag={flags.respRate} />
      <VitalField name="spo2" label={c.spo2} unit="%" flag={flags.spo2} />
      <VitalField name="weightLb" label={c.weightLb} unit="lb" step={0.1} />
      <VitalField name="heightIn" label={c.heightIn} unit="in" step={0.5} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span id="vital-bmi-label" className="text-neutral-700 text-caption">
          {c.bmi}
        </span>
        <output aria-labelledby="vital-bmi-label" className={cn(inputCls, "flex items-center justify-between bg-neutral-50 tabular-nums hover:border-neutral-200")}>
          <span>{bmi ?? "—"}</span>
          <span className="text-neutral-400 text-micro">kg/m²</span>
        </output>
        {flags.bmi ? <FlagLabel flag={flags.bmi} /> : <span className="text-neutral-400 text-micro">{c.bmiHint}</span>}
      </div>
      <VitalField name="painScore" label={c.pain} unit="/ 10" />
    </div>
  )
}

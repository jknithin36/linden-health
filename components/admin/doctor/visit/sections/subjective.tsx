"use client"

import { Controller, useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { symptomOptions } from "@/lib/admin/clinical"
import type { NoteForm } from "@/components/admin/doctor/visit/schema"
import { inputCls, Labeled, textareaCls } from "@/components/admin/doctor/visit/sections/section-card"

const c = visitCopy.subjective

export function SubjectiveSection() {
  const { register, control, formState } = useFormContext<NoteForm>()
  const ccErr = formState.errors.subjective?.chiefComplaint?.message
  return (
    <div className="flex flex-col gap-5">
      <Labeled label={c.cc} htmlFor="note-cc" hint={ccErr ? <p className="text-red-700 text-micro">{ccErr}</p> : null}>
        <input id="note-cc" type="text" autoComplete="off" placeholder={c.ccPlaceholder} aria-required="true" aria-invalid={ccErr ? true : undefined} className={inputCls} {...register("subjective.chiefComplaint")} />
      </Labeled>
      <Labeled label={c.hpi} htmlFor="note-hpi">
        <textarea id="note-hpi" rows={4} placeholder={c.hpiPlaceholder} className={textareaCls} {...register("subjective.historyOfPresentIllness")} />
      </Labeled>
      <Controller
        control={control}
        name="subjective.symptoms"
        render={({ field }) => (
          <div role="group" aria-labelledby="note-symptoms-label" className="flex flex-col gap-2">
            <span id="note-symptoms-label" className="text-neutral-700 text-caption">
              {c.symptoms}
              {field.value.length > 0 && <span className="text-neutral-400"> · {field.value.length} selected</span>}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {symptomOptions.map((s) => {
                const on = field.value.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => field.onChange(on ? field.value.filter((x) => x !== s) : [...field.value, s])}
                    className={cn(
                      "h-8 rounded-full border px-3 text-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 motion-reduce:transition-none",
                      on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      />
    </div>
  )
}

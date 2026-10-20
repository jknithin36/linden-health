"use client"

import { useFormContext } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { visitCopy } from "@/lib/data/admin-visit"
import { examTemplates } from "@/lib/admin/clinical"
import type { NoteForm } from "@/components/admin/doctor/visit/schema"
import { Labeled, textareaCls } from "@/components/admin/doctor/visit/sections/section-card"
import { Button } from "@/components/ui/button"

const c = visitCopy.objective

export function ObjectiveSection() {
  const { register, getValues, setValue, setFocus } = useFormContext<NoteForm>()
  const insert = (text: string) => {
    const cur = getValues("objective.exam").trimEnd()
    setValue("objective.exam", cur ? `${cur}\n${text}` : text, { shouldDirty: true, shouldValidate: true })
    setFocus("objective.exam")
  }
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-labelledby="note-templates-label" className="flex flex-col gap-2">
        <span id="note-templates-label" className="text-neutral-700 text-caption">
          {c.templates}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {examTemplates.map((t) => (
            <Button key={t.id} type="button" variant="outline" size="sm" className="rounded-full px-3 text-caption" onClick={() => insert(t.text)} aria-label={`Insert normal ${t.label} exam`}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />
              {t.label}
            </Button>
          ))}
        </div>
      </div>
      <Labeled label={c.exam} htmlFor="note-exam">
        <textarea id="note-exam" rows={6} placeholder={c.placeholder} className={textareaCls} {...register("objective.exam")} />
      </Labeled>
    </div>
  )
}

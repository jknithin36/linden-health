"use client"

import { useFormContext } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

import { visitCopy } from "@/lib/data/admin-visit"
import type { NoteForm } from "@/components/admin/doctor/visit/schema"
import { Labeled, textareaCls } from "@/components/admin/doctor/visit/sections/section-card"

const c = visitCopy.instructions

export function InstructionsSection() {
  const { register } = useFormContext<NoteForm>()
  return (
    <Labeled
      label={c.label}
      htmlFor="note-instructions"
      hint={
        <p id="note-instructions-hint" className="flex items-center gap-1.5 text-neutral-500 text-micro">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
          {c.note}
        </p>
      }
    >
      <textarea id="note-instructions" rows={5} placeholder={c.placeholder} aria-describedby="note-instructions-hint" className={textareaCls} {...register("patientInstructions")} />
    </Labeled>
  )
}

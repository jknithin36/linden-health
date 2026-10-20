"use client"

import { Controller, useFormContext } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

import { visitCopy } from "@/lib/data/admin-visit"
import { diagnosisCatalog } from "@/lib/admin/clinical"
import type { Diagnosis } from "@/lib/admin/types"
import type { NoteForm } from "@/components/admin/doctor/visit/schema"
import { SearchCombobox } from "@/components/admin/doctor/visit/sections/search-combobox"

const c = visitCopy.assessment
const dxText = (d: Diagnosis) => `${d.code} · ${d.label}`
const matches = (d: Diagnosis, q: string) => d.code.toLowerCase().includes(q) || d.code.toLowerCase().replace(".", "").includes(q.replace(".", "")) || d.label.toLowerCase().includes(q)

export function AssessmentSection() {
  const { control } = useFormContext<NoteForm>()
  return (
    <Controller
      control={control}
      name="assessment.diagnoses"
      render={({ field }) => {
        const has = (d: Diagnosis) => field.value.some((x) => x.code === d.code)
        const toggle = (d: Diagnosis) => field.onChange(has(d) ? field.value.filter((x) => x.code !== d.code) : [...field.value, d])
        return (
          <div className="flex flex-col gap-3">
            <label htmlFor="note-dx" className="text-neutral-700 text-caption">
              {c.label}
            </label>
            <SearchCombobox
              id="note-dx"
              label={c.search}
              placeholder={c.placeholder}
              emptyText={c.empty}
              items={diagnosisCatalog}
              filter={matches}
              getKey={(d) => d.code}
              isSelected={has}
              onSelect={toggle}
              renderItem={(d) => (
                <span className="flex items-baseline gap-2">
                  <span className="w-16 shrink-0 text-neutral-500 tabular-nums text-micro">{d.code}</span>
                  <span>{d.label}</span>
                </span>
              )}
            />
            {field.value.length ? (
              <ul aria-label="Selected diagnoses" className="flex flex-wrap gap-1.5">
                {field.value.map((d) => (
                  <li key={d.code} className="inline-flex h-8 items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 pr-1 pl-3 text-neutral-900 text-caption">
                    <span className="tabular-nums">{dxText(d)}</span>
                    <button
                      type="button"
                      aria-label={c.remove(dxText(d))}
                      onClick={() => field.onChange(field.value.filter((x) => x.code !== d.code))}
                      className="grid size-6 place-items-center rounded-full text-neutral-500 outline-none hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-caption">{c.none}</p>
            )}
          </div>
        )
      }}
    />
  )
}

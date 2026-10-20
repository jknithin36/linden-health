"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SquareLock02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { doctorsCopy } from "@/lib/data/admin-schedule"
import { fmtClock, weekdayNames as dayName, weekOrder as order } from "@/lib/admin/format"
import { clinics, slotsInBlock } from "@/lib/admin/queries"
import { setDoctorHours } from "@/lib/admin/actions"
import type { ClinicId, Doctor, WorkBlock } from "@/lib/admin/types"
import { notify, panel } from "@/components/admin/ui"
import { SelectInput } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const times = Array.from({ length: (21 - 6) * 4 + 1 }, (_, i) => 6 * 60 + i * 15)
const timeOptions = times.map((t) => ({ value: String(t), label: fmtClock(t) }))
const lunchStartOptions = [{ value: "none", label: "No lunch" }, ...timeOptions]

/** `slotMin` carries a block's own visit length (Dr. Chen's 30-minute Mondays) through an edit. */
type Row = { on: boolean; clinicId: ClinicId; start: number; end: number; lunch: [number, number] | null; slotMin?: number }

const toRows = (d: Doctor): Row[] =>
  d.workingHours.map((b) => (b ? { on: true, clinicId: b.clinicId, start: b.start, end: b.end, lunch: b.lunch ?? null, ...(b.slotMin ? { slotMin: b.slotMin } : {}) } : { on: false, clinicId: d.clinicIds[0], start: 8 * 60, end: 17 * 60, lunch: [12 * 60, 13 * 60] }))

const toBlock = (r: Row): WorkBlock => ({ clinicId: r.clinicId, start: r.start, end: r.end, ...(r.lunch ? { lunch: r.lunch } : {}), ...(r.slotMin ? { slotMin: r.slotMin } : {}) })

function rowError(r: Row) {
  if (!r.on) return null
  if (r.end <= r.start) return "End must be after start."
  if (r.lunch && (r.lunch[1] <= r.lunch[0] || r.lunch[0] < r.start || r.lunch[1] > r.end)) return "Lunch must fit inside working hours."
  return null
}

/** Weekly hours: per weekday, working or off, clinic, start/end and lunch. Admins only. */
export function HoursEditor({ doctor, canEdit }: { doctor: Doctor; canEdit: boolean }) {
  const source = JSON.stringify(doctor.workingHours)
  const [rows, setRows] = React.useState<Row[]>(() => toRows(doctor))
  const [base, setBase] = React.useState(source)
  if (base !== source) {
    setBase(source)
    setRows(toRows(doctor))
  }
  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const errors = rows.map(rowError)
  const dirty = JSON.stringify(rows) !== JSON.stringify(toRows(doctor))
  const weekly = rows.reduce((s, r) => s + (r.on && !rowError(r) ? slotsInBlock(toBlock(r)).length : 0), 0)
  const c = doctorsCopy.detail.hours

  const save = () => {
    if (errors.some(Boolean)) return notify.error("Check the highlighted days", "Some hours don’t add up.")
    const hours: (WorkBlock | null)[] = rows.map((r) => (r.on ? toBlock(r) : null))
    notify.success(setDoctorHours(doctor.id, hours), `${doctor.name} · ${weekly} bookable slots a week`)
  }

  const saveButton = (
    <Button className="h-10 rounded-full px-4 text-caption" onClick={save} disabled={!canEdit || !dirty}>
      {c.save}
    </Button>
  )

  return (
    <section className={cn(panel, "flex flex-col")} aria-labelledby="hours-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 p-5">
        <div className="min-w-0">
          <h2 id="hours-title" className="text-neutral-950 text-body">
            {c.title}
          </h2>
          <p className="mt-0.5 max-w-lg text-pretty text-neutral-500 text-caption">{c.text}</p>
        </div>
        <span className="text-neutral-500 tabular-nums text-caption">{weekly} slots / week</span>
      </div>

      <div className="hidden grid-cols-[8rem_1fr_1fr_1fr_1fr_1fr] gap-3 border-b border-neutral-100 px-5 py-2 text-neutral-400 text-micro lg:grid">
        <span>Day</span>
        <span>Clinic</span>
        <span>Start</span>
        <span>End</span>
        <span>Lunch from</span>
        <span>Lunch to</span>
      </div>

      <ul className="flex flex-col divide-y divide-neutral-100">
        {order.map((i) => {
          const r = rows[i]
          const err = errors[i]
          const disabled = !canEdit || !r.on
          return (
            <li key={i} className="px-5 py-3">
              <div className="grid grid-cols-2 items-center gap-3 lg:grid-cols-[8rem_1fr_1fr_1fr_1fr_1fr]">
                <label className="col-span-2 flex items-center gap-2.5 text-neutral-950 text-caption lg:col-span-1">
                  <Switch checked={r.on} onCheckedChange={(v) => update(i, { on: v })} disabled={!canEdit} aria-label={`${dayName[i]} working`} />
                  <span className="min-w-0">
                    {dayName[i]}
                    {!r.on && <span className="ml-1.5 text-neutral-400">Off</span>}
                  </span>
                </label>
                {r.on ? (
                  <>
                    <div className="col-span-2 lg:col-span-1">
                      <SelectInput label={`${dayName[i]} clinic`} value={r.clinicId} onChange={(v) => update(i, { clinicId: v as ClinicId })} options={clinics.map((x) => ({ value: x.id, label: x.short }))} disabled={disabled} />
                    </div>
                    <SelectInput label={`${dayName[i]} start`} value={String(r.start)} onChange={(v) => update(i, { start: Number(v) })} options={timeOptions} disabled={disabled} invalid={!!err && r.end <= r.start} />
                    <SelectInput label={`${dayName[i]} end`} value={String(r.end)} onChange={(v) => update(i, { end: Number(v) })} options={timeOptions} disabled={disabled} invalid={!!err && r.end <= r.start} />
                    <SelectInput label={`${dayName[i]} lunch from`} value={r.lunch ? String(r.lunch[0]) : "none"} onChange={(v) => update(i, { lunch: v === "none" ? null : [Number(v), r.lunch?.[1] ?? Number(v) + 60] })} options={lunchStartOptions} disabled={disabled} invalid={!!err && !!r.lunch} />
                    <SelectInput label={`${dayName[i]} lunch to`} value={r.lunch ? String(r.lunch[1]) : ""} placeholder="—" onChange={(v) => r.lunch && update(i, { lunch: [r.lunch[0], Number(v)] })} options={timeOptions} disabled={disabled || !r.lunch} invalid={!!err && !!r.lunch} />
                  </>
                ) : (
                  <p className="col-span-2 text-neutral-400 text-caption lg:col-span-5">Not working</p>
                )}
              </div>
              {err && (
                <p role="alert" className="mt-1.5 text-red-700 text-micro lg:pl-[8.75rem]">
                  {err}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100 p-4">
        {!canEdit && (
          <span className="mr-auto inline-flex items-center gap-1.5 text-neutral-500 text-caption">
            <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={1.8} aria-hidden="true" className="size-4" />
            View only
          </span>
        )}
        <Button variant="outline" className="h-10 rounded-full px-4 text-caption" onClick={() => setRows(toRows(doctor))} disabled={!canEdit || !dirty}>
          {c.reset}
        </Button>
        {canEdit ? (
          saveButton
        ) : (
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-950" />}>{saveButton}</TooltipTrigger>
            <TooltipContent>{c.locked}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </section>
  )
}

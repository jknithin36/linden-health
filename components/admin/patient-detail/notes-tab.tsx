"use client"

import * as React from "react"
import { NoteIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import { vitalFlags } from "@/lib/admin/clinical"
import { ageOn, fmtDateLong, fmtDateTime } from "@/lib/admin/format"
import { getDoctorSync } from "@/lib/admin/queries"
import type { Appointment, NoteVitals, Patient, VisitNote } from "@/lib/admin/types"
import { DataTable, Pagination, type Col } from "@/components/admin/data-table"
import { DetailSheet, DoctorCell, EmptyState, TimeCell } from "@/components/admin/ui"
import { visitTypeLabel } from "@/components/admin/forms"

const c = doctorChartCopy.notes
const v = doctorChartCopy.vitals

type SignedNote = { appointment: Appointment; note: VisitNote }

const orderType = { lab: "Lab", imaging: "Imaging", referral: "Referral", vaccine: "Vaccine" } as const

/** "J06.9 · Upper respiratory infection" chips; plain text for screen readers too. */
function DiagnosisChips({ note, max }: { note: VisitNote; max?: number }) {
  const list = note.assessment.diagnoses
  if (!list.length) return <span className="text-neutral-400">{c.none}</span>
  const shown = max ? list.slice(0, max) : list
  const rest = list.length - shown.length
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((d) => (
        <span key={d.code} className="inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-neutral-100 px-2.5 text-neutral-700 text-micro">
          <span className="tabular-nums text-neutral-950">{d.code}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{d.label}</span>
        </span>
      ))}
      {rest > 0 && <span className="inline-flex h-6 items-center rounded-full bg-neutral-100 px-2 text-neutral-600 tabular-nums text-micro">+{rest}</span>}
    </span>
  )
}

export function NotesTab({ notes, patient }: { notes: SignedNote[]; patient: Patient }) {
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>({ id: "date", desc: true })
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const dir = sort?.desc === false ? 1 : -1
  const sorted = [...notes].sort((a, b) => (a.appointment.start < b.appointment.start ? -dir : a.appointment.start > b.appointment.start ? dir : 0))
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const p = Math.min(page, pageCount)
  const shown = sorted.slice((p - 1) * pageSize, p * pageSize)
  const selected = notes.find((n) => n.appointment.id === openId) ?? null

  const columns = React.useMemo<Col<SignedNote>[]>(
    () => [
      { id: "date", header: c.columns.date, meta: { label: c.columns.date }, enableHiding: false, cell: ({ row }) => <TimeCell value={row.original.appointment.start} video={row.original.appointment.type === "video"} /> },
      {
        id: "visit",
        header: c.columns.visit,
        enableSorting: false,
        meta: { label: c.columns.visit, className: "min-w-44" },
        cell: ({ row }) => (
          <span className="block max-w-60">
            <span className="block truncate text-neutral-950">{visitTypeLabel(row.original.appointment.visitType)}</span>
            <span className="block truncate text-neutral-500 text-micro">{row.original.note.subjective.chiefComplaint || row.original.appointment.reason}</span>
          </span>
        ),
      },
      { id: "diagnoses", header: c.columns.diagnoses, enableSorting: false, meta: { label: c.columns.diagnoses, className: "min-w-64" }, cell: ({ row }) => <DiagnosisChips note={row.original.note} max={2} /> },
      { id: "doctor", header: c.columns.doctor, enableSorting: false, meta: { label: c.columns.doctor, className: "min-w-44" }, cell: ({ row }) => <DoctorCell id={row.original.note.doctorId} /> },
    ],
    []
  )

  return (
    <>
      <DataTable
        id="patient-notes"
        label={doctorChartCopy.tab.label}
        columns={columns}
        rows={shown}
        getRowId={(n) => n.appointment.id}
        sort={sort}
        onSortChange={(s) => (setSort(s), setPage(1))}
        onRowClick={(n) => setOpenId(n.appointment.id)}
        rowLabel={(n) => `Visit note, ${fmtDateLong(n.appointment.start)}, ${visitTypeLabel(n.appointment.visitType)}`}
        mobileCard={(n) => (
          <span className="flex flex-col gap-2">
            <span className="flex items-start justify-between gap-3">
              <TimeCell value={n.appointment.start} video={n.appointment.type === "video"} />
              <span className="text-neutral-500 text-micro">{getDoctorSync(n.note.doctorId)?.name}</span>
            </span>
            <span className="text-neutral-950 text-caption">{visitTypeLabel(n.appointment.visitType)}</span>
            <DiagnosisChips note={n.note} max={2} />
          </span>
        )}
        empty={<EmptyState icon={NoteIcon} title={c.empty.title} text={c.empty.text} />}
        footer={sorted.length > 0 ? <Pagination page={p} pageCount={pageCount} pageSize={pageSize} total={sorted.length} onPage={setPage} onPageSize={(n) => (setPageSize(n), setPage(1))} /> : null}
      />
      <NoteSheet item={selected} patient={patient} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  )
}

/* --------------------------------- Detail ---------------------------------- */

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-neutral-100 px-6 py-5 last:border-b-0">
      <h3 className="mb-3 text-neutral-950 text-body">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-neutral-500 text-micro">{label}</dt>
      <dd className="text-pretty whitespace-pre-line text-neutral-800 text-caption">{children}</dd>
    </div>
  )
}

const toneCls = { amber: "bg-amber-50 text-amber-800", red: "bg-red-50 text-red-700" } as const

function VitalsGrid({ vitals, age }: { vitals: NoteVitals; age: number }) {
  const flags = vitalFlags(vitals, age)
  const n = (x: number | null, unit: string) => (x == null ? null : `${x}${unit}`)
  const items: { key: keyof NoteVitals; label: string; value: string | null }[] = [
    { key: "bpSystolic", label: v.bp, value: vitals.bpSystolic != null && vitals.bpDiastolic != null ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : null },
    { key: "heartRate", label: v.heartRate, value: n(vitals.heartRate, " bpm") },
    { key: "tempF", label: v.temp, value: n(vitals.tempF, " °F") },
    { key: "respRate", label: v.respRate, value: n(vitals.respRate, " /min") },
    { key: "spo2", label: v.spo2, value: n(vitals.spo2, "%") },
    { key: "weightLb", label: v.weight, value: n(vitals.weightLb, " lb") },
    { key: "heightIn", label: v.height, value: n(vitals.heightIn, " in") },
    { key: "bmi", label: v.bmi, value: vitals.bmi == null ? null : `${vitals.bmi} kg/m²` },
    { key: "painScore", label: v.pain, value: vitals.painScore == null ? null : `${vitals.painScore}/10` },
  ]
  const shown = items.filter((i) => i.value)
  if (!shown.length) return <p className="text-neutral-500 text-caption">{c.noVitals}</p>
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {shown.map((i) => {
        const f = flags[i.key]
        return (
          <div key={i.key} className="rounded-xl border border-neutral-200/70 px-3 py-2.5">
            <dt className="text-neutral-500 text-micro">{i.label}</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-neutral-950 tabular-nums text-caption">{i.value}</span>
              {f && <span className={cn("rounded-full px-2 py-0.5 text-micro", toneCls[f.tone])}>{f.label}</span>}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function NoteSheet({ item, patient, onOpenChange }: { item: SignedNote | null; patient: Patient; onOpenChange: (o: boolean) => void }) {
  // Keep the last note while the sheet animates closed.
  const [last, setLast] = React.useState<SignedNote | null>(item)
  if (item && item !== last) setLast(item)
  const shown = item ?? last
  const note = shown?.note
  const a = shown?.appointment
  const doctor = note ? getDoctorSync(note.doctorId) : null

  return (
    <DetailSheet
      open={!!item}
      onOpenChange={onOpenChange}
      wide
      title={a ? `${visitTypeLabel(a.visitType)} · ${fmtDateLong(a.start)}` : ""}
      description={a && doctor ? c.sheetDescription(fmtDateTime(a.start), doctor.name) : undefined}
      footer={
        note ? (
          <p className="text-neutral-500 text-caption">
            {c.signedBy(doctor?.name ?? "", note.signedAt ? fmtDateTime(note.signedAt) : "")}
            <span className="block text-neutral-400 text-micro">{c.readOnly}</span>
          </p>
        ) : null
      }
    >
      {note && (
        <div className="flex flex-col">
          <Block title={c.vitals}>
            <VitalsGrid vitals={note.vitals} age={ageOn(patient.dob, a ? a.start.slice(0, 10) : undefined)} />
          </Block>
          <Block title={c.subjective}>
            <dl className="flex flex-col gap-3">
              <Field label={c.chiefComplaint}>{note.subjective.chiefComplaint || c.none}</Field>
              <Field label={c.hpi}>{note.subjective.historyOfPresentIllness || c.none}</Field>
              <Field label={c.symptoms}>
                {note.subjective.symptoms.length ? (
                  <span className="flex flex-wrap gap-1">
                    {note.subjective.symptoms.map((s) => (
                      <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-700 text-micro">
                        {s}
                      </span>
                    ))}
                  </span>
                ) : (
                  c.none
                )}
              </Field>
            </dl>
          </Block>
          <Block title={c.objective}>
            <dl>
              <Field label={c.exam}>{note.objective.exam || c.none}</Field>
            </dl>
          </Block>
          <Block title={c.assessment}>
            {note.assessment.diagnoses.length ? (
              <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200/70">
                {note.assessment.diagnoses.map((d) => (
                  <li key={d.code} className="flex items-baseline gap-3 px-3 py-2.5 text-caption">
                    <span className="w-16 shrink-0 text-neutral-500 tabular-nums">{d.code}</span>
                    <span className="text-neutral-950">{d.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-caption">{c.noDiagnoses}</p>
            )}
          </Block>
          <Block title={c.plan}>
            <dl className="flex flex-col gap-4">
              {note.plan.text && <Field label={c.plan}>{note.plan.text}</Field>}
              <Field label={c.orders}>
                {note.plan.orders.length ? (
                  <ul className="flex flex-col gap-1">
                    {note.plan.orders.map((o) => (
                      <li key={o.id}>
                        <span className="text-neutral-500">{orderType[o.type]}:</span> {o.name} <span className="text-neutral-400">· {o.status === "resulted" ? "Resulted" : o.status === "cancelled" ? "Cancelled" : "Ordered"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  c.none
                )}
              </Field>
              <Field label={c.prescriptions}>
                {note.plan.prescriptions.length ? (
                  <ul className="flex flex-col gap-1">
                    {note.plan.prescriptions.map((rx, i) => (
                      <li key={`${rx.medication}-${i}`}>
                        <span className="text-neutral-950">
                          {rx.medication} {rx.dose}
                        </span>{" "}
                        · {rx.frequency} · <span className="tabular-nums">Qty {rx.quantity}</span> · <span className="tabular-nums">{rx.refills} refill{rx.refills === 1 ? "" : "s"}</span>
                        {rx.pharmacy && <span className="block text-neutral-500 text-micro">{rx.pharmacy}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  c.none
                )}
              </Field>
              <Field label={c.followUp}>{note.plan.followUp ? `In ${note.plan.followUp.inDays} day${note.plan.followUp.inDays === 1 ? "" : "s"} · ${note.plan.followUp.reason}` : c.none}</Field>
            </dl>
          </Block>
          <Block title={c.instructions}>
            <p className="text-pretty whitespace-pre-line text-neutral-800 text-caption">{note.patientInstructions || c.none}</p>
          </Block>
        </div>
      )}
    </DetailSheet>
  )
}

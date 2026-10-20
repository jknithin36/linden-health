"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { allergyConflict, vitalFlags } from "@/lib/admin/clinical"
import type { VisitNote } from "@/lib/admin/types"
import { FlagLabel } from "@/components/admin/doctor/visit/sections/vitals"
import { AllergyAlert } from "@/components/admin/doctor/visit/sections/plan"

const c = visitCopy.summary

const orderType = visitCopy.plan.orderTypes

function Row({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4", full && "py-4")}>
      <dt className="text-neutral-500 text-caption">{label}</dt>
      <dd className="min-w-0 text-neutral-950 text-caption">{children}</dd>
    </div>
  )
}

const None = () => <span className="text-neutral-400">{c.none}</span>

function followUpText(f?: { inDays: number; reason: string }) {
  if (!f) return null
  const weeks = f.inDays >= 7 && f.inDays % 7 === 0 && f.inDays <= 364
  const n = weeks ? f.inDays / 7 : f.inDays
  return `In ${n} ${weeks ? (n === 1 ? "week" : "weeks") : n === 1 ? "day" : "days"}${f.reason ? ` · ${f.reason}` : ""}`
}

/** Vitals as a compact inline list with their out-of-range labels. */
function VitalsLine({ note, age }: { note: VisitNote; age: number }) {
  const v = note.vitals
  const flags = vitalFlags(v, age)
  const items: { k: string; text: string; flag?: { label: string; tone: "amber" | "red" } }[] = []
  if (v.bpSystolic != null && v.bpDiastolic != null) items.push({ k: "bp", text: `BP ${v.bpSystolic}/${v.bpDiastolic} mmHg`, flag: flags.bpSystolic })
  if (v.heartRate != null) items.push({ k: "hr", text: `HR ${v.heartRate} bpm`, flag: flags.heartRate })
  if (v.tempF != null) items.push({ k: "t", text: `Temp ${v.tempF} °F`, flag: flags.tempF })
  if (v.respRate != null) items.push({ k: "rr", text: `RR ${v.respRate}/min`, flag: flags.respRate })
  if (v.spo2 != null) items.push({ k: "o2", text: `SpO₂ ${v.spo2}%`, flag: flags.spo2 })
  if (v.weightLb != null) items.push({ k: "w", text: `Wt ${v.weightLb} lb` })
  if (v.heightIn != null) items.push({ k: "h", text: `Ht ${v.heightIn} in` })
  if (v.bmi != null) items.push({ k: "bmi", text: `BMI ${v.bmi}`, flag: flags.bmi })
  if (v.painScore != null) items.push({ k: "p", text: `Pain ${v.painScore}/10` })
  if (!items.length) return <span className="text-neutral-400">{c.notRecorded}</span>
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 tabular-nums">
      {items.map((i) => (
        <li key={i.k} className="inline-flex items-center gap-1.5">
          {i.text}
          {i.flag && <FlagLabel flag={i.flag} className="h-5" />}
        </li>
      ))}
    </ul>
  )
}

/** The note in read-only form: `compact` for the sign dialog, full for a signed note. */
export function NoteSummary({ note, age, allergies, compact }: { note: VisitNote; age: number; allergies: string[]; compact?: boolean }) {
  const pre = "whitespace-pre-line text-pretty"
  return (
    <dl className="divide-y divide-neutral-100">
      <Row label={c.vitals} full={!compact}>
        <VitalsLine note={note} age={age} />
      </Row>
      <Row label={c.cc} full={!compact}>
        {note.subjective.chiefComplaint || <None />}
      </Row>
      {!compact && (
        <>
          <Row label={c.hpi} full>
            {note.subjective.historyOfPresentIllness ? <p className={pre}>{note.subjective.historyOfPresentIllness}</p> : <None />}
          </Row>
          <Row label={c.symptoms} full>
            {note.subjective.symptoms.length ? note.subjective.symptoms.join(", ") : <None />}
          </Row>
          <Row label={c.exam} full>
            {note.objective.exam ? <p className={pre}>{note.objective.exam}</p> : <None />}
          </Row>
        </>
      )}
      <Row label={c.diagnoses} full={!compact}>
        {note.assessment.diagnoses.length ? (
          <ul className="flex flex-col gap-0.5">
            {note.assessment.diagnoses.map((d) => (
              <li key={d.code}>
                <span className="text-neutral-500 tabular-nums">{d.code}</span> · {d.label}
              </li>
            ))}
          </ul>
        ) : (
          <None />
        )}
      </Row>
      {!compact && (
        <Row label={c.plan} full>
          {note.plan.text ? <p className={pre}>{note.plan.text}</p> : <None />}
        </Row>
      )}
      <Row label={c.orders} full={!compact}>
        {note.plan.orders.length ? (
          <ul className="flex flex-col gap-0.5">
            {note.plan.orders.map((o) => (
              <li key={o.id}>
                {o.name} <span className="text-neutral-500">· {orderType[o.type]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <None />
        )}
      </Row>
      <Row label={c.rx} full={!compact}>
        {note.plan.prescriptions.length ? (
          <ul className="flex flex-col gap-2">
            {note.plan.prescriptions.map((rx, i) => {
              const w = allergyConflict(allergies, rx.medication)
              return (
                <li key={i} className="flex flex-col gap-1.5">
                  <span>
                    {rx.medication} {rx.dose} · {rx.frequency} · Qty {rx.quantity} · {rx.refills} refill{rx.refills === 1 ? "" : "s"}
                  </span>
                  {w && <AllergyAlert text={w} />}
                </li>
              )
            })}
          </ul>
        ) : (
          <None />
        )}
      </Row>
      <Row label={c.followUp} full={!compact}>
        {followUpText(note.plan.followUp) ?? <None />}
      </Row>
      {!compact && (
        <Row label={c.instructions} full>
          {note.patientInstructions ? <p className={pre}>{note.patientInstructions}</p> : <None />}
        </Row>
      )}
    </dl>
  )
}

// The visit note form: one zod schema for the whole note, plus converters to and from the stored VisitNote.
// The form holds the live draft; the admin store holds the last saved draft.

import { z } from "zod"

import { bmiOf } from "@/lib/admin/clinical"
import type { VisitNote } from "@/lib/admin/types"

const vital = (label: string, min: number, max: number, unit: string, int = false) => {
  const msg = `${label} must be between ${min} and ${max}${unit ? ` ${unit}` : ""}`
  const n = int ? z.number({ error: msg }).int({ error: `${label} must be a whole number` }) : z.number({ error: msg })
  return n.min(min, { error: msg }).max(max, { error: msg }).nullable()
}

export const noteSchema = z.object({
  vitals: z.object({
    bpSystolic: vital("Systolic blood pressure", 50, 260, "mmHg", true),
    bpDiastolic: vital("Diastolic blood pressure", 30, 160, "mmHg", true),
    heartRate: vital("Heart rate", 20, 250, "bpm", true),
    tempF: vital("Temperature", 90, 110, "°F"),
    respRate: vital("Respiratory rate", 4, 80, "breaths/min", true),
    spo2: vital("Oxygen saturation", 50, 100, "%", true),
    weightLb: vital("Weight", 1, 800, "lb"),
    heightIn: vital("Height", 10, 100, "in"),
    painScore: vital("Pain score", 0, 10, "", true),
  }),
  subjective: z.object({
    chiefComplaint: z.string().max(200, { error: "Chief complaint must be 200 characters or fewer" }),
    historyOfPresentIllness: z.string(),
    symptoms: z.array(z.string()),
  }),
  objective: z.object({ exam: z.string() }),
  assessment: z.object({ diagnoses: z.array(z.object({ code: z.string(), label: z.string() })) }),
  plan: z.object({
    text: z.string(),
    orders: z.array(z.object({ id: z.string(), type: z.enum(["lab", "imaging", "referral", "vaccine"]), name: z.string(), status: z.enum(["ordered", "resulted", "cancelled"]) })),
    prescriptions: z.array(z.object({ medication: z.string(), dose: z.string(), frequency: z.string(), quantity: z.number(), refills: z.number(), pharmacy: z.string() })),
    followUp: z.object({
      amount: z.number({ error: "Follow-up must be a number" }).int({ error: "Follow-up must be a whole number" }).min(1, { error: "Follow-up must be at least 1" }).max(365, { error: "Follow-up must be 365 or less" }).nullable(),
      unit: z.enum(["days", "weeks"]),
      reason: z.string(),
    }),
  }),
  patientInstructions: z.string(),
})

export type NoteForm = z.infer<typeof noteSchema>
export type VitalKey = keyof NoteForm["vitals"]

export function fromNote(n: VisitNote): NoteForm {
  const { bmi: _bmi, ...vitals } = n.vitals
  void _bmi
  const f = n.plan.followUp
  const weeks = !!f && f.inDays >= 7 && f.inDays % 7 === 0 && f.inDays <= 364
  return {
    vitals,
    subjective: { ...n.subjective, symptoms: [...n.subjective.symptoms] },
    objective: { ...n.objective },
    assessment: { diagnoses: n.assessment.diagnoses.map((d) => ({ ...d })) },
    plan: {
      text: n.plan.text,
      orders: n.plan.orders.map((o) => ({ ...o })),
      prescriptions: n.plan.prescriptions.map((p) => ({ ...p })),
      followUp: f ? { amount: weeks ? f.inDays / 7 : f.inDays, unit: weeks ? "weeks" : "days", reason: f.reason } : { amount: null, unit: "days", reason: "" },
    },
    patientInstructions: n.patientInstructions,
  }
}

export function toNote(v: NoteForm, base: VisitNote): VisitNote {
  const { followUp, ...plan } = v.plan
  return {
    ...base,
    vitals: { ...v.vitals, bmi: bmiOf(v.vitals.weightLb, v.vitals.heightIn) },
    subjective: { ...v.subjective, chiefComplaint: v.subjective.chiefComplaint.trim() },
    objective: { ...v.objective },
    assessment: { diagnoses: v.assessment.diagnoses },
    plan: { ...plan, ...(followUp.amount ? { followUp: { inDays: followUp.amount * (followUp.unit === "weeks" ? 7 : 1), reason: followUp.reason.trim() } } : {}) },
    patientInstructions: v.patientInstructions,
  }
}

/** What still blocks signing: required items plus any out-of-range values. */
export function missingForSign(v: NoteForm): string[] {
  const out: string[] = []
  if (!v.subjective.chiefComplaint.trim()) out.push("Chief complaint (Subjective)")
  if (!v.assessment.diagnoses.length) out.push("At least one diagnosis (Assessment)")
  const parsed = noteSchema.safeParse(v)
  if (!parsed.success) for (const i of parsed.error.issues) if (!out.includes(i.message)) out.push(i.message)
  return out
}

/** Whether each section has its required bits filled ("Done" check). */
export function sectionDone(v: NoteForm) {
  const vt = v.vitals
  return {
    vitals: vt.bpSystolic != null && vt.bpDiastolic != null && vt.heartRate != null && vt.tempF != null,
    subjective: !!v.subjective.chiefComplaint.trim(),
    objective: !!v.objective.exam.trim(),
    assessment: v.assessment.diagnoses.length > 0,
    plan: !!v.plan.text.trim() || v.plan.orders.length > 0 || v.plan.prescriptions.length > 0,
    instructions: !!v.patientInstructions.trim(),
  }
}

export type SectionId = keyof ReturnType<typeof sectionDone>

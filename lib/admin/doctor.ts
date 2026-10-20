// Fictional data for demo purposes only. Not for clinical use.
// Doctor view: queries (My day, inbox, visit notes, medications, labs) and simulated mutations.
// Like the rest of the admin, changes live in this tab's store and survive navigation.
// Backend: the async functions (listInbox, getMyDay, getVisit) are the read seam and the exported
// mutations (saveNote, signNote, approveRefill…) the write seam; swap their bodies for API calls.

import { chenDay, refills as baseRefills } from "@/lib/admin/data"
import { baseMedications, CHEN_ID, inboxSeed, labPanels, preVisitAnswers, schoolForms, seedNote } from "@/lib/admin/clinical"
import { addMinutes, dayOf, delay, minutesBetween, NOW, TODAY } from "@/lib/admin/format"
import { allAppointments, allRefills, allThreads, getDoctorSync, getPatientSync, getPlanSync, resultsFor, type AdminLabResult } from "@/lib/admin/queries"
import { getAdminState, logActivity, setAdminState, type AdminState } from "@/lib/admin/store"
import { getSessionSync } from "@/lib/session-client"
import type { Appointment, InboxItem, LabPanel, Medication, VisitNote } from "@/lib/admin/types"

/** The doctor whose view this is: the signed-in doctor, or Dr. Chen for admins looking in. */
export const myDoctorId = () => getSessionSync()?.doctorId ?? CHEN_ID

/* ---------------------------------- Notes ---------------------------------- */

// Id index over the merged appointments, rebuilt only when that list changes (notes are looked up per row).
let apptIndex: { list: Appointment[]; byId: Map<string, Appointment> } | null = null
export function apptById(id: string) {
  const list = allAppointments()
  if (apptIndex?.list !== list) apptIndex = { list, byId: new Map(list.map((a) => [a.id, a])) }
  return apptIndex.byId.get(id)
}

export function getNoteSync(apptId: string): VisitNote | null {
  const s = getAdminState()
  if (s.notes[apptId]) return s.notes[apptId]
  const a = apptById(apptId)
  return a ? seedNote(a) : null
}

export type NoteState = "signed" | "unsigned" | "not-started"

/** Signed / Unsigned (started or finished but not signed) / Not started. */
export function noteState(a: Appointment): NoteState {
  const n = getNoteSync(a.id)
  if (!n || n.status === "not-started") return "not-started"
  if (n.status === "signed") return "signed"
  // A draft saved before the visit starts still counts as not started.
  return a.status === "with-doctor" || a.status === "completed" ? "unsigned" : "not-started"
}

/** The patient's most recent completed visit that started before `before` (a date or date-time; default: today). */
export function lastCompletedVisit(patientId: string, before: string = TODAY) {
  return allAppointments().findLast((a) => a.patientId === patientId && a.status === "completed" && a.start < before) ?? null
}

/** Signed notes for a patient, newest first. */
export function signedNotesFor(patientId: string) {
  return allAppointments()
    .filter((a) => a.patientId === patientId && a.status === "completed")
    .map((a) => ({ appointment: a, note: getNoteSync(a.id)! }))
    .filter((x) => x.note?.status === "signed")
    .sort((a, b) => (a.appointment.start < b.appointment.start ? 1 : -1))
}

/* ------------------------------- Medications ------------------------------- */

export function medicationsFor(patientId: string): Medication[] {
  const s = getAdminState()
  if (s.meds[patientId]) return s.meds[patientId]
  const p = getPatientSync(patientId)
  return p ? baseMedications(p) : []
}

/* ---------------------------------- Labs ----------------------------------- */

export const getLabPanel = (id: string) => labPanels.find((l) => l.id === id) ?? null
export const labPanelsFor = (patientId: string) => labPanels.filter((l) => l.patientId === patientId).sort((a, b) => (a.collectedAt < b.collectedAt ? 1 : -1))

export const testFlag = (t: { value: number; low?: number; high?: number }) => (t.high !== undefined && t.value > t.high ? "high" : t.low !== undefined && t.value < t.low ? "low" : "normal")

/** A lab panel in the portal's result shape, so the chart's results tab and range bars can show it. */
function panelAsResult(l: LabPanel): AdminLabResult {
  const doctor = getDoctorSync(l.doctorId)
  return {
    id: l.id,
    iso: dayOf(l.collectedAt),
    date: dayOf(l.collectedAt),
    title: l.title,
    type: "blood",
    orderedBy: doctor?.slug ?? "emily-chen",
    collected: `Collected ${dayOf(l.collectedAt)}`,
    lab: "Linden Health Cleveland lab",
    sections: [
      {
        title: l.title,
        tests: l.tests.map((t, i) => ({
          id: `${l.id}-${i}`,
          name: t.name,
          value: t.value,
          unit: t.unit,
          ...(t.low !== undefined ? { low: t.low } : {}),
          ...(t.high !== undefined ? { high: t.high } : {}),
          range: t.low !== undefined && t.high !== undefined ? `${t.low}–${t.high} ${t.unit}` : t.high !== undefined ? `Under ${t.high + (Number.isInteger(t.high) ? 1 : 0.1)} ${t.unit}` : `${t.low} ${t.unit} or higher`,
          about: "",
        })),
      },
    ],
  } as AdminLabResult
}

/** Every result for a patient: generated/portal results plus the doctor-view lab panels. */
export const allResultsFor = (patientId: string): AdminLabResult[] => [...labPanelsFor(patientId).map(panelAsResult), ...resultsFor(patientId)].sort((a, b) => (a.iso < b.iso ? 1 : -1))

/* ---------------------------------- Inbox ---------------------------------- */

export type InboxRow = InboxItem & { doneAt?: string; action?: string }

export function allInbox(doctorId = myDoctorId()): InboxRow[] {
  const s = getAdminState()
  return inboxSeed
    .filter((i) => i.doctorId === doctorId)
    .map((i) => {
      const o = s.inbox[i.id]
      // A note signed from the visit screen clears its inbox item too.
      const note = i.type === "note-to-sign" && !o ? getNoteSync(i.refId) : null
      if (note?.status === "signed") return { ...i, status: "done" as const, action: "Signed", doneAt: note.signedAt }
      return o ? { ...i, status: o.status, doneAt: o.at, action: o.action } : i
    })
}

/** High priority first, then oldest first. */
const sortInbox = (rows: InboxRow[]) => [...rows].sort((a, b) => (a.priority !== b.priority ? (a.priority === "high" ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1))

export const inboxNeedsReview = (doctorId = myDoctorId()) => allInbox(doctorId).filter((i) => i.status === "new").length

export async function listInbox(input: { type?: string; priority?: string[]; status?: string[]; doctorId?: string }) {
  await delay(250)
  let rows = allInbox(input.doctorId)
  if (input.type && input.type !== "all") rows = rows.filter((r) => r.type === input.type)
  if (input.priority?.length) rows = rows.filter((r) => input.priority!.includes(r.priority))
  if (input.status?.length) rows = rows.filter((r) => input.status!.includes(r.status))
  return sortInbox(rows)
}

export const getSchoolForm = (id: string) => schoolForms.find((f) => f.id === id) ?? null

/* --------------------------------- My day ---------------------------------- */

/** Minutes behind: when the current visit should wrap up (average visit length today) vs. the next start. */
function runningLate(list: Appointment[]) {
  const done = list.filter((a) => a.status === "completed" && a.roomedAt && a.completedAt)
  const avg = done.length ? Math.round(done.reduce((s, a) => s + minutesBetween(a.roomedAt!, a.completedAt!), 0) / done.length) : 30
  const current = list.find((a) => a.status === "with-doctor")
  if (!current?.roomedAt) return 0
  const next = list.find((a) => a.start > current.start && !["completed", "cancelled", "late-cancel", "no-show"].includes(a.status))
  if (!next) return 0
  return Math.max(0, minutesBetween(next.start, addMinutes(current.roomedAt, avg)))
}

export async function getMyDay(doctorId = myDoctorId()) {
  await delay()
  const doctor = getDoctorSync(doctorId)!
  const today = allAppointments().filter((a) => a.doctorId === doctorId && dayOf(a.start) === TODAY)
  const booked = today.filter((a) => a.status !== "cancelled" && a.status !== "late-cancel")
  const seen = booked.filter((a) => a.status === "completed")
  const current = booked.find((a) => a.status === "with-doctor") ?? null
  const waitingNow = booked.filter((a) => a.status === "checked-in" || a.status === "waiting" || a.status === "arrived").sort((a, b) => (a.start < b.start ? -1 : 1))
  const next = waitingNow[0] ?? booked.find((a) => a.start > NOW && (a.status === "confirmed" || a.status === "scheduled")) ?? null
  const rows = booked.map((a) => ({ appointment: a, note: noteState(a) }))
  const inbox = sortInbox(allInbox(doctorId).filter((i) => i.status === "new"))
  return {
    doctor,
    rows,
    open: doctorId === CHEN_ID ? chenDay.open.filter((s) => !booked.some((a) => a.start === s)) : [],
    stats: {
      patients: booked.length,
      seen: seen.length,
      remaining: booked.filter((a) => !["completed", "no-show"].includes(a.status)).length,
      notesToSign: booked.filter((a) => a.status === "completed" && noteState(a) !== "signed").length,
      inbox: inbox.length,
    },
    late: runningLate(booked),
    current,
    next,
    inboxPreview: inbox.slice(0, 5),
  }
}

/* ------------------------------- Visit screen ------------------------------ */

export async function getVisit(apptId: string) {
  await delay(300)
  const appointment = apptById(apptId)
  if (!appointment) return null
  const patient = getPatientSync(appointment.patientId)!
  const past = allAppointments()
    .filter((a) => a.patientId === patient.id && a.status === "completed" && a.start < appointment.start)
    .slice(-3)
    .reverse()
  return {
    appointment,
    patient,
    note: getNoteSync(apptId)!,
    medications: medicationsFor(patient.id),
    lastVisits: past.map((a) => ({ appointment: a, note: getNoteSync(a.id) })),
    results: allResultsFor(patient.id).slice(0, 3),
    preVisit: preVisitAnswers(appointment),
    plan: patient.insurance ? getPlanSync(patient.insurance.planId) ?? null : null,
    vitalsTrend: allAppointments()
      .filter((a) => a.patientId === patient.id && a.status === "completed")
      .slice(-6)
      .map((a) => ({ date: dayOf(a.start), ...getNoteSync(a.id)!.vitals })),
  }
}

/* -------------------------------- Mutations -------------------------------- */

type Slices = Pick<AdminState, "inbox" | "refills" | "meds" | "notes" | "appointments" | "threads">

/** Run a change and return a function that puts the affected slices back (for the undo toast). */
function withUndo(fn: () => void) {
  const s = getAdminState()
  const before: Slices = { inbox: s.inbox, refills: s.refills, meds: s.meds, notes: s.notes, appointments: s.appointments, threads: s.threads }
  fn()
  return () => setAdminState(() => before)
}

const markDone = (ids: string[], action: string) =>
  setAdminState((s) => ({ inbox: { ...s.inbox, ...Object.fromEntries(ids.map((id) => [id, { status: "done" as const, at: NOW, action }])) } }))

export function saveNote(note: VisitNote) {
  const next: VisitNote = { ...note, status: note.status === "signed" ? "signed" : "in-progress", updatedAt: NOW }
  setAdminState((s) => ({ notes: { ...s.notes, [note.appointmentId]: next } }))
  return next
}

/** Start a visit: rooms the patient with the doctor and opens the note. */
export function startVisit(apptId: string) {
  const a = apptById(apptId)
  if (!a) return
  if (a.status !== "with-doctor" && a.status !== "completed") setAdminState((s) => ({ appointments: { ...s.appointments, [a.id]: { ...s.appointments[a.id], status: "with-doctor", roomedAt: NOW, checkedInAt: a.checkedInAt ?? NOW, room: a.room ?? (a.type === "video" ? undefined : 1) } } }))
  const n = getNoteSync(apptId)!
  if (n.status === "not-started") saveNote({ ...n, status: "in-progress" })
  logActivity({ type: "visit-started", summary: `Started visit with ${getPatientSync(a.patientId)?.name}`, entityType: "appointment", entityId: a.id, patientId: a.patientId })
}

/** Sign a note: locks it, completes the visit, adds new prescriptions to the patient's list. */
export function signNote(note: VisitNote) {
  const a = apptById(note.appointmentId)
  const signed: VisitNote = { ...note, status: "signed", signedAt: NOW, updatedAt: NOW }
  setAdminState((s) => {
    const meds = note.plan.prescriptions.length ? { ...s.meds, [note.patientId]: [...medicationsFor(note.patientId), ...note.plan.prescriptions.map((rx, i): Medication => ({ id: `med-${note.id}-${i}`, patientId: note.patientId, name: rx.medication, dose: rx.dose, frequency: rx.frequency, prescriberId: note.doctorId, startedAt: TODAY, lastFilledAt: TODAY, refillsLeft: rx.refills, status: "active" }))] } : s.meds
    const appointments = a && a.status !== "completed" ? { ...s.appointments, [a.id]: { ...s.appointments[a.id], status: "completed" as const, completedAt: NOW, roomedAt: a.roomedAt ?? addMinutes(NOW, -20) } } : s.appointments
    return { notes: { ...s.notes, [note.appointmentId]: signed }, meds, appointments }
  })
  const item = inboxSeed.find((i) => i.type === "note-to-sign" && i.refId === note.appointmentId)
  if (item) markDone([item.id], "Signed")
  logActivity({ type: "note-signed", summary: `Signed visit note for ${getPatientSync(note.patientId)?.name} · ${note.assessment.diagnoses.map((d) => d.label).join(", ")}`, entityType: "appointment", entityId: note.appointmentId, patientId: note.patientId })
  return signed
}

export function markResultsReviewed(ids: string[]) {
  return withUndo(() => {
    markDone(ids, "Reviewed")
    logActivity({ type: "results-reviewed", summary: `Reviewed ${ids.length} result${ids.length === 1 ? "" : "s"}`, entityType: "patient", entityId: ids[0] })
  })
}

export function addPatientNote(itemId: string, patientId: string, text: string) {
  logActivity({ type: "patient-note", summary: `Sent a result note to ${getPatientSync(patientId)?.name}’s portal: “${text.slice(0, 60)}${text.length > 60 ? "…" : ""}”`, entityType: "patient", entityId: patientId, patientId })
  return withUndo(() => markDone([itemId], "Note sent to patient"))
}

export function orderRecheck(itemId: string, patientId: string, test: string) {
  logActivity({ type: "order", summary: `Ordered ${test} recheck for ${getPatientSync(patientId)?.name}`, entityType: "patient", entityId: patientId, patientId })
  return withUndo(() => markDone([itemId], `Recheck ordered: ${test}`))
}

const refillById = (id: string) => allRefills().find((r) => r.id === id) ?? baseRefills.find((r) => r.id === id)!

export function approveRefill(itemId: string, refillId: string, quantity: number, refills: number) {
  const r = refillById(refillId)
  return withUndo(() => {
    setAdminState((s) => {
      const list = medicationsFor(r.patientId)
      const found = list.some((m) => m.name === r.medication)
      const meds = found
        ? list.map((m) => (m.name === r.medication ? { ...m, dose: r.dose, lastFilledAt: TODAY, refillsLeft: refills } : m))
        : [...list, { id: `med-${r.id}`, patientId: r.patientId, name: r.medication, dose: r.dose, frequency: "As directed", prescriberId: r.doctorId, startedAt: TODAY, lastFilledAt: TODAY, refillsLeft: refills, status: "active" as const }]
      return { refills: { ...s.refills, [r.id]: { ...s.refills[r.id], status: "approved" } }, meds: { ...s.meds, [r.patientId]: meds } }
    })
    markDone([itemId], `Approved · ${quantity} tablets · ${refills} refill${refills === 1 ? "" : "s"}`)
    logActivity({ type: "refill", summary: `Approved ${r.medication} ${r.dose} for ${getPatientSync(r.patientId)?.name} (${quantity} tablets, ${refills} refills)`, entityType: "refill", entityId: r.id, patientId: r.patientId })
  })
}

export function denyRefill(itemId: string, refillId: string, reason: string) {
  const r = refillById(refillId)
  return withUndo(() => {
    setAdminState((s) => ({ refills: { ...s.refills, [r.id]: { ...s.refills[r.id], status: "denied" } } }))
    markDone([itemId], `Denied: ${reason}`)
    logActivity({ type: "refill", summary: `Denied ${r.medication} ${r.dose} for ${getPatientSync(r.patientId)?.name}: ${reason}`, entityType: "refill", entityId: r.id, patientId: r.patientId })
  })
}

export function refillNeedsVisit(itemId: string, refillId: string) {
  const r = refillById(refillId)
  return withUndo(() => {
    setAdminState((s) => ({ refills: { ...s.refills, [r.id]: { ...s.refills[r.id], status: "routed" } } }))
    markDone([itemId], "Needs visit · booking link sent")
    logActivity({ type: "refill", summary: `Sent ${getPatientSync(r.patientId)?.name} a booking link before refilling ${r.medication}`, entityType: "refill", entityId: r.id, patientId: r.patientId })
  })
}

export function signForm(itemId: string, formId: string) {
  const f = getSchoolForm(formId)!
  return withUndo(() => {
    markDone([itemId], "Signed")
    logActivity({ type: "form-signed", summary: `Signed ${f.title} for ${getPatientSync(f.patientId)?.name}`, entityType: "patient", entityId: f.patientId, patientId: f.patientId })
  })
}

export function completeMessageItem(itemId: string) {
  return withUndo(() => markDone([itemId], "Replied"))
}

/** Undo for a single item marked done. */
export function reopenInboxItem(itemId: string) {
  setAdminState((s) => {
    const next = { ...s.inbox }
    delete next[itemId]
    return { inbox: next }
  })
}

/* ------------------------------- Small helpers ----------------------------- */

export const threadFor = (id: string) => allThreads().find((t) => t.id === id) ?? null

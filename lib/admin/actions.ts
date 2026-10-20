// Fictional data for demo purposes only.
// Simulated mutations: each updates this tab's admin store (optimistic, instant), logs an
// activity event, and returns a short message for the toast. No network involved.
// With a backend, each becomes a POST/PATCH to your API (the server writes the audit event),
// followed by a store version bump so the screens refetch.

import { patients as basePatients } from "@/lib/admin/data"
import { addMinutes, ageOn, fmtDateTime, fmtMoney, fmtMrn, NOW, TODAY } from "@/lib/admin/format"
import { allAppointments, currentUserId, getAppointmentSync, getPatientSync, getStaffSync, isLateCancel } from "@/lib/admin/queries"
import { getAdminState, logActivity, setAdminState } from "@/lib/admin/store"
import { billingCopy, methodText } from "@/lib/data/admin-billing"
import { settingsCopy } from "@/lib/data/admin-settings"
import type { Appointment, AppointmentStatus, ClinicId, Message, MessageThread, Patient, PaymentMethod, RefillRequest, Refund, StaffRole, StaffUser, TimeOff, WorkBlock } from "@/lib/admin/types"

const roleLabel = (r: StaffRole) => settingsCopy.team.roles.find((x) => x.value === r)?.label ?? r

const findAppt = getAppointmentSync

function patchAppointment(id: string, patch: Partial<Appointment>) {
  setAdminState((s) => ({ appointments: { ...s.appointments, [id]: { ...s.appointments[id], ...patch } } }))
}

const nameOf = (a: Appointment) => getPatientSync(a.patientId)?.name ?? "Patient"

/* ------------------------------- Appointments ------------------------------ */

const statusLabel: Partial<Record<AppointmentStatus, string>> = {
  arrived: "Marked as arrived",
  "checked-in": "Checked in",
  waiting: "Moved to waiting",
  "with-doctor": "Roomed",
  completed: "Marked done",
  "no-show": "Marked as a no-show",
  confirmed: "Confirmed",
}

/** Move an appointment along (queue moves, check-in, done). Stamps the matching time. */
export function setAppointmentStatus(id: string, status: AppointmentStatus, opts?: { room?: number; now?: string }) {
  const a = findAppt(id)
  if (!a) return "Appointment not found"
  const now = opts?.now ?? NOW
  const patch: Partial<Appointment> = { status }
  if (status === "arrived") patch.arrivedAt = a.arrivedAt ?? now
  if (status === "checked-in" || status === "waiting") {
    patch.arrivedAt = a.arrivedAt ?? now
    patch.checkedInAt = a.checkedInAt ?? now
  }
  if (status === "with-doctor") {
    patch.checkedInAt = a.checkedInAt ?? now
    patch.roomedAt = now
    patch.room = opts?.room ?? a.room
  }
  if (status === "completed") patch.completedAt = now
  if (status === "confirmed") patch.confirmedAt = now
  patchAppointment(id, patch)
  const msg = `${statusLabel[status] ?? "Updated"}: ${nameOf(a)}${status === "with-doctor" && patch.room ? ` · Room ${patch.room}` : ""}`
  logActivity({ type: status, summary: msg, entityType: "appointment", entityId: id, patientId: a.patientId })
  return msg
}

export function confirmAppointments(ids: string[]) {
  const s = getAdminState()
  const next = { ...s.appointments }
  for (const id of ids) next[id] = { ...next[id], status: "confirmed", confirmedAt: NOW }
  setAdminState(() => ({ appointments: next }))
  logActivity({ type: "confirmed", summary: `Confirmed ${ids.length} appointment${ids.length === 1 ? "" : "s"}`, entityType: "appointment", entityId: ids[0] })
  return `Marked ${ids.length} appointment${ids.length === 1 ? "" : "s"} as confirmed`
}

export function sendReminders(ids: string[]) {
  logActivity({ type: "reminder", summary: `Sent reminders for ${ids.length} appointment${ids.length === 1 ? "" : "s"}`, entityType: "appointment", entityId: ids[0] })
  return `Reminder sent to ${ids.length} patient${ids.length === 1 ? "" : "s"} by text and email`
}

export function cancelAppointment(id: string, reason: string) {
  const a = findAppt(id)
  if (!a) return "Appointment not found"
  const late = isLateCancel(a)
  patchAppointment(id, { status: late ? "late-cancel" : "cancelled", cancelledAt: NOW })
  const msg = `Cancelled ${nameOf(a)}’s visit on ${fmtDateTime(a.start)}${late ? " (late cancel)" : ""}`
  logActivity({ type: "cancelled", summary: `${msg}. Reason: ${reason}`, entityType: "appointment", entityId: id, patientId: a.patientId })
  return msg
}

export function rescheduleAppointment(id: string, start: string, doctorId?: string) {
  const a = findAppt(id)
  if (!a) return "Appointment not found"
  patchAppointment(id, { start, ...(doctorId ? { doctorId } : {}), status: "scheduled", confirmedAt: undefined })
  const msg = `Moved ${nameOf(a)} to ${fmtDateTime(start)}`
  logActivity({ type: "rescheduled", summary: msg, entityType: "appointment", entityId: id, patientId: a.patientId })
  return msg
}

let newSeq = 0
export function createAppointment(input: Omit<Appointment, "id" | "bookedAt" | "status"> & { status?: AppointmentStatus }) {
  const id = `a-new-${Date.now().toString(36)}-${newSeq++}`
  const appt: Appointment = { ...input, id, bookedAt: NOW, status: input.status ?? "scheduled" }
  setAdminState((s) => ({ newAppointments: [...s.newAppointments, appt] }))
  const msg = `Booked ${getPatientSync(input.patientId)?.name ?? "patient"} for ${fmtDateTime(input.start)}`
  logActivity({ type: "booked", summary: msg, entityType: "appointment", entityId: id, patientId: input.patientId })
  return { id, message: msg }
}

/* --------------------------------- Patients -------------------------------- */

export function createPatient(input: Pick<Patient, "firstName" | "lastName" | "dob" | "sex" | "phone" | "email" | "address" | "city" | "preferredClinicId" | "primaryDoctorId" | "insurance" | "allergies">) {
  const s = getAdminState()
  const n = 109_000 + s.newPatients.length * 7 + basePatients.length
  const p: Patient = {
    ...input,
    id: `p-new-${s.newPatients.length + 1}`,
    mrn: fmtMrn(n),
    name: `${input.firstName} ${input.lastName}`,
    age: ageOn(input.dob),
    conditions: [],
    flags: ["new"],
    createdAt: NOW,
    lastVisitAt: null,
    nextVisitAt: null,
    balance: 0,
  }
  setAdminState((st) => ({ newPatients: [p, ...st.newPatients] }))
  logActivity({ type: "patient-created", summary: `Added patient ${p.name} (${p.mrn})`, entityType: "patient", entityId: p.id, patientId: p.id })
  return p
}

export function updatePatient(id: string, patch: Partial<Patient>) {
  setAdminState((s) => ({ patients: { ...s.patients, [id]: { ...s.patients[id], ...patch } } }))
  logActivity({ type: "patient-updated", summary: `Updated ${getPatientSync(id)?.name ?? "patient"}’s details`, entityType: "patient", entityId: id, patientId: id })
  return "Patient details saved"
}

/* -------------------------------- Payments --------------------------------- */

let paySeq = 0
export function recordPayment(input: { patientId: string; amount: number; method: PaymentMethod; last4?: string; appointmentId?: string }) {
  const reference = `LH-PAY-${90_000 + getAdminState().payments.length + paySeq++}`
  setAdminState((s) => ({ payments: [{ id: `pay-new-${reference}`, createdAt: NOW, reference, ...input }, ...s.payments] }))
  const msg = `Recorded ${fmtMoney(input.amount)} from ${getPatientSync(input.patientId)?.name ?? "patient"} · ${reference}`
  logActivity({ type: "payment", summary: msg, entityType: "payment", entityId: reference, patientId: input.patientId })
  return msg
}

/** Email balance statements (with a pay-online link) to these patients. */
export function sendStatements(patientIds: string[]) {
  if (!patientIds.length) return ""
  const b = billingCopy.balances
  logActivity({ type: "statement", summary: `Sent ${patientIds.length} balance statement${patientIds.length === 1 ? "" : "s"}`, entityType: "patient", entityId: patientIds[0], patientId: patientIds.length === 1 ? patientIds[0] : undefined })
  return patientIds.length === 1 ? b.statementSent(getPatientSync(patientIds[0])?.name ?? "patient") : b.statementsSent(patientIds.length)
}

/** Send a refund back to the original payment method. Returns the toast title and description. */
export function issueRefund(r: Refund) {
  setAdminState((s) => ({ refundsIssued: { ...s.refundsIssued, [r.id]: NOW } }))
  const t = billingCopy.refunds
  const title = t.issued(fmtMoney(r.amount), getPatientSync(r.payment.patientId)?.name ?? "patient")
  logActivity({ type: "refund", summary: title, entityType: "payment", entityId: r.payment.reference, patientId: r.payment.patientId })
  return { title, description: t.issuedHint(methodText(r.payment)) }
}

/* --------------------------------- Claims ---------------------------------- */

export function updateClaims(ids: string[], status: "submitted" | "appealed", note?: string) {
  setAdminState((s) => {
    const next = { ...s.claims }
    for (const id of ids) next[id] = { ...next[id], status, updatedAt: NOW, ...(status === "submitted" ? { denialReason: undefined } : {}) }
    return { claims: next }
  })
  logActivity({ type: `claim-${status}`, summary: `${status === "submitted" ? "Resubmitted" : "Appealed"} ${ids.length} claim${ids.length === 1 ? "" : "s"}${note ? `: ${note}` : ""}`, entityType: "claim", entityId: ids[0] })
  return `${status === "submitted" ? "Resubmitted" : "Marked as appealed"}: ${ids.length} claim${ids.length === 1 ? "" : "s"}`
}

export function writeOffClaim(id: string, amount: number, patientId: string) {
  setAdminState((s) => ({ claims: { ...s.claims, [id]: { ...s.claims[id], patientResponsibility: 0, updatedAt: NOW } } }))
  logActivity({ type: "write-off", summary: `Wrote off ${fmtMoney(amount)}`, entityType: "claim", entityId: id, patientId })
  return `Wrote off ${fmtMoney(amount)}`
}

export function addClaimNote(id: string, note: string) {
  setAdminState((s) => ({ claimNotes: { ...s.claimNotes, [id]: [...(s.claimNotes[id] ?? []), note] } }))
  return "Note added"
}

/* -------------------------------- Messages --------------------------------- */

export function sendThreadMessage(thread: MessageThread, body: string, opts?: { internal?: boolean; attachments?: string[] }) {
  const m: Message = { id: `m-new-${Date.now()}`, from: "staff", authorId: currentUserId(), body, createdAt: NOW, ...(opts?.internal ? { internal: true } : {}), ...(opts?.attachments?.length ? { attachments: opts.attachments } : {}) }
  setAdminState((s) => {
    const o = s.threads[thread.id] ?? {}
    return { threads: { ...s.threads, [thread.id]: { ...o, added: [...(o.added ?? []), m], unread: false, ...(opts?.internal ? {} : { status: "waiting" as const }) } } }
  })
  if (!opts?.internal) logActivity({ type: "message", summary: `Replied to ${getPatientSync(thread.patientId)?.name ?? "patient"}: “${thread.subject}”`, entityType: "message", entityId: thread.id, patientId: thread.patientId })
  return opts?.internal ? "Internal note added" : "Message sent"
}

/** Start a new conversation with a patient (the first message is sent with sendThreadMessage). */
export function createThread(patientId: string, subject: string): MessageThread {
  const t: MessageThread = { id: `t-new-${Date.now().toString(36)}`, patientId, subject, topic: "other", assignedToId: currentUserId(), status: "open", priority: "normal", lastMessageAt: NOW, unread: false, messages: [] }
  setAdminState((s) => ({ newThreads: [t, ...s.newThreads] }))
  return t
}

export function updateThread(id: string, patch: Partial<Pick<MessageThread, "status" | "assignedToId" | "unread" | "priority">>) {
  setAdminState((s) => ({ threads: { ...s.threads, [id]: { ...s.threads[id], ...patch } } }))
}

/* --------------------------------- Refills --------------------------------- */

export function setRefillStatus(r: RefillRequest, status: RefillRequest["status"]) {
  setAdminState((s) => ({ refills: { ...s.refills, [r.id]: { ...s.refills[r.id], status } } }))
  const msg = `${status === "approved" ? "Approved" : status === "denied" ? "Denied" : "Routed"} ${r.medication} ${r.dose} for ${getPatientSync(r.patientId)?.name ?? "patient"}`
  logActivity({ type: "refill", summary: msg, entityType: "refill", entityId: r.id, patientId: r.patientId })
  return msg
}

/* --------------------------------- Settings -------------------------------- */

export function setClinic(clinic: "all" | ClinicId) {
  setAdminState(() => ({ clinic }))
}

export function setPrice(serviceId: string, price: number) {
  setAdminState((s) => ({ prices: { ...s.prices, [serviceId]: price } }))
  logActivity({ type: "settings", summary: `Changed a self-pay price to ${fmtMoney(price)}`, entityType: "settings", entityId: serviceId })
}

export function setPlanActive(planId: string, active: boolean) {
  setAdminState((s) => ({ plansActive: { ...s.plansActive, [planId]: active } }))
}

export function setStaffRole(id: string, role: StaffRole) {
  setAdminState((s) => ({ staff: { ...s.staff, [id]: { ...s.staff[id], role } } }))
  logActivity({ type: "settings", summary: `Changed ${getStaffSync(id)?.name ?? "a team member"}’s role to ${roleLabel(role)}`, entityType: "settings", entityId: id })
}

export function inviteStaff(input: Pick<StaffUser, "name" | "email" | "role" | "clinicIds" | "title">) {
  const u: StaffUser = { ...input, id: `s-new-${Date.now().toString(36)}`, lastActiveAt: NOW, status: "invited" }
  setAdminState((s) => ({ newStaff: [...s.newStaff, u] }))
  logActivity({ type: "settings", summary: `Invited ${u.name} as ${roleLabel(u.role)}`, entityType: "settings", entityId: u.id })
  return `Invite sent to ${u.email}`
}

export function setDoctorHours(doctorId: string, hours: (WorkBlock | null)[]) {
  setAdminState((s) => ({ doctorHours: { ...s.doctorHours, [doctorId]: hours } }))
  logActivity({ type: "settings", summary: "Updated working hours", entityType: "settings", entityId: doctorId })
  return "Working hours saved"
}

export function addTimeOff(doctorId: string, t: Omit<TimeOff, "id">) {
  setAdminState((s) => ({ timeOff: { ...s.timeOff, [doctorId]: [...(s.timeOff[doctorId] ?? []), { ...t, id: `to-${Date.now()}` }] } }))
  logActivity({ type: "settings", summary: `Added time off: ${t.reason}`, entityType: "settings", entityId: doctorId })
  return "Time off added"
}

export function removeTimeOff(doctorId: string, id: string) {
  setAdminState((s) => ({ timeOff: { ...s.timeOff, [doctorId]: (s.timeOff[doctorId] ?? []).filter((t) => t.id !== id) } }))
  return "Time off removed"
}

export function setReminders(rules: NonNullable<ReturnType<typeof getAdminState>["reminders"]>) {
  setAdminState(() => ({ reminders: rules }))
  return "Reminder rules saved"
}

/* ------------------------------ Queue simulation --------------------------- */

/** A small, deterministic nudge every refresh: someone arrives or checks in. Returns changed ids. */
export function simulateQueueTick(clinic: ClinicId, tick: number, now: string) {
  const today = allAppointments().filter((a) => a.clinicId === clinic && a.start.startsWith(TODAY) && a.type === "in-person")
  const changed: string[] = []
  const nextUp = today.filter((a) => (a.status === "confirmed" || a.status === "scheduled") && a.start <= addMinutes(now, 40)).sort((a, b) => (a.start < b.start ? -1 : 1))
  const arrived = today.filter((a) => a.status === "arrived").sort((a, b) => ((a.arrivedAt ?? "") < (b.arrivedAt ?? "") ? -1 : 1))
  if (tick % 2 === 1 && nextUp[0]) {
    setAppointmentStatus(nextUp[0].id, "arrived", { now })
    changed.push(nextUp[0].id)
  } else if (arrived[0]) {
    setAppointmentStatus(arrived[0].id, "checked-in", { now })
    changed.push(arrived[0].id)
  }
  setAdminState(() => ({ changed }))
  return changed
}


// Fictional data for demo purposes only.
//
// THE BACKEND SEAM. Every screen in the admin reads data through this file and nothing else.
// Today the bodies filter the generated demo data (lib/admin/data) merged with this tab's changes
// (lib/admin/store), with a little simulated latency so loading states show. To connect a real
// API, keep the signatures and swap each body for a fetch, e.g.
//
//   export async function listPatients(input: ListQuery<PatientFilters>) {
//     const res = await fetch(`/api/patients?${toSearchParams(input)}`)
//     return (await res.json()) as ListResultWithFacets<Patient>
//   }
//
// The contract for every list query (listAppointments, listPatients, listDoctors, listClaims,
// listPayments, listBalances, listThreads, listActivity):
//   input:  { q?, filters?, sort?: { id, desc } | null, page? (1-based), pageSize? }  (ListQuery)
//   output: { rows, total, page, pageSize, pageCount, facets }  (ListResultWithFacets)
// `facets` holds counts per filter value, each computed with every *other* filter applied, so
// the filter menus can show live counts. Sorting and paging happen on the server.
//
// The `…Sync` getters and `all…()` views are read synchronously by the UI for lookups (a name
// in a cell, a status badge). With a backend, serve them from a client cache that the list
// queries fill, or embed the fields you need in the list rows.

import {
  activity as baseActivity,
  appointments as baseAppointments,
  claims as baseClaims,
  clinics,
  CURRENT_USER_ID,
  doctors as baseDoctors,
  patients as basePatients,
  payments as basePayments,
  plans as basePlans,
  refills as baseRefills,
  services as baseServices,
  specialties,
  staff as baseStaff,
  threads as baseThreads,
  vitals as baseVitals,
  RANGE,
} from "@/lib/admin/data"
import { createRng } from "@/lib/admin/seed"
import { addDays, addMinutes, at, dayOf, daysBetween, delay, fmtDate, fmtDateNumeric, fmtMoney, minutesBetween, minutesOfDay, mondayOf, NOW, TODAY, weekday } from "@/lib/admin/format"
import { getAdminState, type AdminState } from "@/lib/admin/store"
import { getSessionSync } from "@/lib/session-client"
import { results as portalResults, type LabResult } from "@/lib/data/results"
import { documents as portalDocuments } from "@/lib/data/records"
import { adminNavItems } from "@/lib/data/admin"
import { billingCopy } from "@/lib/data/admin-billing"
import type {
  ActivityEvent,
  Appointment,
  AppointmentStatus,
  Claim,
  ClinicId,
  Doctor,
  Facets,
  InsurancePlan,
  ListQuery,
  ListResult,
  ListResultWithFacets,
  MessageThread,
  Patient,
  Payment,
  Refund,
  RefundStatus,
  Service,
  Sort,
  StaffUser,
  WorkBlock,
} from "@/lib/admin/types"

export { clinics, specialties, RANGE }

/* ------------------------------ Merged views ------------------------------- */

const memo = <T,>(build: (s: AdminState) => T) => {
  let v = -1
  let value: T
  let ref: AdminState | null = null
  return () => {
    const s = getAdminState()
    if (s !== ref || s.version !== v) {
      value = build(s)
      v = s.version
      ref = s
    }
    return value
  }
}

export const allAppointments = memo((s) => {
  const merged = baseAppointments.map((a) => (s.appointments[a.id] ? { ...a, ...s.appointments[a.id] } : a))
  const added = s.newAppointments.map((a) => (s.appointments[a.id] ? { ...a, ...s.appointments[a.id] } : a))
  return [...merged, ...added].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
})

const appointmentMap = memo(() => new Map(allAppointments().map((a) => [a.id, a])))
export const getAppointmentSync = (id: string) => appointmentMap().get(id)

export const allPayments = memo((s) => [...s.payments, ...basePayments])

const allClaims = memo((s) => baseClaims.map((c) => (s.claims[c.id] ? { ...c, ...s.claims[c.id] } : c)))
const claimMap = memo(() => new Map(allClaims().map((c) => [c.id, c])))
export const getClaimSync = (id: string) => claimMap().get(id)

export const allPatients = memo((s) => {
  const paidNow = new Map<string, number>()
  for (const p of s.payments) paidNow.set(p.patientId, (paidNow.get(p.patientId) ?? 0) + p.amount)
  const writtenOff = new Map<string, number>()
  for (const c of baseClaims) {
    const o = s.claims[c.id]
    if (o?.patientResponsibility !== undefined && o.patientResponsibility !== c.patientResponsibility) writtenOff.set(c.patientId, (writtenOff.get(c.patientId) ?? 0) + (c.patientResponsibility - o.patientResponsibility))
  }
  const appts = allAppointments()
  const nextByPatient = new Map<string, Appointment>()
  for (const a of appts) if (a.start > NOW && (a.status === "scheduled" || a.status === "confirmed") && !nextByPatient.has(a.patientId)) nextByPatient.set(a.patientId, a)
  return [...s.newPatients, ...basePatients].map((p0) => {
    const p = s.patients[p0.id] ? { ...p0, ...s.patients[p0.id] } : p0
    const balance = Math.max(0, Math.round((p.balance - (paidNow.get(p.id) ?? 0) - (writtenOff.get(p.id) ?? 0)) * 100) / 100)
    const next = nextByPatient.get(p.id)
    const flags: Patient["flags"] = p.flags.filter((f) => f !== "balance-due" && f !== "forms-pending")
    if (balance > 0) flags.push("balance-due")
    if (next && !next.formsDone) flags.push("forms-pending")
    if (balance === p.balance && flags.length === p.flags.length && next?.start === (p.nextVisitAt ?? undefined)) return p
    return { ...p, balance, flags, nextVisitAt: next?.start ?? null }
  })
})
const patientMap = memo(() => new Map(allPatients().map((p) => [p.id, p])))
export const getPatientSync = (id: string) => patientMap().get(id)

export const allDoctors = memo((s) => baseDoctors.map((d) => (s.doctorHours[d.id] ? { ...d, workingHours: s.doctorHours[d.id] } : d)))
const doctorMap = memo(() => new Map(allDoctors().map((d) => [d.id, d])))
export const getDoctorSync = (id: string) => doctorMap().get(id)

export const allThreads = memo((s) =>
  [...s.newThreads, ...baseThreads]
    .map((t) => {
      const o = s.threads[t.id]
      if (!o) return t
      const messages = [...t.messages, ...(o.added ?? [])]
      return { ...t, ...o, messages, lastMessageAt: messages.at(-1)!.createdAt }
    })
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
)
export const allRefills = memo((s) => baseRefills.map((r) => (s.refills[r.id] ? { ...r, ...s.refills[r.id] } : r)))
export const allPlans = memo((s): InsurancePlan[] => basePlans.map((p) => (p.id in s.plansActive ? { ...p, active: s.plansActive[p.id] } : p)))
export const allServices = memo((s): Service[] => baseServices.map((x) => (x.id in s.prices ? { ...x, selfPay: s.prices[x.id] } : x)))
/** The list price before any change made in Settings (to show "was $95"). */
export const defaultPrice = (serviceId: string) => baseServices.find((x) => x.id === serviceId)?.selfPay
export const allStaff = memo((s): StaffUser[] => [...baseStaff, ...s.newStaff].map((u) => (s.staff[u.id] ? { ...u, ...s.staff[u.id] } : u)))
const allActivity = memo((s): ActivityEvent[] => [...s.activity, ...baseActivity])

const planMap = memo(() => new Map(allPlans().map((p) => [p.id, p])))
export const getPlanSync = (id: string) => planMap().get(id)
const doctorSlugMap = memo(() => new Map(allDoctors().map((d) => [d.slug, d])))
export const getDoctorBySlugSync = (slug: string) => doctorSlugMap().get(slug)
export const getClinicSync = (id: string) => clinics.find((c) => c.id === id)!
const staffMap = memo(() => new Map(allStaff().map((u) => [u.id, u])))
export const getStaffSync = (id: string) => staffMap().get(id)
/** The signed-in staff member (the session cookie in the browser; the demo admin elsewhere). */
export const currentUserId = () => getSessionSync()?.staffId ?? CURRENT_USER_ID
export const currentUser = () => getStaffSync(currentUserId())!

/** Who wrote something: staff, doctor (as staff), or the patient. */
export function authorName(id: string) {
  return getStaffSync(id)?.name ?? getPatientSync(id)?.name ?? getDoctorSync(id)?.name ?? "Linden Health"
}

/* --------------------------------- Helpers --------------------------------- */

function paginate<T>(rows: T[], page = 1, pageSize = 25): ListResult<T> {
  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const p = Math.min(Math.max(1, page), pageCount)
  return { rows: rows.slice((p - 1) * pageSize, p * pageSize), total, page: p, pageSize, pageCount }
}

function sortBy<T>(rows: T[], sort: Sort | null | undefined, accessors: Record<string, (t: T) => string | number | null | undefined>) {
  if (!sort || !accessors[sort.id]) return rows
  const get = accessors[sort.id]
  const dir = sort.desc ? -1 : 1
  return [...rows].sort((a, b) => {
    const x = get(a)
    const y = get(b)
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    return (x < y ? -1 : x > y ? 1 : 0) * dir
  })
}

/** Counts for each facet, applying every other facet's filter (standard faceted search). */
function facetCounts<T>(rows: T[], facets: Record<string, (t: T) => string | string[]>, active: Record<string, string[] | undefined>) {
  const out: Facets = {}
  const keys = Object.keys(facets)
  const matches = (t: T, except?: string) =>
    keys.every((k) => {
      if (k === except) return true
      const want = active[k]
      if (!want?.length) return true
      const v = facets[k](t)
      return Array.isArray(v) ? v.some((x) => want.includes(x)) : want.includes(v)
    })
  for (const k of keys) {
    const counts: Record<string, number> = {}
    for (const t of rows) {
      if (!matches(t, k)) continue
      const v = facets[k](t)
      for (const x of Array.isArray(v) ? v : [v]) counts[x] = (counts[x] ?? 0) + 1
    }
    out[k] = counts
  }
  return { out, filtered: rows.filter((t) => matches(t)) }
}

const norm = (s: string) => s.toLowerCase()
const digits = (s: string) => s.replace(/\D/g, "")

function matchesPatient(p: Patient, q: string) {
  const n = norm(q).trim()
  if (!n) return true
  const d = digits(q)
  return (
    norm(p.name).includes(n) ||
    norm(p.mrn).includes(n) ||
    norm(p.email).includes(n) ||
    (d.length >= 4 && digits(p.phone).includes(d)) ||
    fmtDateNumeric(p.dob) === q.trim()
  )
}

/* ------------------------------- Appointments ------------------------------ */

export type AppointmentFilters = {
  tab: "all" | "today" | "upcoming" | "no-shows" | "cancelled"
  from: string
  to: string
  status: string[]
  doctorId: string[]
  clinicId: string[]
  type: string[]
  visitType: string[]
  source: string[]
  forms: string[]
  insurance: string[]
}

const apptFacets = {
  status: (a: Appointment) => a.status,
  doctorId: (a: Appointment) => a.doctorId,
  clinicId: (a: Appointment) => a.clinicId,
  type: (a: Appointment) => a.type,
  visitType: (a: Appointment) => a.visitType,
  source: (a: Appointment) => a.source,
  forms: (a: Appointment) => (a.formsDone ? "done" : "pending"),
  insurance: (a: Appointment) => (a.insuranceVerified ? "verified" : "not-verified"),
}

export async function listAppointments(input: ListQuery<AppointmentFilters>, opts?: { latency?: boolean }): Promise<ListResultWithFacets<Appointment>> {
  if (opts?.latency !== false) await delay()
  const f = input.filters ?? {}
  const tab = f.tab ?? "all"
  let rows = allAppointments()
  if (tab === "today") rows = rows.filter((a) => dayOf(a.start) === TODAY)
  else if (tab === "upcoming") rows = rows.filter((a) => a.start > NOW && (a.status === "scheduled" || a.status === "confirmed"))
  else if (tab === "no-shows") rows = rows.filter((a) => a.status === "no-show")
  else if (tab === "cancelled") rows = rows.filter((a) => a.status === "cancelled" || a.status === "late-cancel")
  if (f.from) rows = rows.filter((a) => dayOf(a.start) >= f.from!)
  if (f.to) rows = rows.filter((a) => dayOf(a.start) <= f.to!)
  const q = input.q?.trim()
  if (q) {
    const n = norm(q)
    rows = rows.filter((a) => norm(a.id).includes(n) || matchesPatient(getPatientSync(a.patientId)!, q))
  }
  const { out: facets, filtered } = facetCounts(rows, apptFacets, f as Record<string, string[] | undefined>)
  const sorted = sortBy(filtered, input.sort ?? { id: "start", desc: tab === "no-shows" || tab === "cancelled" }, {
    start: (a) => a.start,
    patient: (a) => getPatientSync(a.patientId)?.lastName,
    doctor: (a) => getDoctorSync(a.doctorId)?.lastName,
    clinic: (a) => a.clinicId,
    status: (a) => a.status,
    visitType: (a) => a.visitType,
    type: (a) => a.type,
    source: (a) => a.source,
  })
  return { ...paginate(sorted, input.page, input.pageSize), facets }
}

/** Cancelling within 24 hours of the visit counts as a late cancel. */
export const isLateCancel = (a: Appointment) => a.start <= addMinutes(NOW, 24 * 60)

/** Booked → confirmed → arrived → checked in → roomed → done, from the timestamps we have. */
export function appointmentTimeline(a: Appointment) {
  const steps: { id: string; label: string; at?: string; done: boolean }[] = [
    { id: "booked", label: "Booked", at: a.bookedAt, done: true },
    { id: "confirmed", label: "Confirmed", at: a.confirmedAt, done: !!a.confirmedAt },
    { id: "arrived", label: a.type === "video" ? "Joined" : "Arrived", at: a.arrivedAt, done: !!a.arrivedAt || (a.type === "video" && !!a.checkedInAt) },
    { id: "checked-in", label: "Checked in", at: a.checkedInAt, done: !!a.checkedInAt },
    { id: "roomed", label: a.type === "video" ? "With doctor" : "Roomed", at: a.roomedAt, done: !!a.roomedAt },
    { id: "completed", label: "Completed", at: a.completedAt, done: !!a.completedAt },
  ]
  if (a.status === "cancelled" || a.status === "late-cancel") return [...steps.slice(0, 2), { id: "cancelled", label: a.status === "late-cancel" ? "Late cancel" : "Cancelled", at: a.cancelledAt, done: true }]
  if (a.status === "no-show") return [...steps.slice(0, 2), { id: "no-show", label: "No-show", at: addMinutes(a.start, 20), done: true }]
  return steps
}

/* --------------------------------- Patients -------------------------------- */

export type PatientFilters = {
  clinic: string[]
  primaryDoctorId: string[]
  insuranceCategory: string[]
  ageGroup: string[]
  flags: string[]
  balance: string[]
  newThisMonth: string[]
}

export const ageGroups = [
  { id: "0-12", label: "0–12", test: (a: number) => a <= 12 },
  { id: "13-17", label: "13–17", test: (a: number) => a >= 13 && a <= 17 },
  { id: "18-39", label: "18–39", test: (a: number) => a >= 18 && a <= 39 },
  { id: "40-64", label: "40–64", test: (a: number) => a >= 40 && a <= 64 },
  { id: "65+", label: "65+", test: (a: number) => a >= 65 },
]

const patientFacets = {
  clinic: (p: Patient) => p.preferredClinicId,
  primaryDoctorId: (p: Patient) => p.primaryDoctorId,
  insuranceCategory: (p: Patient) => (p.insurance ? getPlanSync(p.insurance.planId)!.category : "self-pay"),
  ageGroup: (p: Patient) => ageGroups.find((g) => g.test(p.age))!.id,
  flags: (p: Patient) => p.flags,
  balance: (p: Patient) => (p.balance > 0 ? "has-balance" : "none"),
  newThisMonth: (p: Patient) => (p.createdAt >= at(addDays(TODAY, -30), 0) ? "new" : "existing"),
}

/**
 * `doctorId` narrows the list to that doctor's patients ("My patients"): their primary-care
 * panel plus anyone booked or seen with them.
 */
export async function listPatients(input: ListQuery<PatientFilters> & { doctorId?: string }, opts?: { latency?: boolean }): Promise<ListResultWithFacets<Patient>> {
  if (opts?.latency !== false) await delay()
  let rows = allPatients()
  if (input.doctorId) {
    const seen = new Set(allAppointments().filter((a) => a.doctorId === input.doctorId).map((a) => a.patientId))
    rows = rows.filter((p) => p.primaryDoctorId === input.doctorId || seen.has(p.id))
  }
  if (input.q?.trim()) rows = rows.filter((p) => matchesPatient(p, input.q!))
  const { out: facets, filtered } = facetCounts(rows, patientFacets, (input.filters ?? {}) as Record<string, string[] | undefined>)
  const sorted = sortBy(filtered, input.sort ?? { id: "name", desc: false }, {
    name: (p) => `${p.lastName} ${p.firstName}`,
    dob: (p) => p.dob,
    primaryDoctor: (p) => getDoctorSync(p.primaryDoctorId)?.lastName,
    insurance: (p) => (p.insurance ? getPlanSync(p.insurance.planId)!.name : "zzz"),
    lastVisit: (p) => p.lastVisitAt,
    nextVisit: (p) => p.nextVisitAt,
    balance: (p) => p.balance,
  })
  return { ...paginate(sorted, input.page, input.pageSize), facets }
}

/** Lab results without the portal-only `personId`. */
export type AdminLabResult = Omit<LabResult, "personId">

/** Lab results for a patient. The Mitchells use their portal results; others get a basic panel from their last annual or lab visit. */
export function resultsFor(patientId: string): AdminLabResult[] {
  const p = getPatientSync(patientId)
  if (!p) return []
  if (p.portalId) return portalResults.filter((r) => r.personId === p.portalId)
  const visit = allAppointments()
    .filter((a) => a.patientId === patientId && a.status === "completed" && (a.visitType === "annual" || a.visitType === "lab"))
    .at(-1)
  if (!visit || p.age < 18) return []
  const rng = createRng([...patientId].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0)
  const hdlLow = p.sex === "F" ? 50 : 40
  const ldl = rng.int(70, p.conditions.includes("High cholesterol") ? 168 : 128)
  const glucose = rng.int(78, p.conditions.includes("Type 2 diabetes") ? 162 : 104)
  const a1c = Math.round((p.conditions.includes("Type 2 diabetes") ? rng.float(6.6, 8.2) : rng.float(4.8, 5.9)) * 10) / 10
  return [
    {
      id: `res-${visit.id}`,
      iso: dayOf(visit.start),
      date: dayOf(visit.start),
      title: "Annual blood work",
      type: "blood",
      orderedBy: getDoctorSync(visit.doctorId)!.slug,
      collected: `Collected ${dayOf(visit.start)}`,
      lab: `${getClinicSync(visit.clinicId).name} lab`,
      note: { text: "Reviewed. Discuss at next visit if anything is flagged.", date: dayOf(visit.start) },
      sections: [
        {
          title: "Heart health (lipids)",
          tests: [
            { id: "ldl", name: "LDL cholesterol", value: ldl, unit: "mg/dL", high: 99, range: "Under 100 mg/dL", about: "" },
            { id: "hdl", name: "HDL cholesterol", value: rng.int(hdlLow - 8, hdlLow + 22), unit: "mg/dL", low: hdlLow, range: `${hdlLow} mg/dL or higher`, about: "" },
            { id: "tg", name: "Triglycerides", value: rng.int(70, 190), unit: "mg/dL", high: 149, range: "Under 150 mg/dL", about: "" },
          ],
        },
        {
          title: "Blood sugar",
          tests: [
            { id: "glucose", name: "Glucose (fasting)", value: glucose, unit: "mg/dL", low: 70, high: 99, range: "70–99 mg/dL", about: "" },
            { id: "a1c", name: "Hemoglobin A1c", value: a1c, unit: "%", low: 4, high: 5.6, range: "4.0–5.6 %", about: "" },
          ],
        },
      ],
    },
  ]
}

export type PatientDetail = Awaited<ReturnType<typeof getPatientDetail>>

export async function getPatientDetail(id: string) {
  await delay(350)
  const patient = getPatientSync(id)
  if (!patient) return null
  const appts = allAppointments().filter((a) => a.patientId === id)
  const claimsFor = allClaims().filter((c) => c.patientId === id)
  const paymentsFor = allPayments().filter((x) => x.patientId === id)
  const threadsFor = allThreads().filter((t) => t.patientId === id)
  const refillsFor = allRefills().filter((r) => r.patientId === id)
  const vitalsFor = baseVitals.filter((v) => v.patientId === id)
  const activityFor = allActivity().filter((e) => e.patientId === id)
  const documents = patient.portalId
    ? portalDocuments.filter((d) => d.personId === patient.portalId).map((d) => ({ id: d.id, name: d.name, added: d.added, type: d.type, note: d.note }))
    : patient.insurance
      ? [{ id: `doc-${id}-card`, name: "Insurance card (front and back)", added: patient.createdAt.slice(0, 10), type: "Image" as const, note: undefined }]
      : []
  return {
    patient,
    appointments: appts,
    next: appts.find((a) => a.start > NOW && (a.status === "scheduled" || a.status === "confirmed")) ?? null,
    recent: appts.filter((a) => a.status === "completed").slice(-5).reverse(),
    claims: claimsFor,
    payments: paymentsFor,
    threads: threadsFor,
    refills: refillsFor,
    vitals: vitalsFor,
    results: resultsFor(id),
    documents,
    activity: activityFor,
    tasks: [
      ...appts.filter((a) => a.start > NOW && !a.formsDone && a.status !== "cancelled").map((a) => ({ id: `t-forms-${a.id}`, label: `Pre-visit forms for ${fmtDate(a.start)}`, tone: "attention" as const })),
      ...(patient.balance > 0 ? [{ id: "t-balance", label: `Balance due`, tone: "attention" as const }] : []),
      ...refillsFor.filter((r) => r.status === "new" || r.status === "routed").map((r) => ({ id: `t-${r.id}`, label: `${r.medication} ${r.dose} refill (${r.status})`, tone: "info" as const })),
      ...threadsFor.filter((t) => t.status === "open").map((t) => ({ id: `t-${t.id}`, label: `Reply to “${t.subject}”`, tone: "info" as const })),
    ],
  }
}

/* --------------------------------- Doctors --------------------------------- */

export type DoctorRow = Doctor & { todayBooked: number; todayCapacity: number; nextOpen: string | null; utilization: number }

/** Slot length for a working block: 20 minutes unless the block says otherwise (Dr. Chen's Mondays are 30). */
export const slotLength = (b: WorkBlock | null) => b?.slotMin ?? 20

/** Visit slots in a doctor's day, minus lunch. */
export function slotsInBlock(b: WorkBlock | null) {
  if (!b) return [] as number[]
  const out: number[] = []
  const step = slotLength(b)
  for (let t = b.start; t + step <= b.end; t += step) {
    if (b.lunch && t >= b.lunch[0] && t < b.lunch[1]) continue
    out.push(t)
  }
  return out
}

export function blockOn(d: Doctor, day: string, s: AdminState = getAdminState()) {
  const off = (s.timeOff[d.id] ?? []).some((o) => day >= o.from && day <= o.to)
  if (off) return null
  if (d.leave && day >= d.leave.from && day <= d.leave.to) return null
  return d.workingHours[weekday(day)] ?? null
}

function busyMinutes(list: Appointment[]) {
  return list.filter((a) => a.status !== "cancelled" && a.status !== "late-cancel")
}

/** Free visit starts (minutes after midnight) for a doctor on a day, after now. `ignoreId`: the visit being rescheduled. */
export function openSlots(doctorId: string, day: string, ignoreId?: string) {
  const d = getDoctorSync(doctorId)
  if (!d || !day) return [] as number[]
  const block = blockOn(d, day)
  const busy = busyMinutes(allAppointments().filter((a) => a.doctorId === doctorId && dayOf(a.start) === day && a.id !== ignoreId))
  const len = slotLength(block)
  return slotsInBlock(block).filter((t) => at(day, t) > NOW && !busy.some((a) => minutesOfDay(a.start) < t + len && minutesOfDay(a.start) + a.durationMin > t))
}

/** The next open visit slot from now in a doctor's schedule (looks ahead two weeks). */
function nextOpenSlot(d: Doctor) {
  for (let i = 0; i < 14; i++) {
    const day = addDays(TODAY, i)
    const first = openSlots(d.id, day)[0]
    if (first !== undefined) return at(day, first)
  }
  return null
}

export type DoctorFilters = Record<"specialty" | "clinic" | "accepting" | "status" | "language", string[]>

export async function listDoctors(input: ListQuery<DoctorFilters>): Promise<ListResultWithFacets<DoctorRow>> {
  await delay()
  const appts = allAppointments().filter((a) => dayOf(a.start) === TODAY)
  let rows: DoctorRow[] = allDoctors().map((d) => {
    const cap = slotsInBlock(blockOn(d, TODAY)).length
    const booked = busyMinutes(appts.filter((a) => a.doctorId === d.id)).length
    return { ...d, todayBooked: booked, todayCapacity: cap, nextOpen: nextOpenSlot(d), utilization: cap ? Math.min(1, booked / cap) : 0 }
  })
  if (input.q?.trim()) rows = rows.filter((d) => norm(d.name).includes(norm(input.q!)) || norm(d.specialty).includes(norm(input.q!)))
  const { out: facets, filtered } = facetCounts(
    rows,
    {
      specialty: (d: DoctorRow) => d.specialtyId,
      clinic: (d: DoctorRow) => d.clinicIds,
      accepting: (d: DoctorRow) => (d.acceptingNew ? "yes" : "no"),
      status: (d: DoctorRow) => d.status,
      language: (d: DoctorRow) => d.languages,
    },
    (input.filters ?? {}) as Record<string, string[] | undefined>
  )
  const sorted = sortBy(filtered, input.sort ?? { id: "name", desc: false }, {
    name: (d) => d.lastName,
    specialty: (d) => d.specialty,
    today: (d) => d.todayBooked,
    utilization: (d) => d.utilization,
    rating: (d) => d.rating,
    nextOpen: (d) => d.nextOpen,
  })
  return { ...paginate(sorted, input.page, input.pageSize ?? 50), facets }
}

export async function getDoctorDetail(id: string) {
  await delay(350)
  const doctor = getDoctorSync(id)
  if (!doctor) return null
  const s = getAdminState()
  const mine = allAppointments().filter((a) => a.doctorId === id)
  // Last 8 weeks, Monday-based.
  const monday = mondayOf(TODAY)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = addDays(monday, -7 * (7 - i))
    const to = addDays(from, 6)
    let cap = 0
    for (let d = from; d <= to; d = addDays(d, 1)) cap += slotsInBlock(blockOn(doctor, d, s)).length
    const inWeek = mine.filter((a) => dayOf(a.start) >= from && dayOf(a.start) <= to)
    const booked = busyMinutes(inWeek).length
    return { week: from, booked, capacity: cap, utilization: cap ? Math.min(1, booked / cap) : 0, noShows: inWeek.filter((a) => a.status === "no-show").length }
  })
  const past = mine.filter((a) => a.start < NOW && a.start >= at(addDays(TODAY, -56), 0))
  const done = past.filter((a) => a.status === "completed" && a.roomedAt && a.completedAt)
  return {
    doctor,
    weeks,
    noShowRate: past.length ? past.filter((a) => a.status === "no-show").length / past.length : 0,
    avgVisit: done.length ? Math.round(done.reduce((sum, a) => sum + minutesBetween(a.roomedAt!, a.completedAt!), 0) / done.length) : 0,
    upcoming: mine.filter((a) => a.start > NOW && (a.status === "scheduled" || a.status === "confirmed")).slice(0, 12),
    timeOff: [...(doctor.leave ? [{ id: "leave", from: doctor.leave.from, to: doctor.leave.to, reason: doctor.leave.reason }] : []), ...(s.timeOff[id] ?? [])],
    patientsCount: allPatients().filter((p) => p.primaryDoctorId === id).length,
  }
}

/* --------------------------------- Schedule -------------------------------- */

export type ScheduleColumn = {
  doctor: Doctor
  block: WorkBlock | null
  appointments: Appointment[]
  blocked: { start: number; end: number; label: string }[]
}

/** Lunch plus a weekly team meeting, shown as hatched blocks. */
function blockedTime(day: string, b: WorkBlock | null) {
  if (!b) return []
  const out: { start: number; end: number; label: string }[] = []
  if (b.lunch) out.push({ start: b.lunch[0], end: b.lunch[1], label: "Lunch" })
  const dow = weekday(day)
  if (dow === 3 && b.start <= 12 * 60 && b.end >= 12 * 60 + 30 && !b.lunch) out.push({ start: 12 * 60, end: 12 * 60 + 30, label: "Team meeting" })
  // Monday huddle, except on 30-minute-slot days (Dr. Chen sees her first patient at 8:00).
  if (dow === 1 && b.start === 8 * 60 && !b.slotMin) out.push({ start: 8 * 60, end: 8 * 60 + 15, label: "Huddle" })
  return out
}

export async function getSchedule(input: { day: string; clinic: "all" | ClinicId; doctorIds?: string[]; specialty?: string[] }) {
  await delay()
  const appts = allAppointments().filter((a) => dayOf(a.start) === input.day && (input.clinic === "all" || a.clinicId === input.clinic))
  const cols: ScheduleColumn[] = allDoctors()
    .filter((d) => (input.clinic === "all" || d.clinicIds.includes(input.clinic)) && (!input.doctorIds?.length || input.doctorIds.includes(d.id)) && (!input.specialty?.length || input.specialty.includes(d.specialtyId)))
    .map((d) => {
      const b = blockOn(d, input.day)
      return { doctor: d, block: b, appointments: appts.filter((a) => a.doctorId === d.id), blocked: blockedTime(input.day, b) }
    })
    .filter((c) => c.block || c.appointments.length)
  return { columns: cols, stats: scheduleStats(input.day, "all") }
}

/** Booked, open slots (20 minutes, or the block’s own length), and utilization for a day. */
export function scheduleStats(day: string, clinic: "all" | ClinicId) {
  const appts = allAppointments().filter((a) => dayOf(a.start) === day && (clinic === "all" || a.clinicId === clinic))
  let booked = 0
  let open = 0
  let capacity = 0
  for (const d of allDoctors()) {
    const b = blockOn(d, day)
    if (!b || (clinic !== "all" && b.clinicId !== clinic)) continue
    const mine = busyMinutes(appts.filter((a) => a.doctorId === d.id))
    const blocks = blockedTime(day, b)
    const len = slotLength(b)
    const slots = slotsInBlock(b).filter((t) => !blocks.some((x) => t < x.end && t + len > x.start))
    capacity += slots.length
    for (const t of slots) if (!mine.some((a) => minutesOfDay(a.start) < t + len && minutesOfDay(a.start) + a.durationMin > t)) open++
  }
  booked = busyMinutes(appts).length
  return { booked, open, capacity, utilization: capacity ? Math.min(1, (capacity - open) / capacity) : 0 }
}

export async function getWeek(input: { from: string; clinic: "all" | ClinicId }) {
  await delay()
  const days = Array.from({ length: 7 }, (_, i) => addDays(input.from, i))
  const appts = allAppointments()
  const s = getAdminState()
  const rows = allDoctors()
    .filter((d) => input.clinic === "all" || d.clinicIds.includes(input.clinic))
    .map((d) => ({
      doctor: d,
      days: days.map((day) => {
        const b = blockOn(d, day, s)
        const cap = slotsInBlock(b).length
        const booked = busyMinutes(appts.filter((a) => a.doctorId === d.id && dayOf(a.start) === day)).length
        return { day, booked, capacity: cap, utilization: cap ? Math.min(1, booked / cap) : 0, off: !b }
      }),
    }))
  return { days, rows }
}

/* ---------------------------------- Queue ---------------------------------- */

export type QueueColumn = "arrived" | "checked-in" | "waiting" | "with-doctor" | "done"

export const queueColumn = (s: AppointmentStatus): QueueColumn | null =>
  s === "arrived" ? "arrived" : s === "checked-in" ? "checked-in" : s === "waiting" ? "waiting" : s === "with-doctor" ? "with-doctor" : s === "completed" ? "done" : null

/** Minutes a patient has been waiting at `now` (since check-in, or arrival). */
export function waitMinutes(a: Appointment, now = NOW) {
  const since = a.status === "with-doctor" ? null : (a.arrivedAt ?? a.checkedInAt)
  return since ? Math.max(0, minutesBetween(since, now)) : 0
}

/** Waits under 15 minutes are fine, 15–25 need attention, over 25 are urgent. */
export const waitLevel = (min: number) => (min > 25 ? "red" : min >= 15 ? "amber" : "normal")

/** Today's in-person visits at a clinic that are on the queue board (read synchronously so moves show instantly). */
export function queueRowsSync(clinic: ClinicId) {
  return allAppointments().filter((a) => a.clinicId === clinic && dayOf(a.start) === TODAY && a.type === "in-person" && queueColumn(a.status))
}

export async function getQueue(clinic: ClinicId, opts?: { latency?: boolean }) {
  if (opts?.latency !== false) await delay(250)
  return queueRowsSync(clinic)
}

/* ----------------------------- Claims + billing ---------------------------- */

export type ClaimFilters = { status: string[]; planId: string[]; category: string[]; from: string; to: string; min: string; max: string }

export async function listClaims(input: ListQuery<ClaimFilters>): Promise<ListResultWithFacets<Claim>> {
  await delay()
  const f = input.filters ?? {}
  let rows = allClaims()
  if (f.from) rows = rows.filter((c) => c.serviceDate >= f.from!)
  if (f.to) rows = rows.filter((c) => c.serviceDate <= f.to!)
  if (f.min) rows = rows.filter((c) => c.amountBilled >= Number(f.min))
  if (f.max) rows = rows.filter((c) => c.amountBilled <= Number(f.max))
  if (input.q?.trim()) {
    const n = norm(input.q)
    rows = rows.filter((c) => norm(c.claimNumber).includes(n) || matchesPatient(getPatientSync(c.patientId)!, input.q!))
  }
  const { out: facets, filtered } = facetCounts(
    rows,
    { status: (c: Claim) => c.status, planId: (c: Claim) => c.planId, category: (c: Claim) => getPlanSync(c.planId)!.category },
    { status: f.status, planId: f.planId, category: f.category }
  )
  const sorted = sortBy(filtered, input.sort ?? { id: "updated", desc: true }, {
    claim: (c) => c.claimNumber,
    patient: (c) => getPatientSync(c.patientId)?.lastName,
    service: (c) => c.serviceDate,
    plan: (c) => getPlanSync(c.planId)?.name,
    billed: (c) => c.amountBilled,
    paid: (c) => c.amountPaid,
    owes: (c) => c.patientResponsibility,
    status: (c) => c.status,
    updated: (c) => c.updatedAt,
  })
  return { ...paginate(sorted, input.page, input.pageSize), facets }
}

export async function listPayments(input: ListQuery<{ method: string[]; from: string; to: string }>): Promise<ListResultWithFacets<Payment>> {
  await delay()
  const f = input.filters ?? {}
  let rows = allPayments()
  if (f.from) rows = rows.filter((p) => dayOf(p.createdAt) >= f.from!)
  if (f.to) rows = rows.filter((p) => dayOf(p.createdAt) <= f.to!)
  if (input.q?.trim()) {
    const n = norm(input.q)
    rows = rows.filter((p) => norm(p.reference).includes(n) || matchesPatient(getPatientSync(p.patientId)!, input.q!))
  }
  const { out: facets, filtered } = facetCounts(rows, { method: (p: Payment) => p.method }, { method: f.method })
  const sorted = sortBy(filtered, input.sort ?? { id: "date", desc: true }, { date: (p) => p.createdAt, patient: (p) => getPatientSync(p.patientId)?.lastName, amount: (p) => p.amount, method: (p) => p.method })
  return { ...paginate(sorted, input.page, input.pageSize), facets }
}

export type BalanceRow = { patient: Patient; balance: number; oldest: string; bucket: "0-30" | "31-60" | "61-90" | "90+" }

export const agingBuckets = ["0-30", "31-60", "61-90", "90+"] as const

/** Aging summary for the chart: per bucket, the total owed, the patient count and the split by preferred clinic. */
export type AgingSummary = { bucket: BalanceRow["bucket"]; total: number; count: number; byClinic: Record<ClinicId, number> }[]

/** Patient balances, plus `aging` over every balance (before search and filters). */
export async function listBalances(input: ListQuery<{ bucket: string[] }>): Promise<ListResultWithFacets<BalanceRow> & { aging: AgingSummary }> {
  await delay()
  const claimsByPatient = new Map<string, Claim[]>()
  for (const c of allClaims()) if (c.patientResponsibility > 0) claimsByPatient.set(c.patientId, [...(claimsByPatient.get(c.patientId) ?? []), c])
  let rows: BalanceRow[] = allPatients()
    .filter((p) => p.balance > 0)
    .map((p) => {
      const oldest = (claimsByPatient.get(p.id) ?? []).map((c) => c.serviceDate).sort()[0] ?? TODAY
      const age = daysBetween(oldest, TODAY)
      return { patient: p, balance: p.balance, oldest, bucket: age <= 30 ? "0-30" : age <= 60 ? "31-60" : age <= 90 ? "61-90" : "90+" }
    })
  const aging: AgingSummary = agingBuckets.map((bucket) => {
    const inBucket = rows.filter((r) => r.bucket === bucket)
    const byClinic = Object.fromEntries(clinics.map((c) => [c.id, Math.round(inBucket.filter((r) => r.patient.preferredClinicId === c.id).reduce((s, r) => s + r.balance, 0) * 100) / 100])) as Record<ClinicId, number>
    return { bucket, total: inBucket.reduce((s, r) => s + r.balance, 0), count: inBucket.length, byClinic }
  })
  if (input.q?.trim()) rows = rows.filter((r) => matchesPatient(r.patient, input.q!))
  const { out: facets, filtered } = facetCounts(rows, { bucket: (r: BalanceRow) => r.bucket }, { bucket: input.filters?.bucket })
  const sorted = sortBy(filtered, input.sort ?? { id: "balance", desc: true }, { patient: (r) => r.patient.lastName, balance: (r) => r.balance, oldest: (r) => r.oldest })
  return { ...paginate(sorted, input.page, input.pageSize), facets, aging }
}

/* --------------------------------- Refunds --------------------------------- */

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** A dozen refunds derived deterministically from generated payments, so the list is stable across refreshes. */
const baseRefunds: Refund[] = (() => {
  const pool = basePayments.filter((p) => p.amount >= 20 && p.createdAt <= NOW && hash(p.id) % 7 === 0)
  const step = Math.max(1, Math.floor(pool.length / 12))
  const reasons = billingCopy.refunds.reasons
  return Array.from({ length: Math.min(12, pool.length) }, (_, i) => pool[i * step])
    .map((p) => {
      const h = hash(p.reference)
      const reason = reasons[h % reasons.length]
      const full = reason === "Copay charged twice" || reason === "Visit cancelled after payment"
      const amount = full ? p.amount : Math.max(5, Math.round(p.amount * (0.2 + (h % 40) / 100) * 100) / 100)
      const requested = addDays(dayOf(p.createdAt), 1 + (h % 4))
      const age = daysBetween(requested, TODAY)
      const status: RefundStatus = age > 12 ? "issued" : age > 4 ? "approved" : "pending"
      return { id: `rf-${p.id}`, payment: p, amount, reason, requestedAt: requested > TODAY ? TODAY : requested, status }
    })
    .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1))
})()

/** Refund requests, newest first, with this tab's issued refunds applied. */
export async function listRefunds(): Promise<Refund[]> {
  await delay(250)
  const issued = getAdminState().refundsIssued
  return baseRefunds.map((r) => (issued[r.id] ? { ...r, status: "issued" } : r))
}

export function billingStats() {
  const monthStart = TODAY.slice(0, 8) + "01"
  const pays = allPayments()
  const collected = pays.filter((p) => dayOf(p.createdAt) >= monthStart && p.createdAt <= NOW).reduce((s, p) => s + p.amount, 0)
  const cl = allClaims()
  const insuranceMonth = cl.filter((c) => c.status === "paid" && dayOf(c.updatedAt) >= monthStart).reduce((s, c) => s + c.amountPaid, 0)
  const outstanding = cl.filter((c) => c.status === "submitted" || c.status === "pending" || c.status === "appealed").reduce((s, c) => s + (c.amountBilled - c.amountPaid), 0) + allPatients().reduce((s, p) => s + p.balance, 0)
  const decided = cl.filter((c) => c.status === "paid" || c.status === "denied" || c.status === "appealed")
  const denialRate = decided.length ? decided.filter((c) => c.status !== "paid").length / decided.length : 0
  const paid = cl.filter((c) => c.status === "paid")
  const daysToPay = paid.length ? paid.reduce((s, c) => s + daysBetween(c.serviceDate, dayOf(c.updatedAt)), 0) / paid.length : 0
  return { collected: collected + insuranceMonth, outstanding, denialRate, daysToPay }
}

export type ClaimStep = { id: string; label: string; at?: string; tone: "red" | "done" | "todo"; by?: string }

/** Visit → submitted → payer decision, plus this tab's resubmits, appeals and write-offs (from the activity log). */
export function claimTimeline(c: Claim): ClaimStep[] {
  const steps: ClaimStep[] = [{ id: "visit", label: "Visit", at: c.serviceDate, tone: "done" }]
  if (c.status === "draft") {
    steps.push({ id: "submitted", label: "Submit to payer", tone: "todo" })
    return steps
  }
  steps.push({ id: "submitted", label: "Submitted to payer", at: c.submittedAt, tone: "done" })
  const events = allActivity()
    .filter((e) => e.entityType === "claim" && e.entityId === c.id && e.type !== "claim-denied")
    .reverse()
    .map((e): ClaimStep => ({ id: e.id, label: e.summary, at: e.at, tone: "done", by: authorName(e.actorId) }))
  if (c.status === "paid") steps.push({ id: "paid", label: `Paid ${fmtMoney(c.amountPaid)} by payer`, at: c.updatedAt, tone: "done" })
  else if (c.status === "denied") steps.push({ id: "denied", label: `Denied: ${c.denialReason ?? "No reason given"}`, at: c.updatedAt, tone: "red" })
  else if (c.status === "appealed") {
    if (c.denialReason) steps.push({ id: "denied", label: `Denied: ${c.denialReason}`, tone: "red" })
    if (!events.length) steps.push({ id: "appealed", label: "Appeal filed", at: c.updatedAt, tone: "done" })
  } else steps.push({ id: "decision", label: "Waiting on payer decision", tone: "todo" })
  return [...steps, ...events]
}

/* -------------------------------- Messages --------------------------------- */

export async function listThreads(input: ListQuery<Record<"status" | "topic" | "priority" | "mine" | "unread", string[]>>): Promise<ListResultWithFacets<MessageThread>> {
  await delay(250)
  const f = input.filters ?? {}
  let rows: MessageThread[] = allThreads()
  if (input.q?.trim()) {
    const n = norm(input.q)
    rows = rows.filter((t) => norm(t.subject).includes(n) || matchesPatient(getPatientSync(t.patientId)!, input.q!) || t.messages.some((m) => norm(m.body).includes(n)))
  }
  if (f.mine?.includes("yes")) rows = rows.filter((t) => t.assignedToId === currentUserId())
  if (f.unread?.includes("yes")) rows = rows.filter((t) => t.unread)
  const { out: facets, filtered } = facetCounts(rows, { status: (t: MessageThread) => t.status, topic: (t: MessageThread) => t.topic, priority: (t: MessageThread) => t.priority }, { status: f.status, topic: f.topic, priority: f.priority })
  const sorted = sortBy(filtered, input.sort ?? { id: "last", desc: true }, { last: (t) => t.lastMessageAt, priority: (t) => (t.priority === "high" ? 1 : 0) })
  return { ...paginate(sorted, input.page ?? 1, input.pageSize ?? 20), facets }
}

/** Over 24 hours since the patient wrote, with no reply yet. */
export const waitingTooLong = (t: MessageThread) => t.status !== "closed" && t.messages.filter((m) => !m.internal).at(-1)?.from === "patient" && minutesBetween(t.lastMessageAt, NOW) > 24 * 60

/* -------------------------------- Overview --------------------------------- */

export async function getOverview(clinic: "all" | ClinicId) {
  await delay()
  const inClinic = (a: Appointment) => clinic === "all" || a.clinicId === clinic
  const appts = allAppointments()
  const today = appts.filter((a) => dayOf(a.start) === TODAY && inClinic(a))
  const lastWeek = appts.filter((a) => dayOf(a.start) === addDays(TODAY, -7) && inClinic(a))
  const waiting = today.filter((a) => a.status === "waiting" || a.status === "checked-in" || a.status === "arrived")
  const waits = waiting.map((a) => waitMinutes(a))
  const series = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(TODAY, i - 13)
    const list = appts.filter((a) => dayOf(a.start) === day && inClinic(a))
    return { day, booked: busyMinutes(list).length, completed: list.filter((a) => a.status === "completed").length, noShows: list.filter((a) => a.status === "no-show").length }
  })
  const stats = scheduleStats(TODAY, clinic)
  return {
    firstName: currentUser().name.replace(/^Dr\. /, "").split(" ")[0],
    today: busyMinutes(today).length,
    todayDelta: busyMinutes(today).length - busyMinutes(lastWeek).length,
    checkedIn: today.filter((a) => ["checked-in", "waiting", "with-doctor", "completed"].includes(a.status)).length,
    waiting: waiting.length,
    avgWait: waits.length ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length) : 0,
    longestWait: waits.length ? Math.max(...waits) : 0,
    noShows: today.filter((a) => a.status === "no-show").length,
    open: stats.open,
    utilization: stats.utilization,
    series,
    queue: today.filter((a) => ["arrived", "checked-in", "waiting", "with-doctor"].includes(a.status)).sort((a, b) => waitMinutes(b) - waitMinutes(a)),
    upcoming: today.filter((a) => a.start > NOW && (a.status === "confirmed" || a.status === "scheduled")).slice(0, 6),
    unreadThreads: allThreads().filter((t) => t.unread).length,
    overdueThreads: allThreads().filter(waitingTooLong).length,
    newRefills: allRefills().filter((r) => r.status === "new").length,
    deniedClaims: allClaims().filter((c) => c.status === "denied").length,
    formsPending: today.filter((a) => !a.formsDone && a.start > NOW).length,
    unverified: today.filter((a) => !a.insuranceVerified && a.start > NOW).length,
    billing: billingStats(),
    activity: allActivity().slice(0, 8),
  }
}

/* -------------------------------- Reports ---------------------------------- */

export async function getReport(input: { from: string; to: string; clinic: "all" | ClinicId }) {
  await delay(450)
  const inRange = (day: string) => day >= input.from && day <= input.to
  const inClinic = (a: { clinicId: ClinicId }) => input.clinic === "all" || a.clinicId === input.clinic
  const appts = allAppointments().filter((a) => inRange(dayOf(a.start)) && inClinic(a) && a.start <= NOW)
  const span = daysBetween(input.from, input.to) + 1
  const prevFrom = addDays(input.from, -span)
  const prevTo = addDays(input.from, -1)
  const prev = allAppointments().filter((a) => dayOf(a.start) >= prevFrom && dayOf(a.start) <= prevTo && inClinic(a))

  const weekKey = mondayOf
  const daily = new Map<string, { day: string; booked: number; completed: number }>()
  for (const a of appts) {
    const k = span > 45 ? weekKey(dayOf(a.start)) : dayOf(a.start)
    const row = daily.get(k) ?? { day: k, booked: 0, completed: 0 }
    if (a.status !== "cancelled" && a.status !== "late-cancel") row.booked++
    if (a.status === "completed") row.completed++
    daily.set(k, row)
  }
  const weekly = new Map<string, { week: string; total: number; noShows: number; cancels: number }>()
  for (const a of appts) {
    const k = weekKey(dayOf(a.start))
    const row = weekly.get(k) ?? { week: k, total: 0, noShows: 0, cancels: 0 }
    row.total++
    if (a.status === "no-show") row.noShows++
    if (a.status === "cancelled" || a.status === "late-cancel") row.cancels++
    weekly.set(k, row)
  }
  const done = appts.filter((a) => a.status === "completed")
  const bySpecialty = specialties.map((s) => ({ name: s.name, visits: done.filter((a) => getDoctorSync(a.doctorId)!.specialtyId === s.id).length }))
  const byType = [
    { name: "In person", value: done.filter((a) => a.type === "in-person").length },
    { name: "Video", value: done.filter((a) => a.type === "video").length },
  ]
  const waitOf = (a: Appointment) => (a.checkedInAt && a.roomedAt ? minutesBetween(a.checkedInAt, a.roomedAt) : null)
  const waitByClinic = clinics.map((c) => {
    const w = done.filter((a) => a.clinicId === c.id).map(waitOf).filter((x): x is number => x !== null)
    return { name: c.short, minutes: w.length ? Math.round((w.reduce((s, x) => s + x, 0) / w.length) * 10) / 10 : 0 }
  })
  const waitByHour = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i
    const w = done.filter((a) => Math.floor(minutesOfDay(a.start) / 60) === hour).map(waitOf).filter((x): x is number => x !== null)
    return { hour: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`, minutes: w.length ? Math.round(w.reduce((s, x) => s + x, 0) / w.length) : 0 }
  })
  const months = new Map<string, { month: string; billed: number; collected: number }>()
  const claimsInRange = allClaims().filter((c) => inRange(c.serviceDate) && inClinic(getAppointmentSync(c.appointmentId) ?? { clinicId: "cleveland" }))
  for (const c of claimsInRange) {
    const k = c.serviceDate.slice(0, 7)
    const row = months.get(k) ?? { month: k, billed: 0, collected: 0 }
    row.billed += c.amountBilled
    row.collected += c.amountPaid
    months.set(k, row)
  }
  for (const p of allPayments().filter((x) => inRange(dayOf(x.createdAt)))) {
    const k = dayOf(p.createdAt).slice(0, 7)
    const row = months.get(k) ?? { month: k, billed: 0, collected: 0 }
    row.collected += p.amount
    months.set(k, row)
  }
  const payerMix = (["commercial", "regional", "senior", "community", "marketplace", "service"] as const).map((cat) => ({ name: cat, value: claimsInRange.filter((c) => getPlanSync(c.planId)!.category === cat).length }))
  const firstVisit = new Map<string, string>()
  for (const a of allAppointments()) if (a.status === "completed" && !firstVisit.has(a.patientId)) firstVisit.set(a.patientId, dayOf(a.start))
  const newReturning = [...weekly.keys()].sort().map((wk) => {
    const inWeek = done.filter((a) => weekKey(dayOf(a.start)) === wk)
    const isNew = (a: Appointment) => a.visitType === "new-patient" || firstVisit.get(a.patientId) === dayOf(a.start)
    return { week: wk, new: inWeek.filter(isNew).length, returning: inWeek.filter((a) => !isNew(a)).length }
  })
  const utilization = allDoctors()
    .filter((d) => input.clinic === "all" || d.clinicIds.includes(input.clinic))
    .map((d) => {
      let cap = 0
      for (let day = input.from; day <= input.to && day <= TODAY; day = addDays(day, 1)) cap += slotsInBlock(blockOn(d, day)).length
      const booked = busyMinutes(appts.filter((a) => a.doctorId === d.id)).length
      return { name: d.name.replace(/^Dr\. /, ""), utilization: cap ? Math.min(1, booked / cap) : 0 }
    })
    .sort((a, b) => b.utilization - a.utilization)

  const kpi = (list: Appointment[]) => {
    const completed = list.filter((a) => a.status === "completed")
    const w = completed.map(waitOf).filter((x): x is number => x !== null)
    return {
      visits: completed.length,
      noShowRate: list.length ? list.filter((a) => a.status === "no-show").length / list.length : 0,
      avgWait: w.length ? w.reduce((s, x) => s + x, 0) / w.length : 0,
      video: completed.length ? completed.filter((a) => a.type === "video").length / completed.length : 0,
    }
  }
  return {
    kpis: { current: kpi(appts), previous: kpi(prev), revenue: claimsInRange.reduce((s, c) => s + c.amountPaid, 0) },
    appointments: [...daily.values()].sort((a, b) => (a.day < b.day ? -1 : 1)),
    rates: [...weekly.values()].sort((a, b) => (a.week < b.week ? -1 : 1)).map((w) => ({ week: w.week, noShow: w.total ? w.noShows / w.total : 0, cancel: w.total ? w.cancels / w.total : 0 })),
    bySpecialty,
    byType,
    waitByClinic,
    waitByHour,
    revenue: [...months.values()].sort((a, b) => (a.month < b.month ? -1 : 1)),
    payerMix,
    newReturning,
    utilization,
  }
}

/* -------------------------------- Audit log -------------------------------- */

/** The activity log, newest first: search the summary or the person, filter by area (`entity`). */
export async function listActivity(input: ListQuery<{ entity: string[] }>): Promise<ListResultWithFacets<ActivityEvent>> {
  await delay(250)
  const n = input.q?.trim().toLowerCase()
  const rows = allActivity().filter((e) => !n || e.summary.toLowerCase().includes(n) || authorName(e.actorId).toLowerCase().includes(n))
  const { out: facets, filtered } = facetCounts(rows, { entity: (e: ActivityEvent) => e.entityType }, { entity: input.filters?.entity })
  const sorted = [...filtered].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  return { ...paginate(sorted, input.page, input.pageSize), facets }
}

/* ------------------------------ Global search ------------------------------ */

const adminPages = adminNavItems.map((i) => ({ label: i.label, href: i.href }))

export async function globalSearch(q: string) {
  await delay(120)
  const n = norm(q).trim()
  if (!n) return { patients: [], appointments: [], claims: [], doctors: [], pages: adminPages.slice(0, 6) }
  const patients = allPatients().filter((p) => matchesPatient(p, q)).slice(0, 5)
  const ids = new Set(patients.map((p) => p.id))
  const appointments = allAppointments()
    .filter((a) => (ids.has(a.patientId) || norm(a.id).includes(n)) && a.start >= at(addDays(TODAY, -7), 0))
    .slice(0, 5)
  const claims = allClaims()
    .filter((c) => norm(c.claimNumber).includes(n) || ids.has(c.patientId))
    .slice(0, 4)
  const doctors = allDoctors()
    .filter((d) => norm(d.name).includes(n) || norm(d.specialty).includes(n))
    .slice(0, 4)
  const pages = adminPages.filter((p) => norm(p.label).includes(n))
  return { patients, appointments, claims, doctors, pages }
}


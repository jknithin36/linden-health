// Fictional data for demo purposes only.
// Types for the Linden Health admin dashboard. Timestamps are local wall-clock strings
// ("2026-10-19T14:25"), so every viewer sees the same clinic times regardless of time zone.

export type ClinicId = "cleveland" | "lakewood" | "beachwood"

/** Opening hours for one weekday, in minutes after midnight. `videoOnly` days have no in-person visits. */
export type DayHours = { open: number; close: number; videoOnly?: boolean } | null

export type Clinic = {
  id: ClinicId
  name: string
  short: string
  address: string
  phone: string
  email: string
  rooms: number
  /** Index 0 = Sunday … 6 = Saturday. */
  hours: DayHours[]
}

export type Credential = "MD" | "DO" | "NP" | "PA"

/** One working block on a weekday, in minutes after midnight, with an optional lunch break. */
export type WorkBlock = { clinicId: ClinicId; start: number; end: number; lunch?: [number, number]; /** Visit slot length in minutes (default 20). */ slotMin?: number }

export type Doctor = {
  id: string
  slug: string
  firstName: string
  lastName: string
  name: string
  credential: Credential
  specialtyId: string
  specialty: string
  clinicIds: ClinicId[]
  languages: string[]
  rating: number
  reviewCount: number
  yearsExperience: number
  acceptingNew: boolean
  avatar?: string
  /** Index 0 = Sunday … 6 = Saturday; null = not working. */
  workingHours: (WorkBlock | null)[]
  status: "active" | "on-leave"
  leave?: { from: string; to: string; reason: string }
}

export type Sex = "F" | "M"

export type PatientFlag = "high-risk" | "new" | "balance-due" | "forms-pending"

export type Patient = {
  id: string
  mrn: string
  firstName: string
  lastName: string
  name: string
  dob: string
  age: number
  sex: Sex
  phone: string
  email: string
  address: string
  city: string
  preferredClinicId: ClinicId
  primaryDoctorId: string
  insurance: { planId: string; planType: string; memberId: string } | null
  allergies: string[]
  conditions: string[]
  flags: PatientFlag[]
  createdAt: string
  lastVisitAt: string | null
  nextVisitAt: string | null
  balance: number
  /** Links a demo patient to their portal account (the Mitchell family). */
  portalId?: string
}

export type VisitType = "sick" | "annual" | "follow-up" | "new-patient" | "specialist" | "vaccine" | "lab"

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "arrived"
  | "checked-in"
  | "waiting"
  | "with-doctor"
  | "completed"
  | "no-show"
  | "cancelled"
  | "late-cancel"

export type Appointment = {
  id: string
  patientId: string
  doctorId: string
  clinicId: ClinicId
  room?: number
  start: string
  durationMin: number
  type: "in-person" | "video"
  reason: string
  visitType: VisitType
  status: AppointmentStatus
  bookedAt: string
  confirmedAt?: string
  arrivedAt?: string
  checkedInAt?: string
  roomedAt?: string
  completedAt?: string
  cancelledAt?: string
  formsDone: boolean
  insuranceVerified: boolean
  copay: number
  source: "online" | "phone" | "walk-in" | "app"
}

export type PlanCategory = "commercial" | "regional" | "senior" | "community" | "marketplace" | "service"

export type InsurancePlan = {
  id: string
  name: string
  category: PlanCategory
  planTypes: string[]
  coverage: ClinicId[]
  active: boolean
}

export type ClaimStatus = "draft" | "submitted" | "pending" | "paid" | "denied" | "appealed"

export type ClaimLine = { code: string; label: string; billed: number; allowed: number; paid: number }

export type Claim = {
  id: string
  claimNumber: string
  appointmentId: string
  patientId: string
  planId: string
  serviceDate: string
  lines: ClaimLine[]
  amountBilled: number
  amountPaid: number
  patientResponsibility: number
  status: ClaimStatus
  denialReason?: string
  submittedAt: string
  updatedAt: string
}

export type PaymentMethod = "card" | "hsa" | "cash" | "check"

export type Payment = {
  id: string
  patientId: string
  amount: number
  method: PaymentMethod
  last4?: string
  createdAt: string
  appointmentId?: string
  reference: string
}

export type MessageTopic = "symptoms" | "results" | "prescription" | "appointment" | "billing" | "other"

export type Message = {
  id: string
  from: "patient" | "staff"
  authorId: string
  body: string
  createdAt: string
  /** Staff-only note, never shown to the patient. */
  internal?: boolean
  attachments?: string[]
}

export type MessageThread = {
  id: string
  patientId: string
  subject: string
  topic: MessageTopic
  assignedToId: string
  status: "open" | "waiting" | "closed"
  priority: "normal" | "high"
  lastMessageAt: string
  unread: boolean
  messages: Message[]
}

export type RefillRequest = {
  id: string
  patientId: string
  medication: string
  dose: string
  doctorId: string
  status: "new" | "routed" | "approved" | "denied"
  createdAt: string
  note?: string
}

export type StaffRole = "admin" | "front-desk" | "nurse" | "billing" | "doctor"

export type StaffUser = {
  id: string
  name: string
  role: StaffRole
  title: string
  clinicIds: ClinicId[]
  email: string
  lastActiveAt: string
  status: "active" | "invited"
}

export type ActivityEvent = {
  id: string
  at: string
  actorId: string
  type: string
  summary: string
  entityType: "appointment" | "patient" | "claim" | "payment" | "message" | "refill" | "settings"
  entityId: string
  patientId?: string
}

export type Vitals = {
  patientId: string
  appointmentId: string
  date: string
  systolic: number
  diastolic: number
  heartRate: number
  weightLb: number
  heightIn: number
  bmi: number
  tempF: number
}

export type Service = { id: string; name: string; code: string; durationMin: number; selfPay: number; category: string }

/* ------------------------------ Clinical (doctor) ------------------------------ */

export type Diagnosis = { code: string; label: string }

export type Order = { id: string; type: "lab" | "imaging" | "referral" | "vaccine"; name: string; status: "ordered" | "resulted" | "cancelled" }

export type PrescriptionDraft = { medication: string; dose: string; frequency: string; quantity: number; refills: number; pharmacy: string }

export type NoteVitals = {
  bpSystolic: number | null
  bpDiastolic: number | null
  heartRate: number | null
  tempF: number | null
  respRate: number | null
  spo2: number | null
  weightLb: number | null
  heightIn: number | null
  bmi: number | null
  painScore: number | null
}

export type VisitNote = {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  status: "not-started" | "in-progress" | "signed"
  vitals: NoteVitals
  subjective: { chiefComplaint: string; historyOfPresentIllness: string; symptoms: string[] }
  objective: { exam: string }
  assessment: { diagnoses: Diagnosis[] }
  plan: { text: string; orders: Order[]; prescriptions: PrescriptionDraft[]; followUp?: { inDays: number; reason: string } }
  patientInstructions: string
  signedAt?: string
  updatedAt: string
}

export type InboxItem = {
  id: string
  type: "result" | "refill" | "message" | "form" | "note-to-sign"
  patientId: string
  doctorId: string
  createdAt: string
  priority: "normal" | "high"
  status: "new" | "done"
  summary: string
  /** Lab panel, refill, thread, form or appointment id, by type. */
  refId: string
}

/** One lab test with its reference range and earlier values (oldest first). */
export type LabTest = { name: string; value: number; unit: string; low?: number; high?: number; history: { date: string; value: number }[] }

export type LabPanel = { id: string; patientId: string; doctorId: string; title: string; collectedAt: string; resultedAt: string; tests: LabTest[] }

export type Medication = { id: string; patientId: string; name: string; dose: string; frequency: string; prescriberId: string; startedAt: string; lastFilledAt: string; refillsLeft: number; status: "active" | "stopped" }

export type SchoolForm = { id: string; patientId: string; title: string; requestedBy: string; createdAt: string }

/** Planned time off for a doctor (dates inclusive). */
export type TimeOff = { id: string; from: string; to: string; reason: string }

export type RefundStatus = "pending" | "approved" | "issued"

export type Refund = { id: string; payment: Payment; amount: number; reason: string; requestedAt: string; status: RefundStatus }

/* ------------------------------- List contract ------------------------------ */

export type Sort = { id: string; desc: boolean }

/**
 * Input every list query takes (see lib/admin/queries.ts): free-text search, facet filters
 * (multi-select values as arrays, ranges as strings), one sort column, and a 1-based page.
 */
export type ListQuery<F extends object = Record<string, string[] | string>> = {
  q?: string
  filters?: Partial<F>
  sort?: Sort | null
  page?: number
  pageSize?: number
}

export type ListResult<T> = { rows: T[]; total: number; page: number; pageSize: number; pageCount: number }

/** Counts per facet value, each computed with every other facet's filter applied. */
export type Facets = Record<string, Record<string, number>>

export type ListResultWithFacets<T> = ListResult<T> & { facets: Facets }

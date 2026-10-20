// Fictional data for demo purposes only.
// Admin changes made in this browser tab (check-ins, queue moves, payments, notes, settings…),
// layered over the generated data and kept in sessionStorage so they survive navigation.
// The server and the first client render always see the untouched data, so hydration matches.
// With a real backend this file shrinks to UI state (clinic switcher) plus a cache-busting
// `version`: mutations in lib/admin/actions call the API, then bump the version to refetch.

import { useSyncExternalStore } from "react"

import type {
  ActivityEvent,
  Appointment,
  Claim,
  ClinicId,
  Message,
  MessageThread,
  Patient,
  Payment,
  RefillRequest,
  StaffRole,
  StaffUser,
  TimeOff,
  WorkBlock,
  VisitNote,
  Medication,
} from "@/lib/admin/types"
import { NOW } from "@/lib/admin/format"
import { CURRENT_USER_ID } from "@/lib/admin/data"
import { getSessionSync } from "@/lib/session-client"

export type AdminState = {
  version: number
  /** The clinic switcher in the sidebar. */
  clinic: "all" | ClinicId
  /** Demo role switcher; front desk can't edit prices or roles. */
  role: StaffRole
  appointments: Record<string, Partial<Appointment>>
  newAppointments: Appointment[]
  claims: Record<string, Partial<Claim>>
  claimNotes: Record<string, string[]>
  payments: Payment[]
  /** Refunds issued in this tab, by refund id. */
  refundsIssued: Record<string, string>
  threads: Record<string, Partial<Pick<MessageThread, "status" | "assignedToId" | "unread" | "priority">> & { added?: Message[] }>
  newPatients: Patient[]
  /** Conversations started from the admin in this tab. */
  newThreads: MessageThread[]
  patients: Record<string, Partial<Patient>>
  refills: Record<string, Partial<RefillRequest>>
  prices: Record<string, number>
  plansActive: Record<string, boolean>
  staff: Record<string, Partial<StaffUser>>
  newStaff: StaffUser[]
  doctorHours: Record<string, (WorkBlock | null)[]>
  timeOff: Record<string, TimeOff[]>
  reminders: { id: string; label: string; offsetHours: number; channel: string; enabled: boolean }[] | null
  activity: ActivityEvent[]
  /** Doctor view: edited or signed visit notes by appointment id. */
  notes: Record<string, VisitNote>
  /** Doctor view: inbox items handled in this tab. */
  inbox: Record<string, { status: "new" | "done"; at: string; action: string }>
  /** Doctor view: a patient's medication list after refills or new prescriptions. */
  meds: Record<string, Medication[]>
  /** Queue cards changed in the last refresh, for a soft highlight. */
  changed: string[]
}

const KEY = "linden.admin.v1"

const initial: AdminState = {
  version: 0,
  clinic: "all",
  role: "admin",
  appointments: {},
  newAppointments: [],
  claims: {},
  claimNotes: {},
  payments: [],
  refundsIssued: {},
  threads: {},
  newPatients: [],
  newThreads: [],
  patients: {},
  refills: {},
  prices: {},
  plansActive: {},
  staff: {},
  newStaff: [],
  doctorHours: {},
  timeOff: {},
  reminders: null,
  activity: [],
  notes: {},
  inbox: {},
  meds: {},
  changed: [],
}

let state: AdminState = initial
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) state = { ...initial, ...(JSON.parse(raw) as Partial<AdminState>) }
  } catch {
    // Storage can be blocked; changes then last for this page view only.
  }
}

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...state, changed: [] }))
  } catch {
    // ignore
  }
}

/** Current state for queries (always the initial state on the server). */
export function getAdminState(): AdminState {
  load()
  return state
}

export function setAdminState(update: (s: AdminState) => Partial<AdminState>) {
  load()
  state = { ...state, ...update(state), version: state.version + 1 }
  save()
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

/** React hook: re-renders on every admin change. Initial state during SSR and hydration. */
export function useAdminState<T>(select: (s: AdminState) => T): T {
  return useSyncExternalStore(subscribe, () => select(getAdminState()), () => select(initial))
}

/** Clear every demo change (Settings → Reset demo data). */
export function resetAdminState() {
  state = { ...initial, version: state.version + 1 }
  save()
  listeners.forEach((l) => l())
}

let eventSeq = 0
export function logActivity(e: Omit<ActivityEvent, "id" | "at" | "actorId"> & { actorId?: string; at?: string }) {
  setAdminState((s) => ({
    activity: [{ id: `ev-new-${Date.now()}-${eventSeq++}`, at: e.at ?? NOW, actorId: e.actorId ?? getSessionSync()?.staffId ?? CURRENT_USER_ID, ...e } as ActivityEvent, ...s.activity].slice(0, 200),
  }))
}

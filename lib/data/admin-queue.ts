// Fictional data for demo purposes only.
// Copy for the admin check-in queue (/admin/queue).

import type { QueueColumn } from "@/lib/admin/queries"

export const queueCopy = {
  clinicLabel: "Clinic queue",
  columns: [
    { id: "arrived", label: "Arrived", empty: "No one waiting to check in." },
    { id: "checked-in", label: "Checked in", empty: "No one checked in yet." },
    { id: "waiting", label: "Waiting", empty: "No one in the waiting room." },
    { id: "with-doctor", label: "With doctor", empty: "All rooms are free." },
    { id: "done", label: "Done today", empty: "No visits finished yet." },
  ] satisfies { id: QueueColumn; label: string; empty: string }[],
  stats: {
    avgWait: "Average wait",
    longestWait: "Longest wait",
    inClinic: "Patients in clinic",
    rooms: "Rooms in use",
  },
  autoRefresh: "Updates every 30 seconds",
  addWalkIn: "Add walk-in",
  moveTo: "Move to…",
  dragHint: "Drag cards between columns, or use Move to… on any card.",
  badges: { forms: "Forms pending", insurance: "Insurance not verified", walkIn: "Walk-in" },
  room: {
    title: "Choose a room",
    description: (name: string) => `Pick an exam room for ${name}. Rooms in use can’t be chosen.`,
    inUse: "In use",
    confirm: "Move to room",
    none: "Every room is in use. Finish a visit first.",
  },
  walkIn: {
    title: "Add walk-in",
    description: (clinic: string) => `Add someone who just walked in at ${clinic}. They start in Arrived.`,
    existing: "Existing patient",
    create: "New patient",
    submit: "Add to queue",
    reasonPlaceholder: "e.g. Sore throat since yesterday…",
    noDoctors: "No providers are working at this clinic today.",
  },
  showAllDone: (n: number) => `Show all ${n}`,
  showFewer: "Show fewer",
} as const

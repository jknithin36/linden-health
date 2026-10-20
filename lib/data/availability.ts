// Demo availability. Days use fixed labels (Today, Tomorrow, Thu…) to match the rest of the site,
// and times are generated deterministically per doctor, so server and client always agree.

import type { Doctor, DoctorSlot } from "@/lib/data/doctors"

export type AvailabilityDay = { id: string; label: string; slots: DoctorSlot[] }

const DAYS = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "mon", label: "Mon" },
]

const TIMES = [
  { hhmm: "0830", label: "8:30 AM" },
  { hhmm: "0900", label: "9:00 AM" },
  { hhmm: "1030", label: "10:30 AM" },
  { hhmm: "1145", label: "11:45 AM" },
  { hhmm: "1315", label: "1:15 PM" },
  { hhmm: "1430", label: "2:30 PM" },
  { hhmm: "1630", label: "4:30 PM" },
  { hhmm: "1745", label: "5:45 PM" },
]

/** Small stable hash so each doctor gets a different but repeatable schedule. */
function seed(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/** Five days of open times for a doctor. Always includes the doctor's listed `slots`. */
export function availabilityFor(doctor: Pick<Doctor, "id" | "slots"> | null): AvailabilityDay[] {
  const base = seed(doctor?.id ?? "any")
  return DAYS.map((day, d) => {
    const picked = TIMES.filter((_, t) => ((base >> ((d * 3 + t) % 24)) + d + t) % 3 !== 0).slice(0, 5)
    const slots: DoctorSlot[] = picked.map((t) => ({ value: `${day.id}-${t.hhmm}`, label: `${day.label} ${t.label}` }))
    for (const s of doctor?.slots ?? []) {
      if (s.value.startsWith(`${day.id}-`) && !slots.some((x) => x.value === s.value)) slots.push(s)
    }
    slots.sort((a, b) => a.value.localeCompare(b.value))
    return { ...day, slots }
  })
}

/** "4:30 PM" from "Today 4:30 PM". */
export const timeOf = (label: string) => label.replace(/^(Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/, "")

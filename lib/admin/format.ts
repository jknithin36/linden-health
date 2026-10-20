// Fictional data for demo purposes only.
// Formatting and time helpers for the admin. All times are local wall-clock strings
// ("2026-10-19T14:25"); "now" is pinned so waits, lateness and overdue counts never drift.

import { format } from "date-fns"

/** The demo day (Monday) and minute. Clinics are in America/New_York. */
export const TODAY = "2026-10-19"
export const NOW = "2026-10-19T14:25"

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" as a local date (never as UTC). */
export function parseLocal(s: string) {
  const [d, t = "00:00"] = s.split("T")
  const [y, m, day] = d.split("-").map(Number)
  const [h, mi] = t.split(":").map(Number)
  return new Date(y, m - 1, day, h, mi)
}

const pad = (n: number) => String(n).padStart(2, "0")

/** "YYYY-MM-DDTHH:MM" from a Date's local parts. */
export function stamp(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const dayOf = (s: string) => s.slice(0, 10)
export const minutesOfDay = (s: string) => Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16))

/** "2026-10-19" + 870 → "2026-10-19T14:30". */
export const at = (day: string, minutes: number) => `${day}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

export function addMinutes(s: string, m: number) {
  const total = stampMinutes(s) + m
  const day = Math.floor(total / 1440)
  const mins = total - day * 1440
  return at(dayFromIndex(day), mins)
}

/** Days since 1970-01-01 for a "YYYY-MM-DD" string (calendar math, no time zone involved). */
function dayIndex(day: string) {
  return Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))) / 86_400_000
}

const fromIndex = new Map<number, string>()
function dayFromIndex(i: number) {
  let s = fromIndex.get(i)
  if (!s) {
    const d = new Date(i * 86_400_000)
    s = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    fromIndex.set(i, s)
  }
  return s
}

export const addDays = (day: string, n: number) => dayFromIndex(dayIndex(day) + n)

/** 0 = Sunday … 6 = Saturday. */
export const weekday = (day: string) => (dayIndex(day) + 4) % 7

/** The Monday on or before a day (weeks run Monday to Sunday). */
export const mondayOf = (day: string) => addDays(day, -((weekday(day) + 6) % 7))

/** Weekday names by index (0 = Sunday), and the Monday-first display order of those indexes. */
export const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const
export const weekOrder = [1, 2, 3, 4, 5, 6, 0] as const

const stampMinutes = (s: string) => dayIndex(s) * 1440 + (s.length > 10 ? minutesOfDay(s) : 0)

export const minutesBetween = (a: string, b: string) => stampMinutes(b) - stampMinutes(a)

export const daysBetween = (a: string, b: string) => dayIndex(b) - dayIndex(a)

/* --------------------------------- Display --------------------------------- */

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const moneyRound = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const number = new Intl.NumberFormat("en-US")

/** "$1,234.56" */
export const fmtMoney = (n: number) => money.format(n)
/** "$1,235" for big summary numbers. */
export const fmtMoneyRound = (n: number) => moneyRound.format(n)
export const fmtNumber = (n: number) => number.format(n)
export const fmtPercent = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`

/** "Mon, Oct 19" */
export const fmtDate = (s: string) => format(parseLocal(s), "EEE, MMM d")
/** "Monday, October 19" */
export const fmtDateFull = (s: string) => format(parseLocal(s), "EEEE, MMMM d")
/** "Oct 19, 2026" */
export const fmtDateLong = (s: string) => format(parseLocal(s), "MMM d, yyyy")
/** "10/19/2026" */
export const fmtDateNumeric = (s: string) => format(parseLocal(s), "MM/dd/yyyy")
/** "2:30 PM" */
export const fmtTime = (s: string) => format(parseLocal(s), "h:mm a")
/** "Mon, Oct 19 · 2:30 PM" */
export const fmtDateTime = (s: string) => `${fmtDate(s)} · ${fmtTime(s)}`
/** "2:30 PM" for minutes after midnight. */
export const fmtClock = (minutes: number) => fmtTime(at(TODAY, minutes))

/** "in 2 days", "14 min ago", "just now", relative to the pinned now. */
export function relative(s: string, now = NOW) {
  const mins = minutesBetween(now, s)
  const abs = Math.abs(mins)
  const ago = mins < 0
  if (abs < 1) return "just now"
  if (abs < 60) return ago ? `${abs} min ago` : `in ${abs} min`
  const sameDay = dayOf(s) === dayOf(now)
  if (sameDay) {
    const h = Math.round(abs / 60)
    return ago ? `${h} hr ago` : `in ${h} hr`
  }
  const days = daysBetween(now, s)
  if (days === 1) return "tomorrow"
  if (days === -1) return "yesterday"
  if (Math.abs(days) < 7) return days > 0 ? `in ${days} days` : `${-days} days ago`
  if (Math.abs(days) < 60) {
    const w = Math.round(Math.abs(days) / 7)
    return days > 0 ? `in ${w} wk` : `${w} wk ago`
  }
  const mo = Math.round(Math.abs(days) / 30)
  return days > 0 ? `in ${mo} mo` : `${mo} mo ago`
}

export function ageOn(dob: string, day = TODAY) {
  const [y, m, d] = dob.split("-").map(Number)
  const [ty, tm, td] = day.split("-").map(Number)
  return ty - y - (m > tm || (m === tm && d > td) ? 1 : 0)
}

/** Age in whole years, or in months under 2 years old. */
function age(dob: string) {
  const years = ageOn(dob)
  return years >= 2 ? { n: years, unit: "years" as const } : { n: Math.max(0, daysBetween(dob, TODAY) / 30.4) | 0, unit: "months" as const }
}

/** "38 · F", or "7 mo · M" for babies. */
export function ageLabel(dob: string, sex: string) {
  const a = age(dob)
  return a.unit === "years" ? `${a.n} · ${sex}` : `${a.n} mo · ${sex}`
}

/** "38 years", or "7 months" for babies. */
export function ageText(dob: string) {
  const a = age(dob)
  return `${a.n} ${a.n === 1 ? a.unit.slice(0, -1) : a.unit}`
}

export const fmtMrn = (n: number) => `LH-${String(n).padStart(6, "0")}`

/** "(216) 555-0186" from digits. */
export function fmtPhone(digits: string) {
  const d = digits.replace(/\D/g, "")
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : digits
}

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

/** Simulated network latency so skeletons are visible. */
export const delay = (ms?: number) => new Promise((r) => setTimeout(r, ms ?? 300 + Math.floor(Math.random() * 300)))

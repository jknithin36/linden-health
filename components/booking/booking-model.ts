// State, options and helpers for the booking flow. Fictional demo data only.
// Backend seam: doctors, availability and the account come from lib/data today. With an API, load
// them in the /book page (server) and pass them in, and send `confirm` (see booking-flow) to e.g.
// POST /api/appointments instead of computing a demo confirmation number.

import { z } from "zod"

import { availabilityFor, type AvailabilityDay } from "@/lib/data/availability"
import { bookingAccount, bookingCopy as copy } from "@/lib/data/booking"
import type { PersonId } from "@/lib/data/portal"
import { clinicFor } from "@/lib/data/clinics"
import { doctors, type Doctor } from "@/lib/data/doctors"
import { extraServices } from "@/lib/data/services"
import { locationName, site } from "@/lib/data/site"
import { specialties } from "@/lib/data/specialties"

type CareOption = { id: string; label: string; summary: string; kind: "specialty" | "service"; inPersonOnly?: boolean; locations?: string[] }

/** Video visits are a format, not a kind of care, so they aren't in the list. */
export const careOptions: CareOption[] = [
  ...specialties.map((s) => ({ id: s.id, label: s.name, summary: s.summary, kind: "specialty" as const })),
  ...extraServices
    .filter((s) => s.id !== "video")
    .map((s) => ({
      id: s.id,
      label: s.name,
      summary: s.summary,
      kind: "service" as const,
      inPersonOnly: ["labs", "imaging", "vaccines", "physical-therapy"].includes(s.id),
      ...(s.id === "imaging" ? { locations: ["Cleveland", "Beachwood"] } : {}),
    })),
]
export const careById = (id: string | null) => careOptions.find((c) => c.id === id) ?? null

/** Accepts a doctor id ("dr-chen") or a profile slug ("emily-chen"). */
export const findDoctor = (idOrSlug: string | null) => doctors.find((d) => d.id === idOrSlug || d.slug === idOrSlug) ?? null

export type Format = "in-person" | "video"

export type BookingState = {
  care: string | null
  format: Format
  reason: string
  /** A family member on the account, or "other". */
  person: PersonId | "other"
  clinic: string
  doctorId: string | null
  slot: string | null
  details: Details
}

export const detailsSchema = z
  .object({
    firstName: z.string().trim().min(1, copy.errors.firstName),
    lastName: z.string().trim().min(1, copy.errors.lastName),
    dob: z.string().min(1, copy.errors.dob),
    email: z.email(copy.errors.email),
    phone: z.string().trim().regex(/^[+()\d\s-]{10,}$/, copy.errors.phone),
    patientType: z.enum(["returning", "new"]),
    insurance: z.enum(["plan", "self"]),
    plan: z.string().nullable(),
    memberId: z.string(),
    texts: z.boolean(),
  })
  .refine((d) => d.insurance === "self" || !!d.plan, { message: copy.errors.plan, path: ["plan"] })

export type Details = z.infer<typeof detailsSchema>
export type DetailErrors = Partial<Record<keyof Details | "care" | "slot", string>>

/** Details for a person, pre-filled from the signed-in account. */
export function detailsFor(person: PersonId | "other", keep?: Details): Details {
  const a = bookingAccount
  const contact = { email: keep?.email ?? a.email, phone: keep?.phone ?? a.phone, texts: keep?.texts ?? true }
  if (person === "other") return { firstName: "", lastName: "", dob: "", patientType: "new", insurance: "plan", plan: null, memberId: "", ...contact }
  const m = a.family.find((f) => f.id === person)!
  const [firstName, ...rest] = m.name.split(" ")
  return { firstName, lastName: rest.join(" "), dob: a.dob[person], patientType: "returning", insurance: "plan", plan: a.insurance.plan, memberId: a.insurance.memberId, ...contact }
}

export const memberFor = (person: PersonId | "other") => (person === "other" ? null : bookingAccount.family.find((f) => f.id === person) ?? null)

/** Doctors who offer this kind of care, at the chosen clinic (any clinic for video). */
export function doctorsFor(state: Pick<BookingState, "care" | "clinic" | "format">): Doctor[] {
  const care = careById(state.care)
  if (!care || care.kind !== "specialty") return []
  return doctors.filter((d) => d.specialtyId === care.id && (state.format === "video" || state.clinic === "all" || d.location === state.clinic))
}

/** The person's own doctor first. */
export const sortForPerson = (list: Doctor[], person: PersonId | "other") => {
  const slug = memberFor(person)?.primaryDoctor.slug
  return [...list].sort((a, b) => Number(b.slug === slug) - Number(a.slug === slug))
}

/** Clinics that offer this care in person. */
export function clinicsFor(careId: string | null) {
  const care = careById(careId)
  return [...site.locations].filter((l) => !care?.locations || care.locations.includes(l))
}

/** Cached per doctor: the flow asks for the same schedules many times per render (list, summary, review). */
const availabilityCache = new Map<string, AvailabilityDay[]>()
export function availabilityForState(doctorId: string | null): AvailabilityDay[] {
  const key = doctorId ?? "any"
  let days = availabilityCache.get(key)
  if (!days) availabilityCache.set(key, (days = availabilityFor(findDoctor(doctorId))))
  return days
}

export const slotLabelFor = (doctorId: string | null, slot: string | null) => (slot ? availabilityForState(doctorId).flatMap((d) => d.slots).find((s) => s.value === slot)?.label ?? null : null)

/** Where the visit happens, in words. */
export function whereFor(state: Pick<BookingState, "format" | "doctorId" | "clinic" | "care">) {
  if (state.format === "video") return copy.videoWhere
  const d = findDoctor(state.doctorId)
  if (d) return locationName(d.location)
  return locationName(state.clinic === "all" ? clinicsFor(state.care)[0] : state.clinic)
}

export const clinicLocationFor = (state: Pick<BookingState, "format" | "doctorId" | "clinic" | "care">) => {
  const d = findDoctor(state.doctorId)
  return clinicFor(d ? d.location : state.clinic === "all" ? clinicsFor(state.care)[0] : state.clinic)
}

/* ------------------------------ Calendar file ------------------------------ */

/** The demo week: "Today" is Monday, Oct 19, 2026. */
const dayDates: Record<string, string> = { today: "20261019", tomorrow: "20261020", thu: "20261022", fri: "20261023", mon: "20261026" }

export function calendarFile(state: BookingState, title: string) {
  if (!state.slot) return null
  const [dayId, hhmm] = state.slot.split("-")
  const date = dayDates[dayId] ?? "20261019"
  const start = `${date}T${hhmm}00`
  const endMin = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2)) + 30
  const end = `${date}T${String(Math.floor(endMin / 60)).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00`
  const where = state.format === "video" ? copy.videoWhere : clinicLocationFor(state).address
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Booking demo//EN`,
    "BEGIN:VEVENT",
    `UID:${state.slot}-${state.doctorId ?? "any"}@lindenhealth.example`,
    `DTSTART;TZID=America/New_York:${start}`,
    `DTEND;TZID=America/New_York:${end}`,
    `SUMMARY:${title}`,
    `LOCATION:${where.replace(/,/g, "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

/** A stable confirmation number for the demo. */
export function confirmationFor(state: BookingState) {
  const text = `${state.slot}${state.doctorId}${state.details.email}`
  let h = 7
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `LH-${String(h % 900_000 + 100_000)}`
}

const dobFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

/** "Mar 9, 1988" from "1988-03-09". */
export const formatDob = (iso: string) => dobFormat.format(new Date(`${iso}T00:00:00Z`))

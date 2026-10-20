// Fictional data for demo purposes only.
// The admin dataset, generated once from fixed seeds so every refresh (server or browser) is
// identical. Clinics, doctors, plans and the Mitchell family come from the public site and the
// patient portal, so both apps always agree. Everything else is generated around them.
// This file stands in for your database: screens should read it through lib/admin/queries (route
// files use the id maps below for notFound and metadata). Values are seeded, so editing the
// generators changes the demo (e.g. Dr. Chen's day in the doctor view).

import { clinics as siteClinics } from "@/lib/data/clinics"
import { doctors as siteDoctors } from "@/lib/data/doctors"
import { insurancePlans as sitePlans } from "@/lib/data/insurance"
import { pastVisits, upcomingVisits } from "@/lib/data/visits"
import { bills as portalBills } from "@/lib/data/billing"
import { vitals as portalVitals } from "@/lib/data/portal"
import { conversations } from "@/lib/data/messages"
import {
  allergyPool,
  areaCodes,
  cityByClinic,
  conditionsByAge,
  createRng,
  denialReasons,
  femaleNames,
  lastNames,
  maleNames,
  reasons,
  selfPay,
  streets,
  zipByCity,
  type Rng,
} from "@/lib/admin/seed"
import { addDays, addMinutes, ageOn, at, dayOf, fmtMrn, minutesBetween, minutesOfDay, NOW, parseLocal, stamp, TODAY, weekday } from "@/lib/admin/format"
import type {
  ActivityEvent,
  Appointment,
  AppointmentStatus,
  Claim,
  ClaimLine,
  Clinic,
  ClinicId,
  DayHours,
  Doctor,
  InsurancePlan,
  MessageThread,
  Patient,
  Payment,
  PaymentMethod,
  PlanCategory,
  RefillRequest,
  Service,
  StaffUser,
  VisitType,
  Vitals,
  WorkBlock,
} from "@/lib/admin/types"

export const RANGE = { from: "2026-08-20", to: "2026-11-20" }
const NOW_MIN = minutesOfDay(NOW)
const h = (s: string) => {
  const [hh, mm = "0"] = s.split(":")
  return Number(hh) * 60 + Number(mm)
}

/* ---------------------------------- Clinics -------------------------------- */

const dh = (open: string, close: string, videoOnly?: boolean): DayHours => ({ open: h(open), close: h(close), ...(videoOnly ? { videoOnly } : {}) })

// Same opening hours as the public site's clinic pages.
export const clinics: Clinic[] = [
  {
    id: "cleveland",
    name: "Linden Health Cleveland",
    short: "Cleveland",
    address: siteClinics.Cleveland.address,
    phone: "(216) 555-0101",
    email: "cleveland@lindenhealth.example.com",
    rooms: 8,
    hours: [null, dh("8", "17"), dh("8", "17"), dh("12", "20"), dh("8", "17"), dh("8", "17", true), null],
  },
  {
    id: "lakewood",
    name: "Linden Health Lakewood",
    short: "Lakewood",
    address: siteClinics.Lakewood.address,
    phone: "(216) 555-0102",
    email: "lakewood@lindenhealth.example.com",
    rooms: 6,
    hours: [null, dh("7:30", "18"), dh("7:30", "18"), dh("7:30", "18"), dh("7:30", "18"), dh("8", "14"), dh("9", "13", true)],
  },
  {
    id: "beachwood",
    name: "Linden Health Beachwood",
    short: "Beachwood",
    address: siteClinics.Beachwood.address,
    phone: "(216) 555-0103",
    email: "beachwood@lindenhealth.example.com",
    rooms: 6,
    hours: [null, dh("8", "17"), dh("10", "19"), dh("8", "17"), dh("10", "19"), dh("8", "17"), dh("9", "13")],
  },
]

const clinicByLocation: Record<string, ClinicId> = { Cleveland: "cleveland", Lakewood: "lakewood", Beachwood: "beachwood" }

/* ---------------------------------- Doctors -------------------------------- */

/** "8-17L" = 8 AM–5 PM with a noon lunch; "13-17" = 1–5 PM. Index 0 = Sunday. */
type Sched = (string | null)[]
const block = (clinicId: ClinicId, spec: string | null): WorkBlock | null => {
  if (!spec) return null
  const lunch = spec.endsWith("L")
  const [s, e] = spec.replace(/L$/, "").split("-")
  const start = h(s)
  const end = h(e)
  return { clinicId, start, end, ...(lunch ? { lunch: [start < h("12") ? h("12") : h("13"), start < h("12") ? h("13") : h("14")] as [number, number] } : {}) }
}

const schedules: Record<string, Sched> = {
  // Cleveland
  "emily-chen": [null, "8-17L", "8-17L", "12-20", "8-12", "8-12", null],
  "omar-khalil": [null, "8-12", "13-17", "12-20", "8-17L", "13-17", null],
  "michael-brooks": [null, "13-17", "8-12", null, "8-17L", null, null],
  "laura-bennett": [null, "10-17L", "8-17L", "14-20", "13-17", "8-12", null],
  "denise-harper": [null, "9-13", null, "12-18", "8-17L", null, null],
  "grace-park": [null, "13-17", "8-17L", null, "13-17", null, null],
  "richard-hale": [null, null, "8-17L", "12-18", "8-12", "8-12", null],
  // Lakewood
  "arjun-patel": [null, "8-12", "8-17L", null, "8-17L", null, null],
  "hannah-okafor": [null, "13-17", "8-12", "8-17L", null, "8-14", null],
  "priya-nair": [null, "8-16L", "8-16L", "13-18", "8-12", null, "9-13"],
  "marcus-johnson": [null, "9-13", null, "8-17L", "13-18", "8-14", null],
  "erik-lindqvist": [null, null, "13-18", "8-12", "8-17L", null, null],
  "margaret-ellis": [null, null, null, "8-17L", null, "8-14", null],
  "ryan-cole": [null, "13-17", "8-12", null, "13-18", "8-14", null],
  "jordan-reyes": [null, "7:30-11:30", "13-18", "7:30-16L", "7:30-11:30", null, "9-13"],
  // Beachwood
  "sofia-ramirez": [null, "8-16L", "10-19L", "8-12", null, "8-17L", "9-13"],
  "daniel-kim": [null, "9-13", null, "8-17L", "10-14", null, null],
  "claire-donovan": [null, "13-17", "10-19L", "13-17", "10-19L", null, "9-13"],
  "amira-haddad": [null, null, "10-14", "8-17L", null, "8-17L", null],
  "kenji-tanaka": [null, "8-12", "14-19", null, "10-14", "8-12", null],
  "javier-morales": [null, null, "10-19L", null, "10-19L", "13-17", null],
  "maya-thornton": [null, "13-17", null, "13-17", "14-19", "8-12", "9-13"],
}

const extraProviders = [
  { id: "np-reyes", slug: "jordan-reyes", name: "Jordan Reyes", credential: "NP" as const, specialtyId: "family-medicine", specialty: "Family medicine", location: "Lakewood", languages: ["English", "Spanish"], rating: 4.8, reviewCount: 96, years: 9 },
  { id: "pa-thornton", slug: "maya-thornton", name: "Maya Thornton", credential: "PA" as const, specialtyId: "pediatrics", specialty: "Pediatrics", location: "Beachwood", languages: ["English"], rating: 4.9, reviewCount: 74, years: 6 },
]

export const doctors: Doctor[] = [
  ...siteDoctors.map((d) => {
    const [firstName, ...rest] = d.name.replace(/^Dr\. /, "").split(" ")
    const clinicId = clinicByLocation[d.location]
    return {
      id: d.id,
      slug: d.slug,
      firstName,
      lastName: rest.join(" "),
      name: d.name,
      credential: d.credentials as Doctor["credential"],
      specialtyId: d.specialtyId,
      specialty: d.specialty,
      clinicIds: [clinicId],
      languages: d.languages,
      rating: d.rating,
      reviewCount: d.reviewCount,
      yearsExperience: d.yearsExperience,
      acceptingNew: d.acceptingNewPatients,
      avatar: d.image,
      workingHours: schedules[d.slug].map((s) => block(clinicId, s)),
      status: d.slug === "margaret-ellis" ? ("on-leave" as const) : ("active" as const),
      ...(d.slug === "margaret-ellis" ? { leave: { from: "2026-10-05", to: "2026-11-01", reason: "Family leave" } } : {}),
    }
  }),
  ...extraProviders.map((p) => {
    const [firstName, lastName] = p.name.split(" ")
    const clinicId = clinicByLocation[p.location]
    return {
      id: p.id,
      slug: p.slug,
      firstName,
      lastName,
      name: `${p.name}, ${p.credential}`,
      credential: p.credential,
      specialtyId: p.specialtyId,
      specialty: p.specialty,
      clinicIds: [clinicId],
      languages: p.languages,
      rating: p.rating,
      reviewCount: p.reviewCount,
      yearsExperience: p.years,
      acceptingNew: true,
      workingHours: schedules[p.slug].map((s) => block(clinicId, s)),
      status: "active" as const,
    }
  }),
]

// Dr. Emily Chen books 30-minute visits on Mondays: 8 AM–6 PM with a noon lunch, 18 slots.
{
  const chen = doctors.find((d) => d.slug === "emily-chen")!
  chen.workingHours[1] = { clinicId: "cleveland", start: h("8"), end: h("18"), lunch: [h("12"), h("13")], slotMin: 30 }
}

export const doctorById = new Map(doctors.map((d) => [d.id, d]))
const doctorBySlugMap = new Map(doctors.map((d) => [d.slug, d]))
export const doctorBySlug = (slug: string) => doctorBySlugMap.get(slug)

export const specialties = [
  { id: "family-medicine", name: "Family medicine" },
  { id: "pediatrics", name: "Pediatrics" },
  { id: "womens-health", name: "Women’s health" },
  { id: "dermatology", name: "Dermatology" },
  { id: "cardiology", name: "Cardiology" },
  { id: "orthopedics", name: "Orthopedics" },
]

/** Is this doctor working at a clinic on a day (and not on leave)? */
function workBlockOn(d: Doctor, day: string): WorkBlock | null {
  if (d.leave && day >= d.leave.from && day <= d.leave.to) return null
  return d.workingHours[weekday(day)] ?? null
}

/* ---------------------------------- Plans ---------------------------------- */

export const plans: InsurancePlan[] = sitePlans.map((p) => ({
  id: `plan-${p.number}`,
  name: p.name,
  category: p.category as PlanCategory,
  planTypes: p.types,
  coverage: p.locations === "all" ? (["cleveland", "lakewood", "beachwood"] as ClinicId[]) : p.locations.map((l) => clinicByLocation[l]),
  active: true,
}))
const planById = new Map(plans.map((p) => [p.id, p]))
const northbridge = plans.find((p) => p.name === "Northbridge Health")!

const planPrefix = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .padEnd(3, "X")

/* --------------------------------- Services -------------------------------- */

export const services: Service[] = [
  { id: "sick", name: "Sick visit", code: "99213", durationMin: 20, selfPay: selfPay.sick, category: "Primary care" },
  { id: "video", name: "Video visit", code: "99213-95", durationMin: 20, selfPay: selfPay.video, category: "Primary care" },
  { id: "annual", name: "Annual physical", code: "99396", durationMin: 40, selfPay: selfPay.annual, category: "Preventive" },
  { id: "new-patient", name: "New patient visit", code: "99204", durationMin: 40, selfPay: selfPay["new-patient"], category: "Primary care" },
  { id: "follow-up", name: "Follow-up visit", code: "99213", durationMin: 20, selfPay: selfPay["follow-up"], category: "Primary care" },
  { id: "specialist", name: "Specialist visit", code: "99214", durationMin: 30, selfPay: selfPay.specialist, category: "Specialty" },
  { id: "lab", name: "Lab draw", code: "36415", durationMin: 15, selfPay: selfPay.lab, category: "Lab" },
  { id: "xray", name: "X-ray (single view)", code: "73560", durationMin: 15, selfPay: selfPay.xray, category: "Imaging" },
  { id: "flu", name: "Flu shot", code: "90686", durationMin: 15, selfPay: selfPay.vaccine, category: "Vaccines" },
]

/* ---------------------------------- Staff ---------------------------------- */

export const staff: StaffUser[] = [
  { id: "s-taylor", name: "Taylor Brooks", role: "admin", title: "Practice manager", clinicIds: ["cleveland", "lakewood", "beachwood"], email: "taylor.brooks@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:21", status: "active" },
  { id: "s-jamie", name: "Jamie Ortiz", role: "front-desk", title: "Front desk lead", clinicIds: ["cleveland"], email: "jamie.ortiz@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:24", status: "active" },
  { id: "s-priscilla", name: "Priscilla Adeyemi", role: "front-desk", title: "Front desk", clinicIds: ["lakewood"], email: "priscilla.adeyemi@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:12", status: "active" },
  { id: "s-ben", name: "Ben Whitaker", role: "front-desk", title: "Front desk", clinicIds: ["beachwood"], email: "ben.whitaker@lindenhealth.example.com", lastActiveAt: "2026-10-19T13:58", status: "active" },
  { id: "s-gomez", name: "Alicia Gomez", role: "nurse", title: "Registered nurse", clinicIds: ["cleveland"], email: "alicia.gomez@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:19", status: "active" },
  { id: "s-tomas", name: "Tomas Lindqvist", role: "nurse", title: "Registered nurse", clinicIds: ["lakewood"], email: "tomas.lindqvist@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:02", status: "active" },
  { id: "s-renee", name: "Renee Okoro", role: "nurse", title: "Medical assistant", clinicIds: ["beachwood"], email: "renee.okoro@lindenhealth.example.com", lastActiveAt: "2026-10-19T13:47", status: "active" },
  { id: "s-dana", name: "Dana Whitfield", role: "billing", title: "Billing specialist", clinicIds: ["cleveland", "lakewood", "beachwood"], email: "dana.whitfield@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:08", status: "active" },
  { id: "s-marco", name: "Marco Bianchi", role: "billing", title: "Billing coordinator", clinicIds: ["cleveland", "lakewood", "beachwood"], email: "marco.bianchi@lindenhealth.example.com", lastActiveAt: "2026-10-19T11:30", status: "active" },
  { id: "s-chen", name: "Dr. Emily Chen", role: "doctor", title: "Family medicine", clinicIds: ["cleveland"], email: "emily.chen@lindenhealth.example.com", lastActiveAt: "2026-10-19T14:15", status: "active" },
  { id: "s-khalil", name: "Dr. Omar Khalil", role: "doctor", title: "Family medicine", clinicIds: ["cleveland"], email: "omar.khalil@lindenhealth.example.com", lastActiveAt: "2026-10-19T12:04", status: "active" },
  { id: "s-ramirez", name: "Dr. Sofia Ramirez", role: "doctor", title: "Pediatrics", clinicIds: ["beachwood"], email: "sofia.ramirez@lindenhealth.example.com", lastActiveAt: "2026-10-19T13:33", status: "active" },
]
/** The signed-in demo user. */
export const CURRENT_USER_ID = "s-taylor"

/* --------------------------------- Patients -------------------------------- */

type Group = "baby" | "kid" | "teen" | "adult" | "older"
const groupOf = (age: number): Group => (age < 5 ? "baby" : age < 13 ? "kid" : age < 18 ? "teen" : age < 65 ? "adult" : "older")

const pediatricians: Record<ClinicId, string[]> = { cleveland: ["laura-bennett"], lakewood: ["marcus-johnson"], beachwood: ["sofia-ramirez", "maya-thornton"] }
const familyDocs: Record<ClinicId, string[]> = { cleveland: ["emily-chen", "omar-khalil"], lakewood: ["priya-nair", "jordan-reyes"], beachwood: ["claire-donovan"] }

function makePatients(): Patient[] {
  const rng = createRng(1001)
  const used = new Set<string>()
  const out: Patient[] = []
  const taken = new Set(["Sarah Mitchell", "David Mitchell", "Lily Mitchell", "Noah Mitchell", "Robert Hayes", "Ana Torres", "Marcus Bell", "Grace Kim", "Henry Walsh"])
  const phones = new Set<string>()
  let mrnSeq = 104_000

  const make = (spec: Partial<Patient> & { firstName: string; lastName: string; dob: string; sex: Patient["sex"]; clinic: ClinicId; idx: number }): Patient => {
    const age = ageOn(spec.dob)
    const g = groupOf(age)
    const city = spec.city ?? rng.pick(cityByClinic[spec.clinic])
    const phone =
      spec.phone ??
      (() => {
        let p = ""
        do p = `(${rng.pick(areaCodes)}) 555-01${rng.digits(2)}`
        while (phones.has(p) && phones.size < 390)
        phones.add(p)
        return p
      })()
    const plan = (() => {
      if (spec.insurance !== undefined) return spec.insurance
      if (rng.chance(0.07)) return null
      const eligible = plans.filter((p) => p.coverage.includes(spec.clinic))
      const wanted: PlanCategory = age >= 65 && rng.chance(0.8) ? "senior" : age < 18 && rng.chance(0.25) ? "community" : rng.weighted([["commercial", 62], ["regional", 18], ["marketplace", 12], ["community", 6], ["service", 2]] as const)
      const pool = eligible.filter((p) => p.category === wanted)
      const pp = rng.pick(pool.length ? pool : eligible)
      return { planId: pp.id, planType: rng.pick(pp.planTypes), memberId: `${planPrefix(pp.name)}-${rng.digits(4)}-${rng.digits(4)}` }
    })()
    const nAllergy = rng.weighted([[0, 70], [1, 24], [2, 6]] as const)
    const pool = g === "older" ? conditionsByAge.older : g === "adult" ? conditionsByAge.adult : conditionsByAge.child
    const nCond = g === "older" ? rng.weighted([[0, 15], [1, 35], [2, 35], [3, 15]] as const) : g === "adult" ? rng.weighted([[0, 50], [1, 35], [2, 15]] as const) : rng.weighted([[0, 75], [1, 25]] as const)
    const primary =
      spec.primaryDoctorId ??
      (() => {
        const ped = age < 18 && rng.chance(0.78)
        const slug = rng.pick(ped ? pediatricians[spec.clinic] : familyDocs[spec.clinic])
        return doctorBySlugMap.get(slug)!.id
      })()
    return {
      id: spec.id ?? `p-${String(spec.idx).padStart(4, "0")}`,
      mrn: spec.mrn ?? fmtMrn((mrnSeq += rng.int(3, 41))),
      firstName: spec.firstName,
      lastName: spec.lastName,
      name: `${spec.firstName} ${spec.lastName}`,
      dob: spec.dob,
      age,
      sex: spec.sex,
      phone,
      email: spec.email ?? `${spec.firstName}.${spec.lastName}${rng.int(1, 99)}@example.com`.toLowerCase(),
      address: spec.address ?? `${rng.int(100, 9899)} ${rng.pick(streets)}, ${city}, OH ${zipByCity[city] ?? "44113"}`,
      city,
      preferredClinicId: spec.clinic,
      primaryDoctorId: primary,
      insurance: plan,
      allergies: spec.allergies ?? rng.sample(allergyPool, nAllergy),
      conditions: spec.conditions ?? rng.sample(pool, nCond),
      flags: [],
      createdAt: spec.createdAt ?? `${rng.int(2016, 2025)}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}T10:00`,
      lastVisitAt: null,
      nextVisitAt: null,
      balance: 0,
      ...(spec.portalId ? { portalId: spec.portalId } : {}),
    }
  }

  // The Mitchell family: the same people as the patient portal.
  const mitchell = (id: string, first: string, dob: string, sex: Patient["sex"], extra: Partial<Patient> & { clinic: ClinicId; doctor: string }) =>
    make({
      id,
      firstName: first,
      lastName: "Mitchell",
      dob,
      sex,
      idx: 0,
      phone: extra.phone ?? "(216) 555-0186",
      email: extra.email ?? "sarah@lindenhealth.example",
      city: "Lakewood",
      address: "220 Birch Lane, Lakewood, OH 44107",
      insurance: { planId: northbridge.id, planType: "PPO", memberId: "NBH-4821-7730" },
      primaryDoctorId: doctorBySlugMap.get(extra.doctor)!.id,
      createdAt: "2019-05-14T10:00",
      ...extra,
    })
  out.push(
    mitchell("p-sarah", "Sarah", "1988-03-09", "F", { clinic: "cleveland", doctor: "emily-chen", mrn: "LH-104822", allergies: ["Sulfa drugs"], conditions: ["Low vitamin D"], portalId: "sarah" }),
    mitchell("p-david", "David", "1985-06-21", "M", { clinic: "cleveland", doctor: "omar-khalil", mrn: "LH-104823", phone: "(216) 555-0187", email: "david.mitchell@example.com", allergies: [], conditions: ["High blood pressure"], portalId: "david" }),
    mitchell("p-lily", "Lily", "2011-04-02", "F", { clinic: "cleveland", doctor: "emily-chen", mrn: "LH-104824", allergies: [], conditions: [], portalId: "lily" }),
    mitchell("p-noah", "Noah", "2015-01-28", "M", { clinic: "beachwood", doctor: "sofia-ramirez", mrn: "LH-104825", allergies: [], conditions: ["Eczema"], portalId: "noah" })
  )
  // Today's live queue (shown on the overview).
  const q = (id: string, first: string, last: string, dob: string, sex: Patient["sex"], doctor: string) => make({ id, firstName: first, lastName: last, dob, sex, clinic: "cleveland", idx: 0, primaryDoctorId: doctorBySlugMap.get(doctor)!.id })
  out.push(
    q("p-hayes", "Robert", "Hayes", "1954-02-11", "M", "emily-chen"),
    q("p-torres", "Ana", "Torres", "1995-07-30", "F", "emily-chen"),
    q("p-bell", "Marcus", "Bell", "1981-03-17", "M", "omar-khalil"),
    q("p-gkim", "Grace", "Kim", "2018-05-06", "F", "laura-bennett"),
    q("p-walsh", "Henry", "Walsh", "1966-09-02", "M", "omar-khalil")
  )

  const ages = [
    [[0, 4], 7],
    [[5, 12], 9],
    [[13, 17], 6],
    [[18, 29], 14],
    [[30, 44], 20],
    [[45, 64], 25],
    [[65, 79], 14],
    [[80, 92], 5],
  ] as const
  for (let i = 1; out.length < 2600; i++) {
    const sex: Patient["sex"] = rng.chance(0.52) ? "F" : "M"
    const firstName = rng.pick(sex === "F" ? femaleNames : maleNames)
    const lastName = rng.pick(lastNames)
    const full = `${firstName} ${lastName}`
    if (taken.has(full) || used.has(full)) continue
    used.add(full)
    const [lo, hi] = rng.weighted(ages.map(([r, w]) => [r, w] as const))
    const age = rng.int(lo, hi)
    const born = parseLocal(TODAY)
    born.setFullYear(born.getFullYear() - age)
    born.setDate(born.getDate() - rng.int(1, 360))
    const clinic = rng.weighted([["cleveland", 40], ["lakewood", 32], ["beachwood", 28]] as const)
    out.push(make({ firstName, lastName, dob: stamp(born).slice(0, 10), sex, clinic, idx: i }))
  }
  return out
}

export const patients = makePatients()
export const patientById = new Map(patients.map((p) => [p.id, p]))
// Clinical details the doctor view relies on.
{
  const chen = doctorBySlugMap.get("emily-chen")!
  const grace = patientById.get("p-gkim")!
  grace.allergies = ["Penicillin"]
  grace.conditions = ["Seasonal allergies"]
  grace.primaryDoctorId = chen.id
  const hayes = patientById.get("p-hayes")!
  hayes.conditions = ["High blood pressure", "Type 2 diabetes", "High cholesterol"]
}

/* ------------------------------- Appointments ------------------------------ */

const DURATION: Record<VisitType, number> = { sick: 20, "follow-up": 20, annual: 40, "new-patient": 40, specialist: 30, vaccine: 15, lab: 15 }

function chooseVisit(rng: Rng, d: Doctor, p: Patient, day: string): { visitType: VisitType; reason: string } {
  const kid = p.age < 18
  const flu = day >= "2026-09-15"
  if (d.specialtyId === "pediatrics") {
    const v = rng.weighted([["sick", 40], ["annual", 28], ["vaccine", flu ? 18 : 10], ["follow-up", 14]] as const)
    return { visitType: v, reason: v === "sick" ? rng.pick(reasons.sickChild) : v === "annual" ? rng.pick(reasons.wellChild) : v === "vaccine" ? (p.age >= 11 ? rng.pick(reasons.vaccineChild) : rng.pick(["Flu shot", "Childhood vaccines"])) : rng.pick(reasons.specialist.pediatrics) }
  }
  if (d.specialtyId === "family-medicine") {
    const v = rng.weighted([["sick", 34], ["follow-up", 24], ["annual", 20], ["new-patient", 5], ["vaccine", flu ? 10 : 4], ["lab", 7]] as const)
    if (v === "sick") return { visitType: v, reason: rng.pick(kid ? reasons.sickChild : reasons.sick) }
    if (v === "annual") return { visitType: v, reason: kid ? rng.pick(reasons.wellChild) : rng.pick(reasons.annual) }
    if (v === "vaccine") return { visitType: v, reason: kid ? "Flu shot" : p.age >= 50 ? rng.pick(["Flu shot", "Shingles vaccine", "COVID-19 booster"]) : rng.pick(["Flu shot", "Tdap booster", "COVID-19 booster"]) }
    if (v === "lab") return { visitType: v, reason: rng.pick(reasons.lab) }
    if (v === "new-patient") return { visitType: v, reason: rng.pick(reasons.newPatient) }
    return { visitType: v, reason: rng.pick(reasons.followUp) }
  }
  const v = rng.weighted([["specialist", 68], ["follow-up", 26], ["new-patient", 6]] as const)
  let pool = reasons.specialist[d.specialtyId] ?? ["Consult"]
  if (d.specialtyId === "womens-health") pool = pool.filter((r) => r !== "Prenatal visit" || (p.age >= 18 && p.age <= 45))
  if (d.specialtyId === "womens-health" && p.age >= 46) pool = pool.filter((r) => r !== "Birth control consult")
  if (d.specialtyId === "womens-health" && p.age < 45) pool = pool.filter((r) => r !== "Menopause consult")
  return { visitType: v, reason: v === "new-patient" ? "New patient consult" : v === "follow-up" ? `${d.specialty} follow-up` : rng.pick(pool) }
}

const eligible = (d: Doctor, p: Patient) => {
  switch (d.specialtyId) {
    case "pediatrics":
      return p.age < 18
    case "cardiology":
      return p.age >= 40
    case "womens-health":
      return p.sex === "F" && p.age >= 13
    case "dermatology":
    case "orthopedics":
      return p.age >= 12
    default:
      return true
  }
}

function copayFor(p: Patient, visitType: VisitType, specialist: boolean, video: boolean) {
  if (!p.insurance) return 0
  if (visitType === "annual" || visitType === "vaccine") return 0
  if (visitType === "lab") return 0
  if (video) return 15
  if (specialist) return 50
  return 20
}

type Built = { appointments: Appointment[] }

function makeAppointments(): Built {
  const rng = createRng(2002)
  const special = new Set(["p-sarah", "p-david", "p-lily", "p-noah", "p-hayes", "p-torres", "p-bell", "p-gkim", "p-walsh"])
  const pool = patients.filter((p) => !special.has(p.id))
  const byPrimary = new Map<string, Patient[]>()
  const byClinic = new Map<ClinicId, Patient[]>()
  for (const p of pool) {
    if (!byPrimary.has(p.primaryDoctorId)) byPrimary.set(p.primaryDoctorId, [])
    byPrimary.get(p.primaryDoctorId)!.push(p)
    if (!byClinic.has(p.preferredClinicId)) byClinic.set(p.preferredClinicId, [])
    byClinic.get(p.preferredClinicId)!.push(p)
  }
  const busy = new Map<string, Set<string>>()
  const out: Appointment[] = []
  let seq = 48_000

  const pickPatient = (d: Doctor, clinicId: ClinicId, day: string): Patient | null => {
    for (let tries = 0; tries < 12; tries++) {
      const primary = byPrimary.get(d.id)
      const fromPrimary = primary?.length && (d.specialtyId === "pediatrics" || d.specialtyId === "family-medicine") && rng.chance(0.72)
      const list = fromPrimary ? primary! : byClinic.get(clinicId)!
      const p = rng.pick(list)
      if (!eligible(d, p)) continue
      const days = busy.get(p.id)
      if (days?.has(day)) continue
      return p
    }
    return null
  }

  const statusFor = (day: string, startMin: number, dur: number, inFuture: number): AppointmentStatus => {
    if (day < TODAY) return rng.weighted([["completed", 89], ["no-show", 4], ["cancelled", 6], ["late-cancel", 1]] as const)
    if (day > TODAY) {
      if (rng.chance(0.04)) return "cancelled"
      return inFuture <= 2 ? (rng.chance(0.82) ? "confirmed" : "scheduled") : rng.chance(0.4) ? "confirmed" : "scheduled"
    }
    const end = startMin + dur
    if (end <= NOW_MIN - 15) return rng.weighted([["completed", 95], ["no-show", 5]] as const)
    if (startMin <= NOW_MIN - 10) return rng.weighted([["with-doctor", 70], ["completed", 30]] as const)
    if (startMin <= NOW_MIN + 5) return rng.weighted([["waiting", 45], ["checked-in", 35], ["with-doctor", 20]] as const)
    if (startMin <= NOW_MIN + 25) return rng.weighted([["arrived", 35], ["checked-in", 25], ["confirmed", 40]] as const)
    return rng.chance(0.78) ? "confirmed" : "scheduled"
  }

  for (let day = RANGE.from; day <= RANGE.to; day = addDays(day, 1)) {
    const dow = weekday(day)
    const ahead = Math.max(0, Math.round((parseLocal(day).getTime() - parseLocal(TODAY).getTime()) / 86_400_000))
    // Further out, fewer slots are booked yet.
    const fill = day <= TODAY ? 0.9 : ahead <= 7 ? 0.84 : ahead <= 14 ? 0.68 : 0.46
    for (const d of doctors) {
      const b = workBlockOn(d, day)
      if (!b) continue
      const clinic = clinics.find((c) => c.id === b.clinicId)!
      const hours = clinic.hours[dow]
      if (!hours) continue
      const videoDay = !!hours.videoOnly
      let t = b.start
      while (t + 15 <= b.end) {
        if (b.lunch && t >= b.lunch[0] && t < b.lunch[1]) {
          t = b.lunch[1]
          continue
        }
        const step = b.slotMin ?? 20
        if (!rng.chance(fill)) {
          t += step
          continue
        }
        const p = pickPatient(d, b.clinicId, day)
        if (!p) {
          t += step
          continue
        }
        const { visitType, reason } = chooseVisit(rng, d, p, day)
        const video = videoDay || ((visitType === "sick" || visitType === "follow-up") && rng.chance(0.12))
        const dur = b.slotMin ?? (video ? 20 : DURATION[visitType])
        if (t + dur > b.end || (b.lunch && t < b.lunch[0] && t + dur > b.lunch[0])) {
          t += step
          continue
        }
        const start = at(day, t)
        const status = statusFor(day, t, dur, ahead)
        busy.set(p.id, (busy.get(p.id) ?? new Set()).add(day))
        out.push(build(rng, ++seq, p, d, b.clinicId, start, dur, video, visitType, reason, status, clinic.rooms))
        t += dur
      }
    }
  }

  const chen = doctorBySlugMap.get("emily-chen")!
  buildChenToday(rng, out, busy, () => ++seq)

  // Today's exact counts per clinic: 64 · 52 · 47 (Dr. Chen's day is fixed, so it's left alone).
  const targets: Record<ClinicId, number> = { cleveland: 64, lakewood: 52, beachwood: 47 }
  for (const c of clinics) {
    const today = () => out.filter((a) => a.clinicId === c.id && dayOf(a.start) === TODAY)
    let list = today()
    while (list.length > targets[c.id]) {
      const others = list.filter((a) => a.doctorId !== chen.id)
      const later = others.filter((a) => minutesOfDay(a.start) > NOW_MIN + 30)
      const victim = rng.pick(later.length ? later : others)
      out.splice(out.indexOf(victim), 1)
      list = today()
    }
    let guard = 0
    while (list.length < targets[c.id] && guard++ < 400) {
      const docs = doctors.filter((d) => d.id !== chen.id && workBlockOn(d, TODAY)?.clinicId === c.id)
      const d = rng.pick(docs)
      const b = workBlockOn(d, TODAY)!
      const slot = b.start + rng.int(0, Math.floor((b.end - b.start - 20) / 20)) * 20
      if (b.lunch && slot >= b.lunch[0] && slot < b.lunch[1]) continue
      const clash = list.some((a) => a.doctorId === d.id && Math.abs(minutesOfDay(a.start) - slot) < 20)
      if (clash) continue
      const p = pickPatient(d, c.id, TODAY)
      if (!p) continue
      const { visitType, reason } = chooseVisit(rng, d, p, TODAY)
      const dur = Math.min(DURATION[visitType], 20)
      busy.set(p.id, (busy.get(p.id) ?? new Set()).add(TODAY))
      out.push(build(rng, ++seq, p, d, c.id, at(TODAY, slot), dur, false, visitType === "annual" || visitType === "new-patient" ? "sick" : visitType, visitType === "annual" || visitType === "new-patient" ? rng.pick(reasons.sick) : reason, statusFor(TODAY, slot, dur, 0), c.rooms))
      list = today()
    }
  }

  // Live queue patients at Cleveland, replacing whatever sat in their slots.
  const live: { patient: string; doctor: string; start: string; dur: number; reason: string; status: AppointmentStatus; arrived: string; checkedIn?: string; roomed?: string; room?: number; forms: boolean; insurance: boolean }[] = [
    { patient: "p-walsh", doctor: "michael-brooks", start: "2026-10-19T14:00", dur: 30, reason: "Shoulder pain", status: "waiting", arrived: "2026-10-19T13:52", checkedIn: "2026-10-19T13:57", forms: true, insurance: true },
    { patient: "p-torres", doctor: "grace-park", start: "2026-10-19T14:10", dur: 30, reason: "Mole evaluation", status: "with-doctor", arrived: "2026-10-19T14:01", checkedIn: "2026-10-19T14:04", roomed: "2026-10-19T14:12", room: 3, forms: true, insurance: true },
    { patient: "p-bell", doctor: "michael-brooks", start: "2026-10-19T14:30", dur: 30, reason: "Knee pain", status: "checked-in", arrived: "2026-10-19T14:14", checkedIn: "2026-10-19T14:18", forms: false, insurance: true },
  ]
  for (const l of live) {
    const d = doctorBySlugMap.get(l.doctor)!
    const m = minutesOfDay(l.start)
    const victim = out.find((a) => a.doctorId === d.id && dayOf(a.start) === TODAY && Math.abs(minutesOfDay(a.start) - m) < l.dur)
    const p = patientById.get(l.patient)!
    const a: Appointment = {
      ...build(rng, ++seq, p, d, "cleveland", l.start, l.dur, false, l.reason.includes("follow") || l.reason.includes("check-in") ? "follow-up" : "specialist", l.reason, l.status, 8),
      arrivedAt: l.arrived,
      checkedInAt: l.checkedIn,
      roomedAt: l.roomed,
      room: l.room,
      formsDone: l.forms,
      insuranceVerified: l.insurance,
      source: "phone",
    }
    if (victim) out.splice(out.indexOf(victim), 1, a)
    else {
      // keep the clinic total exact
      const later = out.filter((x) => x.clinicId === "cleveland" && dayOf(x.start) === TODAY && minutesOfDay(x.start) > NOW_MIN + 60)
      out.splice(out.indexOf(rng.pick(later)), 1, a)
    }
  }

  // Rooms: only one active patient per room per clinic right now.
  for (const c of clinics) {
    const all = out.filter((a) => a.clinicId === c.id && dayOf(a.start) === TODAY && a.status === "with-doctor")
    // Robert Hayes is in Room 2 with Dr. Chen; everyone else fits around him.
    const fixed = all.filter((a) => a.patientId === "p-hayes")
    const active = all.filter((a) => !fixed.includes(a))
    const usedRooms = new Set<number>(fixed.map((a) => a.room!))
    for (const a of active) {
      if (a.room && !usedRooms.has(a.room)) {
        usedRooms.add(a.room)
        continue
      }
      let r = 1
      while (usedRooms.has(r) && r < c.rooms) r++
      if (usedRooms.has(r)) {
        a.status = "waiting"
        a.room = undefined
        a.roomedAt = undefined
      } else {
        a.room = r
        usedRooms.add(r)
      }
    }
  }

  // The Mitchell family's visits, exactly as the portal shows them.
  const wordDate = (s: string) => {
    // "Thursday, October 2, 2026 · 3:15 PM"
    const [datePart, timePart] = s.split(" · ")
    const d = new Date(`${datePart.replace(/^\w+, /, "")} ${timePart}`)
    return stamp(d)
  }
  const portalVisitType = (title: string): VisitType => (/annual|well-child|physical/i.test(title) ? "annual" : /sick/i.test(title) ? "sick" : /follow/i.test(title) ? "follow-up" : /skin|check/i.test(title) ? "specialist" : "follow-up")
  for (const v of pastVisits) {
    const d = doctorBySlugMap.get(v.doctorSlug)!
    const p = patientById.get(`p-${v.personId}`)!
    const start = wordDate(v.detail.when)
    const vt = portalVisitType(v.title)
    out.push({
      ...build(rng, ++seq, p, d, d.clinicIds[0], start, DURATION[vt] > 30 ? 40 : 30, v.type === "video", vt, v.detail.heading.split(" · ")[1] ?? v.title, "completed", 8),
      id: `a-${v.id}`,
    })
  }
  for (const v of upcomingVisits) {
    const d = doctorBySlugMap.get(v.doctorSlug)!
    const p = patientById.get(`p-${v.personId}`)!
    const vt: VisitType = v.kind === "Sick visit" ? "sick" : "annual"
    out.push({
      ...build(rng, ++seq, p, d, d.clinicIds[0], v.calendar.start, v.calendar.minutes, false, vt, v.reason, "confirmed", 8),
      id: `a-${v.id}`,
      formsDone: v.checklist.find((c) => c.id === "forms")?.done ?? false,
      insuranceVerified: true,
      source: "app",
    })
  }
  // Sarah's April lab draw (the lipid panel in Results).
  const sarah = patientById.get("p-sarah")!
  out.push({ ...build(rng, ++seq, sarah, doctorBySlugMap.get("emily-chen")!, "cleveland", "2026-04-08T08:30", 15, false, "lab", "Lipid panel + vitamin D", "completed", 8), id: "a-sarah-lab-0408" })

  // A little history for today's doctor-view patients, so their charts and trends aren't empty.
  const chenDoc = doctorBySlugMap.get("emily-chen")!
  const history: [string, string, string, number, VisitType, string][] = [
    ["p-hayes", "emily-chen", "2026-04-13T09:00", 40, "annual", "Annual physical"],
    ["p-hayes", "emily-chen", "2026-07-20T10:30", 30, "follow-up", "Blood pressure follow-up"],
    ["p-hayes", "emily-chen", "2026-09-14T09:30", 30, "follow-up", "Diabetes follow-up"],
    ["p-gkim", "laura-bennett", "2026-05-11T15:20", 40, "annual", "Well-child visit"],
    ["p-gkim", "emily-chen", "2026-02-23T16:00", 30, "sick", "Ear pain"],
  ]
  for (const [pid, slug, start, dur, vt, reason] of history) {
    const d = doctorBySlugMap.get(slug) ?? chenDoc
    out.push({ ...build(rng, ++seq, patientById.get(pid)!, d, "cleveland", start, dur, false, vt, reason, "completed", 8), id: `a-hist-${pid}-${start.slice(0, 10)}` })
  }

  out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  return { appointments: out }
}

function build(rng: Rng, seq: number, p: Patient, d: Doctor, clinicId: ClinicId, start: string, dur: number, video: boolean, visitType: VisitType, reason: string, status: AppointmentStatus, rooms: number): Appointment {
  const day = dayOf(start)
  const lead = visitType === "sick" ? rng.int(0, 3) : rng.int(3, 34)
  const bookedAt = at(addDays(day, -lead), rng.int(8 * 60, 19 * 60))
  const past = start < NOW
  const a: Appointment = {
    id: `a-${seq}`,
    patientId: p.id,
    doctorId: d.id,
    clinicId,
    start,
    durationMin: dur,
    type: video ? "video" : "in-person",
    reason,
    visitType,
    status,
    bookedAt: bookedAt < start ? bookedAt : addMinutes(start, -120),
    formsDone: past || status === "completed" ? true : rng.chance(day <= addDays(TODAY, 2) ? 0.62 : 0.32),
    insuranceVerified: !p.insurance ? false : past ? true : rng.chance(day <= addDays(TODAY, 2) ? 0.8 : 0.55),
    copay: copayFor(p, visitType, !["family-medicine", "pediatrics"].includes(d.specialtyId), video),
    source: visitType === "sick" && lead === 0 && !video ? rng.weighted([["walk-in", 35], ["phone", 40], ["app", 25]] as const) : rng.weighted([["online", 44], ["phone", 30], ["app", 22], ["walk-in", 4]] as const),
  }
  if (status !== "scheduled" && status !== "cancelled") a.confirmedAt = at(addDays(day, -1), rng.int(9 * 60, 18 * 60))
  const arrive = ["arrived", "checked-in", "waiting", "with-doctor", "completed"].includes(status)
  if (arrive && !video) {
    a.arrivedAt = addMinutes(start, -rng.int(4, 14))
    if (status !== "arrived") a.checkedInAt = addMinutes(a.arrivedAt, rng.int(1, 5))
  }
  if (video && arrive) a.checkedInAt = addMinutes(start, -rng.int(1, 4))
  if (status === "with-doctor" || status === "completed") {
    a.roomedAt = addMinutes(a.checkedInAt ?? start, rng.weighted([[rng.int(2, 9), 60], [rng.int(10, 22), 32], [rng.int(23, 34), 8]] as const))
    if (!video) a.room = rng.int(1, rooms)
  }
  if (status === "completed") a.completedAt = addMinutes(a.roomedAt ?? start, dur + rng.int(-4, 8))
  // Nothing today can have happened after "now".
  if (day === TODAY) {
    const cap = (s?: string, back = 1) => (s && s > NOW ? addMinutes(NOW, -back) : s)
    a.roomedAt = cap(a.roomedAt, rng.int(1, 4))
    a.checkedInAt = cap(a.checkedInAt, rng.int(4, 9))
    a.arrivedAt = cap(a.arrivedAt, rng.int(9, 14))
    if (a.checkedInAt && a.arrivedAt && a.checkedInAt < a.arrivedAt) a.checkedInAt = addMinutes(a.arrivedAt, 2)
    if (a.roomedAt && a.checkedInAt && a.roomedAt < a.checkedInAt) a.roomedAt = addMinutes(a.checkedInAt, 2)
    // A visit that would finish after now is still in the room.
    if (a.completedAt && a.completedAt > NOW) {
      a.status = "with-doctor"
      a.completedAt = undefined
    }
  }
  if (status === "cancelled" || status === "late-cancel") a.cancelledAt = status === "late-cancel" ? addMinutes(start, -rng.int(60, 600)) : at(addDays(day, -rng.int(1, 6)), rng.int(9 * 60, 18 * 60))
  return a
}

/* ----------------------------- Dr. Chen's Monday ---------------------------- */

/**
 * Dr. Emily Chen's day, exactly as the doctor view shows it: 18 thirty-minute slots, 16 booked,
 * 10 seen this morning, Robert Hayes in Room 2 since 2:04 PM, Grace Kim checked in and up next,
 * four more this afternoon (one by video) and open slots at 3:30 and 5:00 PM.
 * Visits run ~31 minutes, which is why she's about 5 minutes behind.
 */
export const chenDay = {
  open: ["2026-10-19T15:30", "2026-10-19T17:00"],
  /** Morning visits whose notes are still unsigned. */
  unsigned: ["11:30", "13:30"],
}

type ChenSlot = { t: string; visitType: VisitType; reason: string; status: AppointmentStatus; video?: boolean; patient?: string; want: (p: Patient) => boolean; length?: number }

function buildChenToday(rng: Rng, out: Appointment[], busy: Map<string, Set<string>>, nextSeq: () => number) {
  const chen = doctorBySlugMap.get("emily-chen")!
  for (const a of out.filter((x) => x.doctorId === chen.id && dayOf(x.start) === TODAY)) out.splice(out.indexOf(a), 1)
  const adult = (lo: number, hi: number) => (p: Patient) => p.age >= lo && p.age <= hi
  const has = (c: string, lo = 18) => (p: Patient) => p.age >= lo && p.conditions.includes(c)
  const slots: ChenSlot[] = [
    { t: "08:00", visitType: "annual", reason: "Annual physical", status: "completed", want: adult(40, 64), length: 33 },
    { t: "08:30", visitType: "follow-up", reason: "Diabetes follow-up", status: "completed", want: has("Type 2 diabetes"), length: 30 },
    { t: "09:00", visitType: "sick", reason: "Sinus pressure and congestion", status: "completed", want: adult(18, 64), length: 29 },
    { t: "09:30", visitType: "follow-up", reason: "Thyroid follow-up", status: "completed", want: has("Hypothyroidism"), length: 32 },
    { t: "10:00", visitType: "sick", reason: "Ear pain", status: "completed", want: adult(5, 12), length: 28 },
    { t: "10:30", visitType: "follow-up", reason: "Cholesterol follow-up", status: "completed", want: has("High cholesterol"), length: 31 },
    { t: "11:00", visitType: "sick", reason: "Cough for a week", status: "completed", want: adult(18, 64), length: 30 },
    { t: "11:30", visitType: "follow-up", reason: "Blood pressure check", status: "completed", want: has("High blood pressure", 50), length: 34 },
    { t: "13:00", visitType: "sick", reason: "Lower back pain", status: "completed", want: adult(25, 64), length: 31 },
    { t: "13:30", visitType: "follow-up", reason: "Anxiety check-in", status: "completed", want: has("Anxiety"), length: 32 },
    { t: "14:00", visitType: "follow-up", reason: "Follow-up (blood pressure)", status: "with-doctor", patient: "p-hayes", want: () => true },
    { t: "14:30", visitType: "sick", reason: "Sore throat and fever", status: "checked-in", patient: "p-gkim", want: () => true },
    { t: "15:00", visitType: "follow-up", reason: "Medication review", status: "confirmed", want: adult(65, 85) },
    { t: "16:00", visitType: "sick", reason: "Itchy rash on both arms", status: "confirmed", want: adult(18, 64) },
    { t: "16:30", visitType: "follow-up", reason: "Knee pain follow-up", status: "scheduled", want: adult(40, 75) },
    { t: "17:30", visitType: "follow-up", reason: "Lab results review", status: "confirmed", video: true, want: adult(30, 70) },
  ]
  // Her own patients, in a stable order, not already booked today.
  const panel = patients.filter((p) => p.primaryDoctorId === chen.id && !p.portalId && !["p-hayes", "p-torres", "p-gkim"].includes(p.id)).sort((a, b) => (a.id < b.id ? -1 : 1))
  const used = new Set<string>()
  for (const s of slots) {
    const p =
      (s.patient && patientById.get(s.patient)) ||
      panel.find((c) => !used.has(c.id) && !busy.get(c.id)?.has(TODAY) && s.want(c)) ||
      panel.find((c) => !used.has(c.id) && !busy.get(c.id)?.has(TODAY))!
    used.add(p.id)
    busy.set(p.id, (busy.get(p.id) ?? new Set()).add(TODAY))
    const start = at(TODAY, h(s.t))
    const a = build(rng, nextSeq(), p, chen, "cleveland", start, s.video ? 20 : 30, !!s.video, s.visitType, s.reason, s.status, 8)
    const m = minutesOfDay(start)
    if (s.status === "completed") {
      a.arrivedAt = at(TODAY, m - 9)
      a.checkedInAt = at(TODAY, m - 6)
      a.roomedAt = at(TODAY, m + 2)
      a.completedAt = at(TODAY, m + 2 + (s.length ?? 31))
      a.formsDone = true
      a.insuranceVerified = !!p.insurance
    } else if (s.patient === "p-hayes") {
      Object.assign(a, { arrivedAt: "2026-10-19T13:52", checkedInAt: "2026-10-19T13:56", roomedAt: "2026-10-19T14:04", room: 2, formsDone: true, insuranceVerified: true, source: "phone" as const })
    } else if (s.patient === "p-gkim") {
      Object.assign(a, { arrivedAt: "2026-10-19T14:19", checkedInAt: "2026-10-19T14:23", roomedAt: undefined, completedAt: undefined, room: undefined, formsDone: true, insuranceVerified: true, source: "app" as const })
    } else {
      Object.assign(a, { arrivedAt: undefined, checkedInAt: undefined, roomedAt: undefined, completedAt: undefined, room: undefined })
    }
    if (s.status === "completed") a.room = (["08:00", "09:00", "10:00", "11:00", "13:00"].includes(s.t) ? 1 : 2)
    out.push(a)
  }
}

export const appointments = makeAppointments().appointments
export const appointmentById = new Map(appointments.map((a) => [a.id, a]))
const appointmentsByPatient = new Map<string, Appointment[]>()
for (const a of appointments) {
  const list = appointmentsByPatient.get(a.patientId)
  if (list) list.push(a)
  else appointmentsByPatient.set(a.patientId, [a])
}

/* ------------------------------ Claims + payments -------------------------- */

const cpt: Record<VisitType, { code: string; label: string }> = {
  sick: { code: "99213", label: "Office visit, established" },
  "follow-up": { code: "99213", label: "Office visit, established" },
  annual: { code: "99396", label: "Preventive visit" },
  "new-patient": { code: "99204", label: "Office visit, new patient" },
  specialist: { code: "99214", label: "Specialist visit" },
  vaccine: { code: "90686", label: "Flu vaccine" },
  lab: { code: "80061", label: "Lipid panel" },
}

function makeBilling() {
  const rng = createRng(3003)
  const claims: Claim[] = []
  const payments: Payment[] = []
  let claimSeq = 54_000
  let paySeq = 76_000
  const ref = () => `LH-PAY-${++paySeq}`

  for (const a of appointments) {
    if (a.status !== "completed") continue
    const p = patientById.get(a.patientId)!
    if (p.portalId) continue // Mitchells come from the portal below
    const billed = a.type === "video" ? selfPay.video : a.visitType === "specialist" ? selfPay.specialist : (selfPay[a.visitType as keyof typeof selfPay] ?? 95)
    const day = dayOf(a.start)
    const age = minutesBetween(a.start, NOW) / 1440
    if (!p.insurance) {
      // Self-pay: charged the self-pay price at the visit.
      if (rng.chance(0.85)) payments.push({ id: `pay-${paySeq}`, patientId: p.id, amount: billed, method: rng.pick(["card", "card", "cash"] as PaymentMethod[]), last4: rng.digits(4), createdAt: addMinutes(a.completedAt ?? a.start, 3), appointmentId: a.id, reference: ref() })
      continue
    }
    const lines: ClaimLine[] = [{ code: cpt[a.visitType].code, label: cpt[a.visitType].label, billed, allowed: Math.round(billed * rng.float(0.78, 0.95) * 100) / 100, paid: 0 }]
    if (a.visitType === "annual" && p.age >= 18 && rng.chance(0.6)) lines.push({ code: "80053", label: "Metabolic panel", billed: 31.4, allowed: 31.4, paid: 0 })
    const status: Claim["status"] =
      age < 1 ? (rng.chance(0.5) ? "draft" : "submitted") : age < 6 ? rng.weighted([["submitted", 45], ["pending", 45], ["paid", 10]] as const) : age < 21 ? rng.weighted([["pending", 30], ["paid", 62], ["denied", 6], ["appealed", 2]] as const) : rng.weighted([["paid", 88], ["denied", 6], ["appealed", 3], ["pending", 3]] as const)
    const patientResp = status === "paid" ? a.copay + (lines[1] ? rng.pick([0, 0, 6.4]) : 0) : 0
    const allowed = lines.reduce((s, l) => s + l.allowed, 0)
    const paid = status === "paid" ? Math.max(0, Math.round((allowed - patientResp) * 100) / 100) : 0
    if (status === "paid") lines.forEach((l, i) => (l.paid = i === 0 ? Math.max(0, Math.round((l.allowed - patientResp) * 100) / 100) : l.allowed))
    const plan = planById.get(p.insurance.planId)!
    const submittedAt = at(addDays(day, rng.int(0, 2)), rng.int(9 * 60, 17 * 60))
    claims.push({
      id: `c-${++claimSeq}`,
      claimNumber: `${planPrefix(plan.name)}-CLM-2026-${claimSeq}`,
      appointmentId: a.id,
      patientId: p.id,
      planId: plan.id,
      serviceDate: day,
      lines,
      amountBilled: Math.round(lines.reduce((s, l) => s + l.billed, 0) * 100) / 100,
      amountPaid: paid,
      patientResponsibility: patientResp,
      status,
      ...(status === "denied" || status === "appealed" ? { denialReason: rng.pick(denialReasons) } : {}),
      submittedAt: submittedAt > NOW ? earlierToday(submittedAt) : submittedAt,
      updatedAt: status === "draft" ? a.completedAt ?? a.start : (() => {
        const u = at(addDays(day, Math.min(Math.floor(age), rng.int(3, 24))), rng.int(9 * 60, 17 * 60))
        // Anything that would land after now happened earlier today instead (spread 8:00 AM–2:20 PM).
        return u > NOW ? earlierToday(u) : u
      })(),
    })
    // Copays are mostly collected at check-in.
    if (a.copay > 0 && a.type === "in-person" && rng.chance(0.68)) {
      payments.push({ id: `pay-${paySeq}`, patientId: p.id, amount: a.copay, method: rng.weighted([["card", 70], ["hsa", 18], ["cash", 10], ["check", 2]] as const), last4: rng.digits(4), createdAt: a.checkedInAt ?? a.start, appointmentId: a.id, reference: ref() })
    } else if (patientResp > 0 && age > 20 && rng.chance(0.8)) {
      // Older balances paid after the statement (statements still unpaid as of now stay on the balance).
      const paidAt = at(addDays(day, rng.int(15, 28)), rng.int(9 * 60, 20 * 60))
      if (paidAt <= NOW) payments.push({ id: `pay-${paySeq}`, patientId: p.id, amount: patientResp, method: rng.weighted([["card", 74], ["hsa", 16], ["check", 10]] as const), last4: rng.digits(4), createdAt: paidAt, appointmentId: a.id, reference: ref() })
    }
  }

  // Mitchell family: claims and payments from the portal's billing.
  for (const b of portalBills) {
    const pid = `p-${b.personId}`
    const appt = appointments.find((a) => a.patientId === pid && dayOf(a.start) === parseIsoFromWords(b.date))
    if (!appt) continue
    const billed = b.lines.reduce((s, l) => s + l.charge, 0)
    const paid = b.lines.reduce((s, l) => s + l.insurance, 0)
    const resp = b.lines.reduce((s, l) => s + l.you, 0)
    claims.push({
      id: `c-${b.id}`,
      claimNumber: b.claim,
      appointmentId: appt.id,
      patientId: pid,
      planId: northbridge.id,
      serviceDate: dayOf(appt.start),
      lines: b.lines.map((l, i) => ({ code: i === 0 ? cpt[appt.visitType].code : b.service.includes("strep") ? "87880" : "80053", label: l.label, billed: l.charge, allowed: l.insurance + l.you, paid: l.insurance })),
      amountBilled: Math.round(billed * 100) / 100,
      amountPaid: Math.round(paid * 100) / 100,
      patientResponsibility: resp,
      status: "paid",
      submittedAt: at(addDays(dayOf(appt.start), 1), 10 * 60),
      updatedAt: at(addDays(dayOf(appt.start), b.processed.includes("17") ? 3 : 5), 11 * 60),
    })
  }
  for (const v of pastVisits) {
    if (portalBills.some((b) => `p-${b.personId}` === `p-${v.personId}` && parseIsoFromWords(b.date) === dayOf(appointmentById.get(`a-${v.id}`)!.start))) continue
    const appt = appointmentById.get(`a-${v.id}`)!
    const ins = Number(v.detail.billing.insurance.replace(/[$,]/g, ""))
    const you = Number(v.detail.billing.you.replace(/[$,]/g, ""))
    claims.push({
      id: `c-${v.id}`,
      claimNumber: `NBH-CLM-2026-${5000 + claims.length}`,
      appointmentId: appt.id,
      patientId: appt.patientId,
      planId: northbridge.id,
      serviceDate: dayOf(appt.start),
      lines: [{ code: cpt[appt.visitType].code, label: cpt[appt.visitType].label, billed: ins + you, allowed: ins + you, paid: ins }],
      amountBilled: ins + you,
      amountPaid: ins,
      patientResponsibility: you,
      status: "paid",
      submittedAt: at(addDays(dayOf(appt.start), 1), 10 * 60),
      updatedAt: at(addDays(dayOf(appt.start), 6), 11 * 60),
    })
    if (you > 0) payments.push({ id: `pay-${v.id}`, patientId: appt.patientId, amount: you, method: "card", last4: "4417", createdAt: at(addDays(dayOf(appt.start), 18), 19 * 60), appointmentId: appt.id, reference: ref() })
  }

  claims.sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1))
  payments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return { claims, payments }
}

/** "Oct 14, 2026" → "2026-10-14". */
function parseIsoFromWords(s: string) {
  return stamp(new Date(`${s} 12:00`)).slice(0, 10)
}

const billing = makeBilling()
export const claims = billing.claims
export const payments = billing.payments

/* ----------------------------- Patient roll-ups ---------------------------- */

const claimsByPatient = groupBy(claims, (c) => c.patientId)
const paymentsByPatient = groupBy(payments, (x) => x.patientId)
const claimedAppointments = new Set(claims.map((c) => c.appointmentId))

function groupBy<T>(list: T[], key: (t: T) => string) {
  const m = new Map<string, T[]>()
  for (const t of list) {
    const k = key(t)
    const arr = m.get(k)
    if (arr) arr.push(t)
    else m.set(k, [t])
  }
  return m
}

for (const p of patients) {
  const list = appointmentsByPatient.get(p.id) ?? []
  const past = list.filter((a) => a.status === "completed")
  const future = list.filter((a) => a.start > NOW && (a.status === "scheduled" || a.status === "confirmed"))
  p.lastVisitAt = past.at(-1)?.start ?? null
  p.nextVisitAt = future[0]?.start ?? null
  const owed = (claimsByPatient.get(p.id) ?? []).reduce((s, c) => s + c.patientResponsibility, 0)
  const paidAmt = (paymentsByPatient.get(p.id) ?? []).filter((x) => x.appointmentId && claimedAppointments.has(x.appointmentId)).reduce((s, x) => s + x.amount, 0)
  p.balance = Math.max(0, Math.round((owed - paidAmt) * 100) / 100)
  if (list.some((a) => a.visitType === "new-patient" && dayOf(a.start) >= addDays(TODAY, -30) && dayOf(a.start) <= addDays(TODAY, 30))) {
    p.createdAt = at(addDays(dayOf(list.find((a) => a.visitType === "new-patient")!.bookedAt), 0), 10 * 60)
  }
  const flags: Patient["flags"] = []
  const risky = ["Type 2 diabetes", "Atrial fibrillation", "Chronic kidney disease (stage 2)", "High blood pressure"]
  if (p.age >= 78 || p.conditions.filter((c) => risky.includes(c)).length >= 2) flags.push("high-risk")
  if (p.createdAt >= at(addDays(TODAY, -30), 0)) flags.push("new")
  if (p.balance > 0) flags.push("balance-due")
  if (future[0] && !future[0].formsDone) flags.push("forms-pending")
  p.flags = flags
}

/* --------------------------------- Vitals ---------------------------------- */

function makeVitals(): Vitals[] {
  const rng = createRng(4004)
  const out: Vitals[] = []
  const base = new Map<string, { sys: number; dia: number; hr: number; w: number; hIn: number }>()
  for (const a of appointments) {
    if (a.status !== "completed" || a.type === "video") continue
    const p = patientById.get(a.patientId)!
    if (p.portalId === "sarah") continue
    if (!base.has(p.id)) {
      const kid = p.age < 18
      const hIn = kid ? Math.round(30 + p.age * 2.4) : p.sex === "F" ? rng.int(60, 68) : rng.int(65, 74)
      const bmi = kid ? rng.float(15, 21) : rng.float(20, p.age > 50 ? 33 : 30)
      base.set(p.id, {
        sys: kid ? rng.int(98, 112) : rng.int(108, p.conditions.includes("High blood pressure") ? 146 : 132),
        dia: kid ? rng.int(58, 70) : rng.int(66, p.conditions.includes("High blood pressure") ? 92 : 84),
        hr: kid ? rng.int(78, 104) : rng.int(58, 84),
        w: Math.round(((bmi * hIn * hIn) / 703) * 10) / 10,
        hIn,
      })
    }
    const b = base.get(p.id)!
    const weightLb = Math.round((b.w + rng.float(-2.5, 2.5)) * 10) / 10
    out.push({
      patientId: p.id,
      appointmentId: a.id,
      date: dayOf(a.start),
      systolic: b.sys + rng.int(-6, 6),
      diastolic: b.dia + rng.int(-4, 4),
      heartRate: b.hr + rng.int(-5, 5),
      weightLb,
      heightIn: b.hIn,
      bmi: Math.round(((weightLb * 703) / (b.hIn * b.hIn)) * 10) / 10,
      tempF: Math.round((97.8 + rng.float(-0.4, a.visitType === "sick" ? 2.4 : 0.6)) * 10) / 10,
    })
  }
  // Sarah: the same readings as her portal health snapshot.
  const bp = portalVitals.find((v) => v.id === "bp")!.history
  const hr = portalVitals.find((v) => v.id === "hr")!.history
  const wt = portalVitals.find((v) => v.id === "weight")!.history
  const bmi = portalVitals.find((v) => v.id === "bmi")!.history
  bp.forEach((row, i) => {
    out.push({
      patientId: "p-sarah",
      appointmentId: i === 3 ? "a-p-sarah-1014" : `vitals-sarah-${i}`,
      date: parseIsoFromWords(`${row.visit} 2026`),
      systolic: Number(row.systolic),
      diastolic: Number(row.diastolic),
      heartRate: Number(hr[i].value),
      weightLb: Number(wt[i].value),
      heightIn: 66,
      bmi: Number(bmi[i].value),
      tempF: 98.2,
    })
  })
  out.sort((a, b) => (a.date < b.date ? -1 : 1))
  return out
}
export const vitals = makeVitals()

/* ------------------------------ Messages + refills ------------------------- */


const threadTemplates: Record<MessageThread["topic"], { subject: string; patient: string; staff?: string }[]> = {
  symptoms: [
    { subject: "Cough that won’t go away", patient: "I’ve had a dry cough for about 10 days. No fever. Should I come in?", staff: "Thanks for the update. A cough after a cold can last a couple of weeks. If it’s not better by Friday, we can see you." },
    { subject: "Rash on my arm", patient: "A red, itchy rash showed up on my forearm two days ago. I attached a photo.", staff: "Thanks for the photo. It looks like contact dermatitis. Try hydrocortisone 1% twice a day and let us know in 3 days." },
    { subject: "Headaches in the afternoon", patient: "I keep getting headaches around 3 PM. Could it be my new medication?" },
    { subject: "Sore throat and fever", patient: "My son has a sore throat and a fever of 101. Can we get a strep test today?", staff: "We have a spot at 4:15 today. I’ve held it for you." },
  ],
  results: [
    { subject: "Question about my lab results", patient: "My cholesterol came back a little high. What should I do next?", staff: "Your doctor added a note in your results. Small diet changes and a recheck in 3 months is the plan." },
    { subject: "When will my results be ready?", patient: "I had blood work on Monday. When will I see the results?", staff: "Most results are ready within 2–3 business days. You’ll get a message as soon as they post." },
    { subject: "A1c result", patient: "I saw my A1c is 6.1. Is that okay?" },
  ],
  prescription: [
    { subject: "Refill for my inhaler", patient: "I’m almost out of my albuterol inhaler. Can you send a refill?", staff: "I’ve sent the request to your doctor. Most refills are approved within one business day." },
    { subject: "Side effects", patient: "Since starting the new medication I feel a little dizzy in the morning. Is that normal?" },
    { subject: "Pharmacy change", patient: "Please send my prescriptions to Birchwood Pharmacy from now on.", staff: "Done. Birchwood Pharmacy is now your preferred pharmacy." },
  ],
  appointment: [
    { subject: "Reschedule my visit", patient: "Can I move my appointment to later in the week?", staff: "Sure. I can offer Thursday at 10:30 AM or Friday at 2:00 PM." },
    { subject: "Forms before my visit", patient: "Do I need to fill anything out before my first visit?", staff: "Yes, please complete the new patient forms in the app. It takes about 10 minutes." },
    { subject: "Running late", patient: "I’m stuck in traffic and will be about 10 minutes late." },
  ],
  billing: [
    { subject: "Question about my statement", patient: "I was charged $50 but thought my copay was $20.", staff: "Your visit was with a specialist, so the specialist copay of $50 applies. Happy to explain more." },
    { subject: "Payment plan", patient: "Can I split my balance into monthly payments?" },
    { subject: "Insurance update", patient: "I have new insurance starting next month. How do I update it?", staff: "You can upload your new card in Billing → Insurance, or bring it to your next visit." },
  ],
  other: [
    { subject: "Medical records request", patient: "Can you send my records to my new employer’s clinic?", staff: "Please use Records → Share in the app. The secure link expires in 7 days." },
    { subject: "Parking at the Beachwood clinic", patient: "Is there parking near the Beachwood clinic?", staff: "Yes, there’s a free lot behind the building." },
  ],
}

function makeThreads(): MessageThread[] {
  const rng = createRng(5005)
  const out: MessageThread[] = []
  // Portal conversations, from the clinic's side.
  const portalMap: Record<string, { patient: string; topic: MessageThread["topic"]; assigned: string; status: MessageThread["status"]; priority: MessageThread["priority"] }> = {
    "chen-lily-cough": { patient: "p-lily", topic: "symptoms", assigned: "s-chen", status: "waiting", priority: "high" },
    "billing-october": { patient: "p-sarah", topic: "billing", assigned: "s-dana", status: "waiting", priority: "normal" },
    "gomez-sarah-labs": { patient: "p-sarah", topic: "results", assigned: "s-gomez", status: "closed", priority: "normal" },
    "khalil-david-bp": { patient: "p-david", topic: "symptoms", assigned: "s-khalil", status: "closed", priority: "normal" },
  }
  const portalTime = (t: string) => {
    if (t.startsWith("Today")) return at(TODAY, timeToMin(t.split(", ")[1]))
    if (t.startsWith("Yesterday")) return at(addDays(TODAY, -1), timeToMin(t.split(", ")[1]))
    const [md, tm] = t.split(", ")
    return at(parseIsoFromWords(`${md} 2026`), timeToMin(tm))
  }
  for (const c of conversations) {
    const m = portalMap[c.id]
    if (!m) continue
    const msgs = c.messages.map((x, i) => ({
      id: `${c.id}-${i}`,
      from: x.from === "you" ? ("patient" as const) : ("staff" as const),
      authorId: x.from === "you" ? "p-sarah" : m.assigned,
      body: x.text,
      createdAt: portalTime(x.time),
    }))
    out.push({
      id: `t-${c.id}`,
      patientId: m.patient,
      subject: c.about.topic,
      topic: m.topic,
      assignedToId: m.assigned,
      status: m.status,
      priority: m.priority,
      lastMessageAt: msgs.at(-1)!.createdAt,
      unread: false,
      messages: msgs,
    })
  }
  const assignable = staff.filter((s) => s.role !== "admin")
  const adults = patients.filter((p) => p.age >= 18 && !p.portalId)
  for (let i = 0; out.length < 85; i++) {
    const topic = rng.weighted([["symptoms", 26], ["results", 18], ["prescription", 16], ["appointment", 20], ["billing", 12], ["other", 8]] as const)
    const tpl = rng.pick(threadTemplates[topic])
    const p = rng.pick(adults)
    const startedAt = at(addDays(TODAY, -rng.int(0, 9)), rng.int(7 * 60, 21 * 60))
    const started = startedAt > NOW ? addMinutes(NOW, -rng.int(10, 300)) : startedAt
    const assigned = topic === "billing" ? rng.pick(staff.filter((s) => s.role === "billing")) : rng.pick(assignable.filter((s) => s.role !== "billing"))
    const msgs: MessageThread["messages"] = [{ id: `t${i}-0`, from: "patient", authorId: p.id, body: tpl.patient, createdAt: started }]
    const replied = !!tpl.staff && rng.chance(0.7)
    if (replied) {
      const r = addMinutes(started, rng.int(25, 900))
      msgs.push({ id: `t${i}-1`, from: "staff", authorId: assigned.id, body: tpl.staff!, createdAt: r > NOW ? addMinutes(NOW, -5) : r })
    }
    if (rng.chance(0.15)) msgs.push({ id: `t${i}-n`, from: "staff", authorId: assigned.id, body: "Called the patient and left a voicemail.", createdAt: addMinutes(msgs.at(-1)!.createdAt, 10), internal: true })
    const last = msgs.filter((m) => !m.internal).at(-1)!
    const status: MessageThread["status"] = replied ? (rng.chance(0.55) ? "closed" : "waiting") : "open"
    out.push({
      id: `t-${4000 + i}`,
      patientId: p.id,
      subject: tpl.subject,
      topic,
      assignedToId: assigned.id,
      status,
      priority: topic === "symptoms" && rng.chance(0.4) ? "high" : "normal",
      lastMessageAt: msgs.at(-1)!.createdAt,
      unread: last.from === "patient",
      messages: msgs,
    })
  }
  out.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
  return out
}

function timeToMin(t: string) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/)
  if (!m) return 12 * 60
  let hh = Number(m[1]) % 12
  if (m[3] === "PM") hh += 12
  return hh * 60 + Number(m[2])
}

export const threads = makeThreads()

const meds: Record<string, { med: string; dose: string }[]> = {
  "High blood pressure": [{ med: "Lisinopril", dose: "10 mg" }, { med: "Amlodipine", dose: "5 mg" }],
  "Type 2 diabetes": [{ med: "Metformin", dose: "500 mg" }],
  "High cholesterol": [{ med: "Atorvastatin", dose: "20 mg" }],
  Hypothyroidism: [{ med: "Levothyroxine", dose: "50 mcg" }],
  Asthma: [{ med: "Albuterol inhaler", dose: "90 mcg" }],
  Anxiety: [{ med: "Sertraline", dose: "50 mg" }],
  GERD: [{ med: "Omeprazole", dose: "20 mg" }],
  "Seasonal allergies": [{ med: "Cetirizine", dose: "10 mg" }],
  "Atrial fibrillation": [{ med: "Apixaban", dose: "5 mg" }],
}

function makeRefills(): RefillRequest[] {
  const rng = createRng(6006)
  const out: RefillRequest[] = [
    { id: "rf-david-lisinopril", patientId: "p-david", medication: "Lisinopril", dose: "10 mg", doctorId: doctorBySlugMap.get("omar-khalil")!.id, status: "routed", createdAt: "2026-10-19T09:12", note: "Any changes before my physical on Nov 3?" },
  ]
  // Dr. Chen's refill requests are exactly the three in her inbox.
  const chen = doctorBySlugMap.get("emily-chen")!
  const todayIds = new Set(appointments.filter((a) => dayOf(a.start) === TODAY).map((a) => a.patientId))
  const chenPanel = patients.filter((p) => p.primaryDoctorId === chen.id && !p.portalId && !todayIds.has(p.id) && p.age >= 30).sort((a, b) => (a.id < b.id ? -1 : 1))
  const pickFor = (condition: string, taken: string[]) => chenPanel.find((p) => p.conditions.includes(condition) && !taken.includes(p.id)) ?? chenPanel.find((p) => !taken.includes(p.id))!
  const metformin = pickFor("Type 2 diabetes", [])
  const levo = pickFor("Hypothyroidism", [metformin.id])
  const statin = pickFor("High cholesterol", [metformin.id, levo.id])
  for (const [p, c] of [[metformin, "Type 2 diabetes"], [levo, "Hypothyroidism"], [statin, "High cholesterol"]] as const) if (!p.conditions.includes(c)) p.conditions = [...p.conditions, c]
  out.push(
    { id: "rf-chen-metformin", patientId: metformin.id, medication: "Metformin", dose: "500 mg", doctorId: chen.id, status: "new", createdAt: "2026-10-19T07:42", note: "Running low, 4 tablets left." },
    { id: "rf-chen-levothyroxine", patientId: levo.id, medication: "Levothyroxine", dose: "50 mcg", doctorId: chen.id, status: "new", createdAt: "2026-10-18T19:15" },
    { id: "rf-chen-atorvastatin", patientId: statin.id, medication: "Atorvastatin", dose: "20 mg", doctorId: chen.id, status: "new", createdAt: "2026-10-17T16:30", note: "Can I get a 90-day supply this time?" }
  )
  const candidates = patients.filter((p) => !p.portalId && p.primaryDoctorId !== chen.id && p.conditions.some((c) => meds[c]))
  while (out.length < 24) {
    const p = rng.pick(candidates)
    if (out.some((r) => r.patientId === p.id)) continue
    const m = rng.pick(meds[p.conditions.find((c) => meds[c])!])
    out.push({
      id: `rf-${out.length}`,
      patientId: p.id,
      medication: m.med,
      dose: m.dose,
      doctorId: p.primaryDoctorId,
      status: rng.weighted([["new", 40], ["routed", 30], ["approved", 24], ["denied", 6]] as const),
      createdAt: at(addDays(TODAY, -rng.int(0, 4)), rng.int(7 * 60, 19 * 60)),
    })
  }
  return out.map((r) => (r.createdAt > NOW ? { ...r, createdAt: addMinutes(NOW, -rng.int(20, 200)) } : r)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
export const refills = makeRefills()

/* --------------------------------- Activity -------------------------------- */

/** A stable time earlier today for a stamp that would otherwise be in the future. */
function earlierToday(s: string) {
  return at(TODAY, 8 * 60 + ((Number(s.slice(14, 16)) * 7 + Number(s.slice(11, 13)) * 13 + Number(s.slice(8, 10)) * 3) % 380))
}

function makeActivity(): ActivityEvent[] {
  const rng = createRng(7007)
  const out: ActivityEvent[] = []
  const recent = appointments.filter((a) => a.start <= NOW && a.start >= at(addDays(TODAY, -2), 0))
  const desk: Record<ClinicId, string> = { cleveland: "s-jamie", lakewood: "s-priscilla", beachwood: "s-ben" }
  const nurse: Record<ClinicId, string> = { cleveland: "s-gomez", lakewood: "s-tomas", beachwood: "s-renee" }
  for (const a of recent) {
    const p = patientById.get(a.patientId)!
    if (a.checkedInAt) out.push({ id: `ev-ci-${a.id}`, at: a.checkedInAt, actorId: desk[a.clinicId], type: "check-in", summary: `Checked in ${p.name}`, entityType: "appointment", entityId: a.id, patientId: p.id })
    if (a.roomedAt && a.room) out.push({ id: `ev-rm-${a.id}`, at: a.roomedAt, actorId: nurse[a.clinicId], type: "roomed", summary: `Roomed ${p.name} in Room ${a.room}`, entityType: "appointment", entityId: a.id, patientId: p.id })
    if (a.status === "no-show") out.push({ id: `ev-ns-${a.id}`, at: addMinutes(a.start, 20), actorId: desk[a.clinicId], type: "no-show", summary: `Marked ${p.name} as a no-show`, entityType: "appointment", entityId: a.id, patientId: p.id })
  }
  for (const pay of payments.filter((x) => x.createdAt >= at(addDays(TODAY, -2), 0) && x.createdAt <= NOW)) {
    const p = patientById.get(pay.patientId)!
    out.push({ id: `ev-pay-${pay.id}`, at: pay.createdAt, actorId: rng.pick(["s-jamie", "s-priscilla", "s-ben", "s-dana"]), type: "payment", summary: `Recorded a $${pay.amount.toFixed(2)} payment from ${p.name}`, entityType: "payment", entityId: pay.id, patientId: p.id })
  }
  for (const c of claims.filter((x) => x.status === "denied" && x.updatedAt >= at(addDays(TODAY, -14), 0))) {
    const p = patientById.get(c.patientId)!
    out.push({ id: `ev-cl-${c.id}`, at: c.updatedAt, actorId: "s-dana", type: "claim-denied", summary: `Claim ${c.claimNumber} for ${p.name} was denied (${c.denialReason})`, entityType: "claim", entityId: c.id, patientId: p.id })
  }
  for (const r of refills) {
    const p = patientById.get(r.patientId)!
    out.push({ id: `ev-rf-${r.id}`, at: r.createdAt, actorId: r.status === "new" ? CURRENT_USER_ID : "s-gomez", type: "refill", summary: r.status === "new" ? `New refill request: ${r.medication} for ${p.name}` : `${r.status === "routed" ? "Routed" : r.status === "approved" ? "Approved" : "Denied"} ${p.name}’s ${r.medication} refill`, entityType: "refill", entityId: r.id, patientId: p.id })
  }
  out.sort((a, b) => (a.at < b.at ? 1 : -1))
  return out.slice(0, 200)
}
export const activity = makeActivity()

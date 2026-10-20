// /portal/prescriptions: the family's medications, pharmacy and allergies. Fictional demo data,
// pinned to Monday, Oct 19, 2026, and kept in step with the visits and results pages.

import type { PersonId } from "@/lib/data/portal"
import { healthSummaries } from "@/lib/data/records"

export type Pharmacy = { id: string; name: string; short: string; address: string; phone: string; hours: string }

export const pharmacies: Pharmacy[] = [
  { id: "lakeview", name: "Lakeview Pharmacy", short: "Lakeview Pharmacy, Lakewood", address: "120 Maple Avenue, Lakewood, OH", phone: "(216) 555-0168", hours: "Open today 9 AM – 9 PM" },
  { id: "linden", name: "Linden Health Pharmacy", short: "Linden Health Pharmacy, Cleveland", address: "100 Linden Way, Suite 100, Cleveland, OH", phone: "(216) 555-0110", hours: "Open today 8 AM – 6 PM" },
  { id: "birchwood", name: "Birchwood Pharmacy", short: "Birchwood Pharmacy, Beachwood", address: "54 Commons Boulevard, Beachwood, OH", phone: "(216) 555-0172", hours: "Open today 8 AM – 10 PM" },
]

export type MedDetail = {
  howToTake: string
  whatFor: string
  sideEffects: string
  callIf: string
  tips: string
  history: string
}

export type ActiveMed = {
  id: string
  personId: PersonId
  name: string
  /** Plain name for sentences, e.g. "Lisinopril". */
  short: string
  form: string
  instructions: string
  reason: string
  doctorSlug: string
  /** "Prescribed by" or "Recommended by" (over the counter). */
  byLabel: string
  started: string
  otc?: boolean
  supply: { daysLeft: number; totalDays: number; label: string }
  refills?: { left: number; total: number }
  lastFilled?: string
  /** Can be refilled through the portal. */
  refillable?: boolean
  /** Shown as an amber "Refill due soon" status and the top banner. */
  dueSoon?: boolean
  quantities?: { id: string; label: string }[]
  recheck?: { label: string; action: { label: string; href: string } }
  detail: MedDetail
}

export const activeMeds: ActiveMed[] = [
  {
    id: "lisinopril",
    personId: "david",
    name: "Lisinopril 10 mg",
    short: "Lisinopril",
    form: "tablet",
    instructions: "Take 1 tablet by mouth once daily, in the morning",
    reason: "High blood pressure",
    doctorSlug: "omar-khalil",
    byLabel: "Prescribed by",
    started: "Started Apr 2026",
    supply: { daysLeft: 5, totalDays: 30, label: "5 days left" },
    refills: { left: 1, total: 6 },
    lastFilled: "Sep 24, 2026 · 30 tablets",
    refillable: true,
    dueSoon: true,
    quantities: [
      { id: "30", label: "30 tablets (one month)" },
      { id: "90", label: "90 tablets (three months)" },
    ],
    detail: {
      howToTake: "1 tablet daily, in the morning, with or without food",
      whatFor: "Helps lower blood pressure",
      sideEffects: "Dry cough, dizziness when standing up, headache",
      callIf: "You have swelling of the face, lips, or tongue, or trouble breathing. Call 911 for severe symptoms.",
      tips: "Stand up slowly. Don’t take potassium supplements unless your doctor says it’s okay.",
      history: "Started Apr 2026 · Dose unchanged · Last BP 128/82 mmHg on Sep 18",
    },
  },
  {
    id: "vitamin-d",
    personId: "sarah",
    name: "Vitamin D3 2,000 IU",
    short: "vitamin D",
    form: "softgel",
    instructions: "Take 1 softgel by mouth once daily, with food",
    reason: "Low vitamin D",
    doctorSlug: "emily-chen",
    byLabel: "Recommended by",
    started: "Started Oct 15, 2026",
    otc: true,
    supply: { daysLeft: 85, totalDays: 90, label: "About 85 days left" },
    recheck: { label: "Vitamin D blood test due Jan 14, 2027", action: { label: "Book lab visit", href: "/book?doctor=emily-chen&service=labs" } },
    detail: {
      howToTake: "1 softgel daily, with a meal that has some fat, for better absorption",
      whatFor: "Brings your vitamin D back up to a healthy level, for strong bones and muscles",
      sideEffects: "Rare at this dose. Too much over a long time can cause nausea or weakness.",
      callIf: "You feel very thirsty, confused, or sick to your stomach for more than a day.",
      tips: "Take it at the same time each day. Don’t take extra vitamin D from other supplements without asking.",
      history: "Started Oct 15, 2026 after your annual blood work (vitamin D 24 ng/mL)",
    },
  },
]

export type PastMed = {
  id: string
  personId: PersonId
  name: string
  instructions: string
  dates: string
  doctorSlug: string
  reason: string
  status: string
  detail: MedDetail
}

export const pastMeds: PastMed[] = [
  {
    id: "amoxicillin",
    personId: "lily",
    name: "Amoxicillin 500 mg capsule",
    instructions: "1 capsule twice daily",
    dates: "Oct 2 – Oct 12, 2026",
    doctorSlug: "emily-chen",
    reason: "Ear infection",
    status: "Completed",
    detail: {
      howToTake: "1 capsule twice daily for 10 days, with or without food",
      whatFor: "An antibiotic that treats bacterial infections, like ear infections",
      sideEffects: "Upset stomach, diarrhea, mild rash",
      callIf: "You see hives, swelling, or trouble breathing. Call 911 for severe symptoms.",
      tips: "Finish the full course, even if she feels better.",
      history: "Prescribed at Lily’s sick visit on Oct 2 · Course finished Oct 12",
    },
  },
  {
    id: "hydrocortisone",
    personId: "noah",
    name: "Hydrocortisone 1% cream",
    instructions: "Thin layer twice daily",
    dates: "Aug 27 – Sep 3, 2026",
    doctorSlug: "sofia-ramirez",
    reason: "Skin rash (eczema)",
    status: "Completed",
    detail: {
      howToTake: "A thin layer on the rash twice daily, for up to 7 days",
      whatFor: "Calms itching and redness from eczema",
      sideEffects: "Mild stinging where it’s applied",
      callIf: "The rash spreads, oozes, or isn’t better after a week.",
      tips: "Use a fragrance-free moisturizer every day, even after the rash clears.",
      history: "Prescribed at Noah’s video visit on Aug 27 · Used for 7 days",
    },
  },
]

/** Each person's allergies, from their health summary on the Records page. */
export const allergies: { personId: PersonId; text: string }[] = healthSummaries.map((s) => ({ personId: s.personId, text: s.allergies }))

/** What happens to a refill request, in order. The first step is done as soon as it's sent. */
export const refillSteps = (doctor: string) => [
  { id: "requested", label: "Requested", detail: "Oct 19" },
  { id: "approved", label: `Approved by ${doctor}` },
  { id: "sent", label: "Sent to pharmacy" },
  { id: "ready", label: "Ready for pickup" },
]

export const prescriptionsCopy = {
  heading: "Prescriptions",
  intro: "Medications for your family, with refills in a few taps.",
  requestRefill: "Request a refill",
  changePharmacy: "Change pharmacy",
  filters: { person: "Show medications for", allFamily: "All family" },
  tabs: { active: "Active", past: "Past" },
  alert: {
    text: (first: string, med: string, days: number) => `${first}’s ${med} runs out in ${days} days. Request a refill now so there’s no gap.`,
    action: "Request refill",
  },
  status: { dueSoon: "Refill due soon", active: "Active", requested: "Refill requested" },
  labels: {
    for: "For",
    supply: "Supply",
    refillsLeft: "Refills left",
    refills: (left: number, total: number) => `${left} of ${total}`,
    lastFilled: "Last filled",
    pharmacy: "Pharmacy",
    type: "Type",
    otc: "Over the counter (no prescription needed)",
    recheck: "Recheck",
  },
  actions: { refill: "Request refill", details: "Details", message: (doctor: string) => `Message ${doctor}`, messageHref: "/portal/messages" },
  past: {
    columns: { medication: "Medication", patient: "Patient", dates: "Dates", reason: "Reason", status: "Status" },
    view: "View details",
    again: "Request again",
    sent: (doctor: string) => `Request sent to ${doctor}`,
  },
  detail: {
    howToTake: "How to take",
    whatFor: "What it’s for",
    sideEffects: "Common side effects",
    callIf: "Call your doctor if",
    tips: "Tips",
    history: "History",
  },
  refill: {
    title: "Request a refill",
    medication: "Medication",
    quantity: "Quantity",
    pharmacy: "Pharmacy",
    change: "Change",
    note: "Note to doctor (optional)",
    notePlaceholder: "Any changes before my physical on Nov 3?",
    send: "Send request",
    success: (pharmacy: string) => `Request sent. Most refills are approved within one business day. We’ll message you when it’s ready at ${pharmacy}.`,
    progress: "Request status",
    stepDone: "Done: ",
    stepNext: "Next: ",
    done: "Done",
  },
  pharmacy: {
    title: "Preferred pharmacy",
    pick: "Choose a pharmacy",
    save: "Save pharmacy",
  },
  allergies: {
    title: "Allergies and alerts",
    update: { label: "Update allergies", href: "/portal/records" },
    note: "Your doctor checks these before every new prescription.",
  },
  empty: {
    active: "No active medications. When your doctor prescribes something, it will show here.",
    past: "No past medications yet.",
  },
}

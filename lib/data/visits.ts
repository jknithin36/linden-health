// /portal/visits: the family's upcoming, past and cancelled visits. Fictional demo data, pinned to
// Monday, Oct 19, 2026 like the rest of the portal. Doctors are looked up by slug, so names, photos
// and clinic addresses always match the public site. The exported types (UpcomingVisit, PastVisit,
// CancelledVisit, Suggestion) are the shapes a visits API would return.

import { clinicFor, directionsHref } from "@/lib/data/clinics"
import { doctorBySlug } from "@/lib/data/doctors"
import type { PersonId } from "@/lib/data/portal"

export type VisitType = "in-person" | "video"

function resolveDoctor(slug: string) {
  const d = doctorBySlug(slug)!
  const clinic = clinicFor(d.location)
  return {
    slug: d.slug,
    name: d.name,
    short: d.name.replace(/^Dr\. \w+ /, "Dr. "),
    credentials: d.credentials,
    specialty: d.specialty,
    image: d.image,
    href: d.href,
    clinic: { name: `Linden Health ${d.location}`, address: clinic.address.replace(/, \w+, OH$/, ""), directions: directionsHref(clinic) },
  }
}

export type VisitDoctor = ReturnType<typeof resolveDoctor>
const doctorCache = new Map<string, VisitDoctor>()

/** Everything the portal shows about a doctor, resolved once per slug from the public directory. */
export function visitDoctor(slug: string): VisitDoctor {
  let d = doctorCache.get(slug)
  if (!d) doctorCache.set(slug, (d = resolveDoctor(slug)))
  return d
}

export type ChecklistItem = { id: "confirmed" | "forms" | "check-in"; label: string; done: boolean; note?: string }

export type UpcomingVisit = {
  id: string
  personId: PersonId
  title: string
  /** The visit type on its own, e.g. "Sick visit", for lists like Cancelled. */
  kind: string
  date: string
  /** "Oct 21, 2026", for lists. */
  listDate: string
  /** "Tue, Oct 21" */
  shortDate: string
  time: string
  duration: string
  type: VisitType
  doctorSlug: string
  reason: string
  /** Optional prep instructions, shown in an amber note. */
  prep?: string
  checklist: ChecklistItem[]
  /** For "Add to calendar": local start time and length. */
  calendar: { start: string; minutes: number }
  /** Show "Directions" (in-person visits that are coming up soon). */
  directions?: boolean
}

export const upcomingVisits: UpcomingVisit[] = [
  {
    id: "v-lily-1021",
    personId: "lily",
    title: "Lily’s sick visit",
    kind: "Sick visit",
    listDate: "Oct 21, 2026",
    date: "Tuesday, October 21",
    shortDate: "Tue, Oct 21",
    time: "4:30 PM",
    duration: "30 min",
    type: "in-person",
    doctorSlug: "emily-chen",
    reason: "Fever and cough",
    checklist: [
      { id: "confirmed", label: "Confirmed", done: true },
      { id: "forms", label: "Pre-visit forms", done: false },
      { id: "check-in", label: "Check in", done: false, note: "opens Mon 4:30 PM" },
    ],
    calendar: { start: "2026-10-21T16:30", minutes: 30 },
    directions: true,
  },
  {
    id: "v-david-1103",
    personId: "david",
    title: "David’s annual physical",
    kind: "Annual physical",
    listDate: "Nov 3, 2026",
    date: "Tuesday, November 3",
    shortDate: "Tue, Nov 3",
    time: "9:00 AM",
    duration: "40 min",
    type: "in-person",
    doctorSlug: "omar-khalil",
    reason: "Yearly checkup and blood pressure review",
    prep: "Fasting blood work. No food or drinks except water for 8 hours before.",
    checklist: [
      { id: "confirmed", label: "Confirmed", done: true },
      { id: "forms", label: "Forms done", done: true },
      { id: "check-in", label: "Check in", done: false, note: "opens Nov 2" },
    ],
    calendar: { start: "2026-11-03T09:00", minutes: 40 },
    directions: true,
  },
  {
    id: "v-noah-1209",
    personId: "noah",
    title: "Noah’s well-child visit",
    kind: "Well-child visit",
    listDate: "Dec 9, 2026",
    date: "Wednesday, December 9",
    shortDate: "Wed, Dec 9",
    time: "10:30 AM",
    duration: "30 min",
    type: "in-person",
    doctorSlug: "sofia-ramirez",
    reason: "11-year checkup and vaccines (Tdap, HPV)",
    checklist: [
      { id: "confirmed", label: "Confirmed", done: true },
      { id: "forms", label: "Forms", done: false, note: "opens Dec 2" },
    ],
    calendar: { start: "2026-12-09T10:30", minutes: 30 },
  },
]

export type VisitDetail = {
  /** "Sick visit · Ear pain" */
  heading: string
  when: string
  diagnosis: string
  vitals: string[]
  treatment: string
  note: string
  followUp: string
  billing: { insurance: string; you: string }
}

export type PastVisit = {
  id: string
  date: string
  personId: PersonId
  title: string
  doctorSlug: string
  type: VisitType
  /** Small outcome chips next to "View notes". */
  outcomes: string[]
  detail: VisitDetail
}

export const pastVisits: PastVisit[] = [
  {
    id: "p-sarah-1014",
    date: "Oct 14, 2026",
    personId: "sarah",
    title: "Annual physical",
    doctorSlug: "emily-chen",
    type: "in-person",
    outcomes: ["Results ready"],
    detail: {
      heading: "Annual physical",
      when: "Tuesday, October 14, 2026 · 9:30 AM",
      diagnosis: "Healthy overall. Vitamin D is low and LDL cholesterol is a little high.",
      vitals: ["Blood pressure 118/76 mmHg", "Heart rate 68 bpm", "Weight 142 lb"],
      treatment: "Vitamin D 2,000 IU daily",
      note: "Let’s start vitamin D 2,000 IU daily and recheck both in 3 months. Small diet changes can help your LDL too.",
      followUp: "Lab recheck in January",
      billing: { insurance: "$186.40", you: "$25.00" },
    },
  },
  {
    id: "p-lily-1002",
    date: "Oct 2, 2026",
    personId: "lily",
    title: "Sick visit (ear pain)",
    doctorSlug: "emily-chen",
    type: "in-person",
    outcomes: ["Prescription sent"],
    detail: {
      heading: "Sick visit · Ear pain",
      when: "Thursday, October 2, 2026 · 3:15 PM",
      diagnosis: "Middle ear infection (left ear)",
      vitals: ["Temp 100.8 °F", "Heart rate 92 bpm", "Weight 112 lb"],
      treatment: "Amoxicillin 500 mg, twice daily for 10 days",
      note: "Lily has a mild ear infection. Finish the full antibiotic course, even if she feels better. Call us if the fever lasts more than 2 days.",
      followUp: "Not needed unless symptoms return",
      billing: { insurance: "$112.00", you: "$20.00" },
    },
  },
  {
    id: "p-david-0918",
    date: "Sep 18, 2026",
    personId: "david",
    title: "Follow-up (blood pressure)",
    doctorSlug: "omar-khalil",
    type: "video",
    outcomes: [],
    detail: {
      heading: "Follow-up · Blood pressure",
      when: "Friday, September 18, 2026 · 12:15 PM",
      diagnosis: "Blood pressure is coming down on lisinopril.",
      vitals: ["Home blood pressure 128/82 mmHg (average of 7 days)"],
      treatment: "Continue lisinopril 10 mg daily",
      note: "Nice progress. Keep taking your readings a few mornings a week and bring the log to your physical.",
      followUp: "Annual physical on Nov 3",
      billing: { insurance: "$68.00", you: "$15.00" },
    },
  },
  {
    id: "p-noah-0827",
    date: "Aug 27, 2026",
    personId: "noah",
    title: "Sick visit (rash)",
    doctorSlug: "sofia-ramirez",
    type: "video",
    outcomes: [],
    detail: {
      heading: "Sick visit · Rash",
      when: "Thursday, August 27, 2026 · 5:00 PM",
      diagnosis: "Mild eczema on both elbows",
      vitals: ["Not taken (video visit)"],
      treatment: "Fragrance-free moisturizer twice daily. Hydrocortisone 1% cream for up to 7 days.",
      note: "This should calm down within a week or two. Short, lukewarm showers help a lot.",
      followUp: "Message us if it isn’t better in 2 weeks",
      billing: { insurance: "$54.00", you: "$15.00" },
    },
  },
  {
    id: "p-sarah-0709",
    date: "Jul 9, 2026",
    personId: "sarah",
    title: "Skin check",
    doctorSlug: "daniel-kim",
    type: "in-person",
    outcomes: [],
    detail: {
      heading: "Skin check",
      when: "Thursday, July 9, 2026 · 11:00 AM",
      diagnosis: "Full skin check. No concerning spots.",
      vitals: ["Not needed for this visit"],
      treatment: "Daily SPF 30+ sunscreen",
      note: "Everything looks healthy. Keep an eye on the mole on your left shoulder and let me know if it changes.",
      followUp: "Next skin check in a year",
      billing: { insurance: "$96.00", you: "$50.00" },
    },
  },
  {
    id: "p-noah-0612",
    date: "Jun 12, 2026",
    personId: "noah",
    title: "Well-child checkup",
    doctorSlug: "sofia-ramirez",
    type: "in-person",
    outcomes: ["Hearing and vision checked"],
    detail: {
      heading: "Well-child checkup",
      when: "Friday, June 12, 2026 · 10:00 AM",
      diagnosis: "Healthy and growing well.",
      vitals: ["Height 4 ft 8 in", "Weight 79 lb", "Hearing and vision normal"],
      treatment: "None needed",
      note: "Noah is right on track. Next year’s visit includes his Tdap and HPV vaccines.",
      followUp: "Well-child visit in December",
      billing: { insurance: "$140.00", you: "$0.00" },
    },
  },
  {
    id: "p-lily-0520",
    date: "May 20, 2026",
    personId: "lily",
    title: "Annual checkup",
    doctorSlug: "emily-chen",
    type: "in-person",
    outcomes: ["Sports form signed"],
    detail: {
      heading: "Annual checkup",
      when: "Wednesday, May 20, 2026 · 4:00 PM",
      diagnosis: "Healthy. Cleared for school sports.",
      vitals: ["Blood pressure 108/68 mmHg", "Heart rate 74 bpm", "Weight 110 lb"],
      treatment: "None needed",
      note: "Lily is in great health. Remember her flu shot this fall.",
      followUp: "Annual checkup next May",
      billing: { insurance: "$140.00", you: "$0.00" },
    },
  },
  {
    id: "p-david-0408",
    date: "Apr 8, 2026",
    personId: "david",
    title: "Blood pressure check",
    doctorSlug: "omar-khalil",
    type: "in-person",
    outcomes: ["Prescription sent"],
    detail: {
      heading: "Blood pressure check",
      when: "Wednesday, April 8, 2026 · 8:45 AM",
      diagnosis: "High blood pressure (stage 1)",
      vitals: ["Blood pressure 138/88 mmHg", "Heart rate 76 bpm", "Weight 188 lb"],
      treatment: "Lisinopril 10 mg once daily",
      note: "Let’s start a low dose and check in by video in a few months. Cutting back on salt will help too.",
      followUp: "Video follow-up in September",
      billing: { insurance: "$88.00", you: "$20.00" },
    },
  },
]

export type CancelledVisit = { id: string; date: string; personId: PersonId; title: string; doctorSlug: string; type: VisitType; by: string }

export const cancelledVisits: CancelledVisit[] = [
  { id: "c-david-0904", date: "Sep 4, 2026", personId: "david", title: "Follow-up", doctorSlug: "omar-khalil", type: "in-person", by: "Cancelled by you" },
]

export type Suggestion = {
  id: string
  personId: PersonId
  text: string
  action: { label: string; href?: string; addFluShotTo?: string }
}

export const suggestions: Suggestion[] = [
  {
    id: "s-lab",
    personId: "sarah",
    text: "Sarah’s lab recheck is due in January. Dr. Chen recommended rechecking vitamin D and LDL.",
    action: { label: "Book lab visit", href: "/book?doctor=emily-chen&service=labs" },
  },
  {
    id: "s-flu",
    personId: "lily",
    text: "Lily is due for her flu shot. You can add it to Tuesday’s visit.",
    action: { label: "Add flu shot", addFluShotTo: "v-lily-1021" },
  },
]

/** Reschedule picker days (the shared Today / Tomorrow / Thu… strip) as full dates for the demo day. */
export type RescheduleDay = { date: string; shortDate: string; listDate: string; iso: string }

export const rescheduleDates: Record<string, RescheduleDay> = {
  today: { date: "Monday, October 19", shortDate: "Mon, Oct 19", listDate: "Oct 19, 2026", iso: "2026-10-19" },
  tomorrow: { date: "Tuesday, October 20", shortDate: "Tue, Oct 20", listDate: "Oct 20, 2026", iso: "2026-10-20" },
  thu: { date: "Thursday, October 22", shortDate: "Thu, Oct 22", listDate: "Oct 22, 2026", iso: "2026-10-22" },
  fri: { date: "Friday, October 23", shortDate: "Fri, Oct 23", listDate: "Oct 23, 2026", iso: "2026-10-23" },
  mon: { date: "Monday, October 26", shortDate: "Mon, Oct 26", listDate: "Oct 26, 2026", iso: "2026-10-26" },
}

export const visitsCopy = {
  heading: "Visits",
  intro: "Upcoming and past visits for your family.",
  book: { label: "Book a visit", href: "/book" },
  video: { label: "Start a video visit", href: "/book?format=video" },
  filters: {
    person: "Show visits for",
    allFamily: "All family",
    type: "Visit type",
    types: [
      { id: "all", label: "All" },
      { id: "in-person", label: "In person" },
      { id: "video", label: "Video" },
    ] as { id: "all" | VisitType; label: string }[],
  },
  typeLabel: { "in-person": "In person", video: "Video" } as Record<VisitType, string>,
  tabs: { upcoming: "Upcoming", past: "Past", cancelled: "Cancelled" },
  status: {
    action: "Action needed",
    ready: "Ready",
    confirmed: "Confirmed",
  },
  reasonLabel: "Reason",
  checklistSr: { done: "Done: ", todo: "To do: " },
  prepLabel: "Prep",
  fluAdded: "Flu shot added",
  actions: {
    forms: "Complete forms",
    formsDone: "Forms completed",
    reschedule: "Reschedule",
    cancel: "Cancel",
    calendar: "Add to calendar",
    directions: "Directions",
  },
  suggestedHeading: "Suggested",
  past: {
    columns: { date: "Date", patient: "Patient", visit: "Visit", doctor: "Doctor", type: "Type", summary: "Summary" },
    viewNotes: "View notes",
    bookAgain: "Book again",
    bookAgainHref: (slug: string) => `/book?doctor=${slug}`,
  },
  detail: {
    summary: "Visit summary",
    diagnosis: "Diagnosis",
    vitals: "Vitals",
    treatment: "Treatment",
    note: "Doctor’s note",
    followUp: "Follow-up",
    billing: "Billing",
    billingLine: (insurance: string, you: string) => `Insurance paid ${insurance} · You paid ${you}`,
    download: "Download summary",
    message: (doctor: string) => `Message ${doctor}`,
    messageHref: "/portal/messages",
    followUpBook: "Book follow-up",
  },
  reschedule: {
    title: (first: string) => `Reschedule ${first}’s visit`,
    current: (date: string, time: string, doctor: string) => `Current: ${date} · ${time} with ${doctor}`,
    day: "Day",
    time: "Time",
    open: (n: number) => `${n} open`,
    confirm: "Confirm new time",
    success: (first: string, date: string, time: string) => `Done! ${first}’s visit is now ${date} at ${time}.`,
    close: "Close",
  },
  cancel: {
    title: "Cancel this visit?",
    body: "Free cancellation up to 24 hours before. After that, a $25 late cancellation fee may apply.",
    reasonLabel: "Reason (optional)",
    reasons: ["Feeling better", "Schedule conflict", "Booked by mistake", "Other"],
    keep: "Keep visit",
    confirm: "Cancel visit",
    by: "Cancelled by you",
  },
  empty: {
    upcoming: { text: "No upcoming visits. Book one in about 2 minutes.", action: "Book a visit" },
    past: "Your visit history will show here after your first visit.",
    cancelled: "No cancelled visits.",
  },
}

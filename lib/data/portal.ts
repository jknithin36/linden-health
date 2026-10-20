// Patient portal: sidebar navigation, the signed-in demo patient, and shared portal copy.
// The overview's cards are derived from the visits and billing data, so every page agrees.
// Exported types describe the shapes a real API would return; swap the arrays for fetches.

import { demoAccounts } from "@/lib/data/auth"
import { amountDue, billTotals, bills, insurance, money, wholeMoney } from "@/lib/data/billing"
import { upcomingVisits, visitDoctor } from "@/lib/data/visits"

export type PortalIcon =
  | "overview"
  | "visits"
  | "results"
  | "prescriptions"
  | "records"
  | "messages"
  | "billing"
  | "family"
  | "settings"

/** Small status next to a nav item. `srLabel` is what screen readers hear instead of the short text. */
export type PortalBadge = { label: string; srLabel: string; tone: "new" | "count" | "due" }
export type PortalBadgeTone = PortalBadge["tone"]

export type PortalSection = {
  id: PortalIcon
  label: string
  href: string
  icon: PortalIcon
  /** One line under the page title. */
  description: string
  /** Live badge style; its text comes from `portalCopy.badges` and what this visitor has opened, read or paid. */
  badge?: PortalBadgeTone
}

export type PortalNavGroup = { label: string | null; items: PortalSection[] }

export const portalNav: PortalNavGroup[] = [
  {
    label: null,
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/portal",
        icon: "overview",
        description: "Your upcoming visits, new results and anything that needs you.",
      },
    ],
  },
  {
    label: "My care",
    items: [
      {
        id: "visits",
        label: "Visits",
        href: "/portal/visits",
        icon: "visits",
        description: "Upcoming and past appointments, in person and by video.",
      },
      {
        id: "results",
        label: "Results",
        href: "/portal/results",
        icon: "results",
        description: "Lab and imaging results, with notes from your doctor.",
        badge: "new",
      },
      {
        id: "prescriptions",
        label: "Prescriptions",
        href: "/portal/prescriptions",
        icon: "prescriptions",
        description: "Current medications and refill requests.",
      },
      {
        id: "records",
        label: "Records",
        href: "/portal/records",
        icon: "records",
        description: "Visit summaries, immunizations, allergies and documents.",
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        id: "messages",
        label: "Messages",
        href: "/portal/messages",
        icon: "messages",
        description: "Secure messages with your care team.",
        badge: "count",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        id: "billing",
        label: "Billing",
        href: "/portal/billing",
        icon: "billing",
        description: "Statements, payments and insurance claims.",
        badge: "due",
      },
      {
        id: "family",
        label: "Family",
        href: "/portal/family",
        icon: "family",
        description: "Manage care for the people on your account.",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/portal/settings",
        icon: "settings",
        description: "Profile, password, notifications and privacy.",
      },
    ],
  },
]

/** Every portal page, flat, for routing and page titles. */
const portalSections: PortalSection[] = portalNav.flatMap((g) => g.items)

export const sectionById = (id: PortalIcon) => portalSections.find((s) => s.id === id)!

/** Longest href first, so /portal/visits wins over /portal. */
const byHrefLength = [...portalSections].sort((a, b) => b.href.length - a.href.length)

/** Matches a pathname to its section; nested paths (e.g. /portal/results/123) map to their parent. */
export function sectionForPath(pathname: string): PortalSection {
  return byHrefLength.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`)) ?? portalSections[0]
}

const patient = demoAccounts.find((a) => a.id === "patient")!

export const portalUser = {
  name: patient.name,
  firstName: patient.greeting,
  email: patient.email,
  avatar: "/images/portal/sarah.webp",
}

export const portalCopy = {
  navLabel: "Patient portal",
  homeLabel: "Patient portal home",
  toggle: "Toggle sidebar",
  book: { label: "Book a visit", href: "/book" },
  /** Sidebar badge text for the live counts. */
  badges: {
    results: (n: number) => ({ label: `${n} new`, srLabel: `${n} new ${n === 1 ? "result" : "results"}` }),
    messages: (n: number) => ({ label: `${n}`, srLabel: `${n} unread ${n === 1 ? "message" : "messages"}` }),
    billing: (amount: number) => ({ label: `${wholeMoney(amount)} due`, srLabel: `${money(amount)} due` }),
  },
  error: {
    title: "This page didn’t load",
    text: "Something went wrong on our side. Try again, or head back to your overview.",
    retry: "Try again",
    back: { label: "Back to overview", href: "/portal" },
  },
  account: {
    label: "Account menu",
    settings: { label: "Settings", href: "/portal/settings" },
    website: { label: "Back to website", href: "/" },
    logout: { label: "Log out", href: "/login" },
  },
}

/* ----------------------------------------------------------------------------
 * Overview page. Fictional demo data, pinned to one day (Monday, Oct 19, 2026)
 * so relative times like "in 2 days" stay true; swap these for API data later.
 * ------------------------------------------------------------------------- */

export const portalToday = { iso: "2026-10-19", label: "Monday, October 19" }

export type Tone = "attention" | "normal"
export type PersonId = "sarah" | "david" | "lily" | "noah"

const doctor = visitDoctor

export type FamilyMember = {
  id: PersonId
  name: string
  firstName: string
  age: number
  relation: "self" | "spouse" | "child"
  /** Square photo (320 × 320). */
  avatar: string
  primaryDoctor: ReturnType<typeof doctor>
  nextVisit: { label: string; date: string } | null
  status: { label: string; tone: Tone }
}

export const family: FamilyMember[] = [
  {
    id: "sarah",
    name: "Sarah Mitchell",
    firstName: "Sarah",
    age: 38,
    relation: "self",
    avatar: "/images/portal/sarah.webp",
    primaryDoctor: doctor("emily-chen"),
    nextVisit: { label: "Lab recheck", date: "Jan 14" },
    status: { label: "Vitamin D low", tone: "attention" },
  },
  {
    id: "david",
    name: "David Mitchell",
    firstName: "David",
    age: 41,
    relation: "spouse",
    avatar: "/images/portal/david.webp",
    primaryDoctor: doctor("omar-khalil"),
    nextVisit: { label: "Annual physical", date: "Nov 3" },
    status: { label: "Refill due soon", tone: "attention" },
  },
  {
    id: "lily",
    name: "Lily Mitchell",
    firstName: "Lily",
    age: 15,
    relation: "child",
    avatar: "/images/portal/lily.webp",
    primaryDoctor: doctor("emily-chen"),
    nextVisit: { label: "Sick visit", date: "Tue, Oct 21" },
    status: { label: "Flu shot due", tone: "attention" },
  },
  {
    id: "noah",
    name: "Noah Mitchell",
    firstName: "Noah",
    age: 11,
    relation: "child",
    avatar: "/images/portal/noah.webp",
    primaryDoctor: doctor("sofia-ramirez"),
    nextVisit: { label: "Well-child visit", date: "Dec 9" },
    status: { label: "2 vaccines due", tone: "attention" },
  },
]

const familyById = new Map(family.map((m) => [m.id, m]))
export const personById = (id: PersonId) => familyById.get(id)!

/** The next visit on the Visits page, with the overview's own labels around it. */
const next = upcomingVisits[0]
const nextDoctor = doctor(next.doctorSlug)

export const upcomingVisit = {
  label: "Upcoming visit",
  when: "in 2 days",
  title: next.title,
  date: next.date,
  time: next.time,
  duration: `about ${next.duration}`,
  doctor: nextDoctor,
  location: nextDoctor.clinic,
  reason: next.reason,
  status: [
    { id: "confirmed", label: "Confirmed", tone: "done" },
    { id: "forms", label: "Forms not started", tone: "pending" },
    { id: "check-in", label: "Check-in opens Mon 4:30 PM", tone: "info" },
  ] as const,
  actions: {
    forms: { label: "Complete forms", href: "/portal/visits" },
    reschedule: { label: "Reschedule", href: `/book?doctor=${nextDoctor.slug}` },
    directions: { label: "Get directions" },
  },
  note: "Bring Lily’s insurance card. Estimated copay $20.",
}

export const tasks: {
  id: string
  icon: "forms" | "refill" | "vaccine" | "bill"
  title: string
  personId: PersonId
  due: string
  action: { label: string; href: string }
  tone: Tone
}[] = [
  { id: "t1", icon: "forms", title: "Pre-visit forms", personId: "lily", due: "Before Tue, Oct 21", action: { label: "Complete", href: "/portal/visits" }, tone: "attention" },
  { id: "t2", icon: "refill", title: "Lisinopril 10 mg refill", personId: "david", due: "In 5 days", action: { label: "Request refill", href: "/portal/prescriptions" }, tone: "attention" },
  { id: "t3", icon: "vaccine", title: "Flu shot", personId: "lily", due: "This season", action: { label: "Book", href: "/book?service=vaccines" }, tone: "normal" },
  { id: "t4", icon: "vaccine", title: "2 vaccines (Tdap, HPV)", personId: "noah", due: "Before Dec 9", action: { label: "View", href: "/portal/records" }, tone: "normal" },
  { id: "t5", icon: "bill", title: "October statement", personId: "sarah", due: "Nov 4", action: { label: "Pay", href: "/portal/billing" }, tone: "normal" },
]

/** Insurance's share of the open bills (your share is `amountDue`). */
const insurancePaid = bills.reduce((sum, b) => sum + billTotals(b).insurance, 0)

/** Overview billing card: the open bills from the Billing page, summed. */
export const billing = {
  label: "Amount due",
  /** Warm painted gradient behind the amount due (960 × 540). */
  background: "/images/portal/billing-gradient.webp",
  due: "Due November 4",
  items: bills.map((b) => ({ id: b.id, label: b.short, personId: b.personId, date: b.date.replace(/, \d{4}$/, ""), amount: billTotals(b).you })),
  pay: { href: "/portal/billing" },
  paid: { label: "Paid in full", view: "View billing" },
  securedBy: "Payments secured with 256-bit encryption.",
  /** Who covered what across these visits, for the split bar. */
  split: [
    { id: "insurance", label: "Insurance paid", amount: insurancePaid },
    { id: "you", label: "Your share", amount: amountDue },
  ] as const,
  insuranceNote: `${insurance.name} paid ${money(insurancePaid)} for these visits.`,
}

export const recentResults = {
  title: "Annual blood work",
  personId: "sarah" as PersonId,
  date: "Oct 14, 2026",
  reviewedBy: "Reviewed by Dr. Chen",
  inRange: 18,
  total: 20,
  /** `scale` is the strip's full span; `normal` is the healthy band inside it. */
  flagged: [
    { test: "LDL cholesterol", value: 128, unit: "mg/dL", range: "Under 100 mg/dL", status: "High", scale: [0, 200], normal: [0, 100] },
    { test: "Vitamin D", value: 24, unit: "ng/mL", range: "30–100 ng/mL", status: "Low", scale: [0, 120], normal: [30, 100] },
  ] as { test: string; value: number; unit: string; range: string; status: "High" | "Low"; scale: [number, number]; normal: [number, number] }[],
  noteImage: doctor("emily-chen").image,
  note: "Let’s start vitamin D 2,000 IU daily and recheck both in 3 months. Small diet changes can help your LDL too.",
  noteBy: "Dr. Emily Chen",
}

export type Vital = {
  id: "bp" | "hr" | "weight" | "bmi"
  label: string
  /** Tab label; the panel is narrow, so four short words. */
  short: string
  value: string
  unit: string
  change: string
  /** "good" reads green; "neutral" stays grey. */
  trend: "good" | "neutral"
  date: string
  /** Lines on the chart; most measures have one, blood pressure has two. */
  series: { key: string; label: string }[]
  /** Last four visits, oldest first. */
  history: Record<string, number | string>[]
}

const visits = ["Apr 8", "Jun 12", "Aug 20", "Oct 14"]
const history = (series: Record<string, number[]>) =>
  visits.map((visit, i) => ({ visit, ...Object.fromEntries(Object.entries(series).map(([k, v]) => [k, v[i]])) }))

export const vitals: Vital[] = [
  {
    id: "bp",
    label: "Blood pressure",
    short: "BP",
    value: "118/76",
    unit: "mmHg",
    change: "Stable",
    trend: "good",
    date: "Oct 14",
    series: [
      { key: "systolic", label: "Systolic" },
      { key: "diastolic", label: "Diastolic" },
    ],
    history: history({ systolic: [122, 120, 119, 118], diastolic: [80, 78, 77, 76] }),
  },
  {
    id: "hr",
    label: "Heart rate",
    short: "Heart",
    value: "68",
    unit: "bpm",
    change: "Stable",
    trend: "good",
    date: "Oct 14",
    series: [{ key: "value", label: "Heart rate" }],
    history: history({ value: [72, 70, 69, 68] }),
  },
  {
    id: "weight",
    label: "Weight",
    short: "Weight",
    value: "142",
    unit: "lb",
    change: "−3 lb since April",
    trend: "good",
    date: "Oct 14",
    series: [{ key: "value", label: "Weight" }],
    history: history({ value: [146, 145, 143, 142] }),
  },
  {
    id: "bmi",
    label: "BMI",
    short: "BMI",
    value: "22.6",
    unit: "",
    change: "Normal",
    trend: "good",
    date: "Oct 14",
    series: [{ key: "value", label: "BMI" }],
    history: history({ value: [23.2, 23.0, 22.8, 22.6] }),
  },
]

export const overviewCopy = {
  greeting: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", fallback: "Welcome back" },
  intro: "Here’s what’s happening with your family’s care.",
  book: { label: "Book a visit", href: "/book" },
  family: {
    label: "Your family",
    relation: { self: "You", spouse: "Spouse", child: "Child" } as Record<FamilyMember["relation"], string>,
    tooltip: (name: string, relation: string, age: number) => `${name} · ${relation} · ${age}`,
    href: (id: PersonId) => `/portal/family#${id}`,
    add: { label: "Add family member", href: "/portal/family?add=1" },
  },
  upNext: { heading: "Up next", reasonLabel: "Reason" },
  billing: { heading: "Billing summary" },
  attention: { heading: "Needs your attention", viewAll: (n: number) => `View all (${n})`, href: "/portal/visits", dueSoon: "Due soon", later: "Later", columns: { task: "Task", person: "For", due: "Due", action: "Action" } },
  messages: { heading: "Messages", unread: (n: number) => `${n} unread`, allRead: "All caught up", unreadLabel: "Unread", open: { label: "Open messages", href: "/portal/messages" }, href: (id: string) => `/portal/messages?c=${id}` },
  results: {
    heading: "Recent results",
    inRange: (n: number, total: number) => `${n} of ${total} in range`,
    flaggedHeading: (n: number) => `${n} need attention`,
    normalRange: "Normal range",
    position: (test: string, value: string, range: string) => `${test} ${value}, normal range ${range}`,
    noteLabel: "Doctor’s note",
    view: { label: "View full results", href: "/portal/results/sarah-annual-2026-10" },
  },
  snapshot: {
    heading: (first: string) => `Health snapshot (${first})`,
    source: "Source: Recorded at visit",
    chartLabel: (label: string) => `${label} at the last 4 visits`,
    picker: "Choose a measure",
    latest: (date: string) => `Latest · ${date}`,
  },
}

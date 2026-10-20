// /portal/family: who's on the account, what each person shares, and how to add someone.
// People, photos, ages and doctors come from the shared family data in portal.ts.

import type { PersonId } from "@/lib/data/portal"

export type ShareItem = { id: "visits" | "billing" | "results" | "messages"; label: string }

export const shareItems: ShareItem[] = [
  { id: "visits", label: "Visits and appointments" },
  { id: "billing", label: "Billing" },
  { id: "results", label: "Results" },
  { id: "messages", label: "Messages" },
]

export type MemberAccess = {
  personId: PersonId
  relationship: string
  access: string
  /** What this person shares with Sarah. Children share everything through guardianship. */
  shared: ShareItem["id"][]
  /** Adults control their own sharing. */
  controlsOwn: boolean
  alert?: { label: string; href: string }
}

export const memberAccess: MemberAccess[] = [
  {
    personId: "sarah",
    relationship: "You (account owner)",
    access: "Full access",
    shared: ["visits", "billing", "results", "messages"],
    controlsOwn: true,
    alert: { label: "Vitamin D low · recheck Jan 14", href: "/portal/results/sarah-annual-2026-10" },
  },
  {
    personId: "david",
    relationship: "Spouse",
    access: "Shared by David · Visits and billing",
    shared: ["visits", "billing"],
    controlsOwn: true,
    alert: { label: "Lisinopril refill due in 5 days", href: "/portal/prescriptions" },
  },
  {
    personId: "lily",
    relationship: "Daughter",
    access: "Full access (guardian)",
    shared: ["visits", "billing", "results", "messages"],
    controlsOwn: false,
    alert: { label: "Flu shot due · sick visit Tue, Oct 21", href: "/portal/visits?person=lily" },
  },
  {
    personId: "noah",
    relationship: "Son",
    access: "Full access (guardian)",
    shared: ["visits", "billing", "results", "messages"],
    controlsOwn: false,
    alert: { label: "2 vaccines due by Dec 9", href: "/portal/records" },
  },
]

export const relationships = [
  { id: "child", label: "Child", adult: false },
  { id: "partner", label: "Spouse or partner", adult: true },
  { id: "parent", label: "Parent", adult: true },
  { id: "dependent", label: "Other dependent", adult: false },
]

export const sexes = ["Female", "Male", "Another option", "Prefer not to say"]

export const familyCopy = {
  heading: "Family",
  intro: "Manage care for everyone in your household.",
  add: "Add family member",
  card: {
    age: (n: number) => `Age ${n}`,
    doctor: "Primary doctor",
    access: "Access",
    next: "Next visit",
    noVisit: "No visit booked",
    viewCare: "View care",
    viewCareHref: (id: PersonId) => `/portal/visits?person=${id}`,
    book: (first: string) => `Book for ${first}`,
    bookHref: (doctorSlug: string) => `/book?doctor=${doctorSlug}`,
    manage: "Manage access",
    invited: "Invite sent · waiting for them to accept",
    newMember: "Just added",
  },
  explainer: {
    title: "How family access works",
    children: { title: "Children under 18", body: "As a parent or guardian, you can see their visits, results, vaccines, and messages." },
    adults: { title: "Adults", body: "Each adult controls what they share. David chose to share visits and billing with you." },
  },
  addSheet: {
    title: "Add a family member",
    relationship: "Relationship",
    firstName: "First name",
    lastName: "Last name",
    dob: "Date of birth",
    dobPlaceholder: "Select a date",
    sex: "Sex",
    insurance: "Insurance",
    sameInsurance: (plan: string) => `Same as mine (${plan})`,
    otherInsurance: "Different insurance",
    adultNote: "We’ll send them an invite to approve access.",
    required: "Required",
    submit: "Add member",
    success: (first: string, adult: boolean) => (adult ? `Invite sent to ${first}. They’ll show here once they accept.` : `${first} was added to your family.`),
    done: "Done",
  },
  manageSheet: {
    title: (first: string) => `${first}’s access`,
    sharedWith: (owner: string) => `Shared with ${owner}`,
    onlyThem: (first: string) => `Only ${first} can change these settings.`,
    guardian: "As their guardian, you can see everything for children under 18.",
    owner: "You own this account, so you can see and manage everything.",
    on: "Shared",
    off: "Not shared",
  },
}

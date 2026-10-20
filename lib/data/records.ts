// /portal/records: vaccines, documents and health summaries. Visit notes come straight from the
// visits data, so both pages always show the same notes. Fictional demo data, pinned to Oct 19, 2026.
// The exported types (VaccineRecord, RecordDocument, HealthSummary) are the shapes a records API would return.

import type { PersonId } from "@/lib/data/portal"

export type VaccineStatus = "due" | "given" | "complete" | "recommended" | "upcoming"

export type Vaccine = { name: string; dose?: string; date: string; status: VaccineStatus }

export type VaccineRecord = { personId: PersonId; summary: { label: string; tone: "due" | "ok" | "recommended" }; vaccines: Vaccine[] }

export const vaccineRecords: VaccineRecord[] = [
  {
    personId: "noah",
    summary: { label: "2 due", tone: "due" },
    vaccines: [
      { name: "Tdap", dose: "Booster", date: "Due by Dec 9, 2026", status: "due" },
      { name: "HPV", dose: "1 of 2", date: "Due by Dec 9, 2026", status: "due" },
      { name: "Flu", dose: "2026–27 season", date: "—", status: "recommended" },
      { name: "DTaP", dose: "5 of 5", date: "Mar 2019", status: "complete" },
      { name: "Polio (IPV)", dose: "4 of 4", date: "Mar 2019", status: "complete" },
      { name: "MMR", dose: "2 of 2", date: "Mar 2019", status: "complete" },
      { name: "Varicella", dose: "2 of 2", date: "Mar 2019", status: "complete" },
    ],
  },
  {
    personId: "lily",
    summary: { label: "Flu shot due", tone: "due" },
    vaccines: [
      { name: "Flu", dose: "2026–27 season", date: "Due now", status: "due" },
      { name: "MenACWY", dose: "2 of 2", date: "At age 16 (Aug 2027)", status: "upcoming" },
      { name: "MenACWY", dose: "1 of 2", date: "Aug 2022", status: "given" },
      { name: "HPV", dose: "2 of 2", date: "Feb 2023", status: "complete" },
      { name: "Tdap", dose: "Booster", date: "Aug 2022", status: "complete" },
      { name: "MMR", dose: "2 of 2", date: "Jun 2015", status: "complete" },
    ],
  },
  {
    personId: "sarah",
    summary: { label: "Up to date", tone: "ok" },
    vaccines: [
      { name: "Flu", dose: "2026–27 season", date: "Oct 14, 2026", status: "given" },
      { name: "Tdap", dose: "Booster", date: "2021", status: "complete" },
    ],
  },
  {
    personId: "david",
    summary: { label: "Flu shot recommended", tone: "recommended" },
    vaccines: [
      { name: "Flu", dose: "2026–27 season", date: "—", status: "recommended" },
      { name: "Tdap", dose: "Booster", date: "2019", status: "complete" },
    ],
  },
]

export type RecordDocument = { id: string; name: string; personId: PersonId; added: string; type: "PDF" | "Image"; note?: string; size: string }

export const documents: RecordDocument[] = [
  { id: "d-sports", name: "School sports form", personId: "lily", added: "May 20, 2026", type: "PDF", note: "Signed by Dr. Chen", size: "184 KB" },
  { id: "d-school-vax", name: "School vaccine record", personId: "noah", added: "Aug 18, 2026", type: "PDF", size: "96 KB" },
  { id: "d-insurance", name: "Insurance card (front and back)", personId: "sarah", added: "Mar 3, 2026", type: "Image", size: "1.2 MB" },
  { id: "d-outside-labs", name: "Outside lab results", personId: "david", added: "Jan 20, 2026", type: "PDF", note: "Uploaded by you", size: "312 KB" },
]

export type HealthSummary = {
  personId: PersonId
  conditions: string
  allergies: string
  medications: string
  procedures: string
  familyHistory: string
  primaryDoctor: string
}

const NO_KNOWN_ALLERGIES = "No known allergies"
/** True when the allergies line lists something (shown in red). */
export const hasAllergies = (text: string) => text !== NO_KNOWN_ALLERGIES

export const healthSummaries: HealthSummary[] = [
  {
    personId: "sarah",
    conditions: "Low vitamin D",
    allergies: "Sulfa drugs (rash)",
    medications: "Vitamin D3 2,000 IU daily",
    procedures: "Wisdom teeth removal (2008)",
    familyHistory: "High blood pressure (father) · Type 2 diabetes (grandmother)",
    primaryDoctor: "emily-chen",
  },
  {
    personId: "david",
    conditions: "High blood pressure (stage 1, since Apr 2026)",
    allergies: NO_KNOWN_ALLERGIES,
    medications: "Lisinopril 10 mg daily",
    procedures: "Appendix removal (2010)",
    familyHistory: "Heart disease (father) · High cholesterol (mother)",
    primaryDoctor: "omar-khalil",
  },
  {
    personId: "lily",
    conditions: "None",
    allergies: NO_KNOWN_ALLERGIES,
    medications: "None right now",
    procedures: "None",
    familyHistory: "High blood pressure (grandfather) · Type 2 diabetes (great-grandmother)",
    primaryDoctor: "emily-chen",
  },
  {
    personId: "noah",
    conditions: "Mild eczema",
    allergies: NO_KNOWN_ALLERGIES,
    medications: "Fragrance-free moisturizer as needed",
    procedures: "None",
    familyHistory: "High blood pressure (grandfather) · Heart disease (grandfather)",
    primaryDoctor: "sofia-ramirez",
  },
]

export const shareables = [
  { id: "notes", label: "Visit notes" },
  { id: "results", label: "Results" },
  { id: "vaccines", label: "Vaccines" },
  { id: "summary", label: "Health summary" },
]

export const recordsCopy = {
  heading: "Records",
  intro: "Visit notes, vaccines, and documents for your family.",
  downloadAll: "Download all records",
  share: "Share with another doctor",
  filters: { person: "Show records for", allFamily: "All family" },
  tabs: [
    { id: "notes", label: "Visit notes" },
    { id: "vaccines", label: "Vaccines" },
    { id: "documents", label: "Documents" },
    { id: "summary", label: "Health summary" },
  ] as const,
  notes: {
    columns: { date: "Date", patient: "Patient", visit: "Visit", doctor: "Doctor", file: "File" },
    view: "View",
    download: "Download",
    empty: "No visit notes yet.",
  },
  vaccines: {
    file: {
      title: (name: string, age: number) => `Vaccine record · ${name} (age ${age})`,
      clinic: "Linden Health",
      line: (name: string, dose: string | undefined, date: string, status: string) => `${name}${dose ? ` (${dose})` : ""}: ${date} · ${status}`,
    },
    columns: { vaccine: "Vaccine", dose: "Dose", date: "Date", status: "Status" },
    status: { due: "Due", given: "Given", complete: "Complete", recommended: "Recommended", upcoming: "Upcoming" } as Record<VaccineStatus, string>,
    download: "Download vaccine record",
    downloadNote: "For school, camp, or sports",
    book: { label: "Book a vaccine visit", href: "/book?service=vaccines" },
  },
  documents: {
    columns: { name: "Name", patient: "Patient", added: "Added", type: "Type" },
    upload: "Upload a document",
    uploadHint: "PDF, JPG, or PNG, up to 10 MB",
    uploadedNote: "Uploaded by you",
    tooBig: "That file is over 10 MB. Try a smaller file.",
    wrongType: "Please choose a PDF, JPG, or PNG.",
    added: (name: string, person: string) => `${name} added to ${person}’s documents.`,
    view: "View",
    previewNote: "This is a demo, so there’s no real file to show. In your portal, the document opens here.",
    today: "Oct 19, 2026",
    empty: "No documents yet.",
  },
  summary: {
    for: (name: string) => `${name}’s health summary`,
    conditions: "Conditions",
    allergies: "Allergies",
    medications: "Medications",
    procedures: "Past procedures",
    familyHistory: "Family history",
    primaryDoctor: "Primary doctor",
    download: "Download summary",
    pick: "Showing the account owner. Choose a family member above to see theirs.",
  },
  shareSheet: {
    /** Section headings of the downloaded records bundle. */
    bundle: {
      title: "Linden Health · Family records",
      notes: "VISIT NOTES",
      results: "RESULTS",
      vaccines: "VACCINES",
      summaries: "HEALTH SUMMARIES",
      result: (first: string, title: string, date: string, inRange: number, total: number) => `${first} · ${title} · ${date} · ${inRange} of ${total} in range`,
      filename: "linden-health-records.txt",
    },
    title: "Share records",
    who: "Who is it for?",
    whoOptions: [
      { id: "doctor", label: "Another doctor or clinic" },
      { id: "myself", label: "Myself (download)" },
    ],
    records: "Records to share",
    sendTo: "Send to",
    name: { label: "Doctor’s name", placeholder: "Dr. Jordan Lee" },
    clinic: { label: "Clinic", placeholder: "Westside Family Practice" },
    email: { label: "Secure email", placeholder: "records@clinic.example" },
    emailError: "Enter a valid email address",
    pickOne: "Choose at least one type of record",
    shareButton: "Share securely",
    downloadButton: "Download records",
    expiry: "The link expires in 7 days.",
    shared: (to: string) => `Shared with ${to}. They’ll get a secure link that expires in 7 days.`,
    downloaded: "Your records are downloading.",
    done: "Done",
  },
}

// /portal/results: the family's lab and test results. Fictional demo data, pinned to Monday,
// Oct 19, 2026. Status (Normal / High / Low) is worked out from each value and its range, so the
// numbers, the range bars and the "need attention" counts can never disagree.

import type { PersonId } from "@/lib/data/portal"

export type ResultType = "blood" | "rapid" | "screening"

export type LabTest = {
  id: string
  name: string
  /** A number for measured tests, or text like "Negative" for yes/no tests. */
  value: number | string
  unit?: string
  /** Normal range bounds. Leave one out for "Under 100" or "50 or higher". */
  low?: number
  high?: number
  /** For yes/no tests: the result that counts as normal. */
  normalText?: string
  range: string
  about: string
  trend?: { label: string; value: number }[]
  trendNote?: string
}

export type TestStatus = "normal" | "high" | "low" | "abnormal"

export function statusOf(test: LabTest): TestStatus {
  if (typeof test.value === "string") return test.value === test.normalText ? "normal" : "abnormal"
  if (test.low !== undefined && test.value < test.low) return "low"
  if (test.high !== undefined && test.value > test.high) return "high"
  return "normal"
}

export type LabResult = {
  id: string
  /** ISO date, for sorting and the date-range filter. */
  iso: string
  date: string
  personId: PersonId
  title: string
  type: ResultType
  orderedBy: string
  collected: string
  lab: string
  /** Shown with a "New" dot in the list until it's opened. */
  isNew?: boolean
  note: { text: string; date: string }
  sections: { title: string; tests: LabTest[] }[]
  /** Flagged tests over time, for the Trends card. */
  trends?: { test: string; unit: string; points: { label: string; value: number }[]; direction: string; better: boolean }[]
  nextSteps?: { label: string; done: boolean; detail?: string; action?: { label: string; href: string } }[]
}

export const allTests = (r: Pick<LabResult, "sections">) => r.sections.flatMap((s) => s.tests)
export const flaggedCount = (r: Pick<LabResult, "sections">) => allTests(r).filter((t) => statusOf(t) !== "normal").length

const ldlTrend = [
  { label: "Apr 2025", value: 138 },
  { label: "Apr 2026", value: 134 },
  { label: "Oct 2026", value: 128 },
]
const vitaminDTrend = [
  { label: "Apr 2025", value: 21 },
  { label: "Apr 2026", value: 22 },
  { label: "Oct 2026", value: 24 },
]

const about = {
  totalCholesterol: "All the cholesterol in your blood, good and bad together.",
  ldl: "LDL is often called “bad” cholesterol. High levels can build up in your arteries over time.",
  hdl: "HDL is the “good” cholesterol. It helps clear extra cholesterol from your blood, so higher is better.",
  triglycerides: "A type of fat in your blood that comes from food. High levels add to heart risk.",
  glucose: "Your blood sugar after not eating overnight. It’s a quick check for diabetes.",
  a1c: "Your average blood sugar over the last 2–3 months.",
  tsh: "A hormone that tells your thyroid how hard to work. It’s the main check for thyroid problems.",
  vitaminD: "Helps keep your bones and muscles strong. Low levels are common, especially in winter.",
  wbc: "Cells that fight infection. High or low counts can point to an infection or other problem.",
  rbc: "Cells that carry oxygen around your body.",
  hemoglobin: "The protein in red blood cells that carries oxygen. Low levels can mean anemia.",
  hematocrit: "How much of your blood is made up of red blood cells.",
  platelets: "Tiny cells that help your blood clot when you get a cut.",
  creatinine: "A waste product your kidneys filter out. It shows how well your kidneys are working.",
  egfr: "An estimate of how well your kidneys filter your blood.",
  sodium: "A salt that keeps your body’s fluids and nerves balanced.",
  potassium: "A mineral your heart and muscles need to work properly.",
  calcium: "A mineral for strong bones, and for your heart and nerves.",
  alt: "A liver enzyme. High levels can be a sign of liver irritation.",
  ast: "Another liver enzyme, also found in muscles.",
  strep: "Checks a throat swab for the bacteria that cause strep throat.",
  nonHdl: "Total cholesterol minus HDL: all the cholesterol that can clog arteries.",
}

export const results: LabResult[] = [
  {
    id: "sarah-annual-2026-10",
    iso: "2026-10-14",
    date: "Oct 14, 2026",
    personId: "sarah",
    title: "Annual blood work",
    type: "blood",
    orderedBy: "emily-chen",
    collected: "Collected Oct 14, 2026 at 8:12 AM",
    lab: "Linden Health Cleveland lab",
    isNew: true,
    note: {
      text: "Most of your results look great. Your LDL cholesterol is a little high, and your vitamin D is low. Let’s start vitamin D 2,000 IU daily and recheck both in 3 months. Small diet changes, like more fiber and less fried food, can help your LDL too.",
      date: "Oct 15",
    },
    sections: [
      {
        title: "Heart health (lipids)",
        tests: [
          { id: "tc", name: "Total cholesterol", value: 196, unit: "mg/dL", high: 199, range: "Under 200 mg/dL", about: about.totalCholesterol },
          { id: "ldl", name: "LDL cholesterol", value: 128, unit: "mg/dL", high: 99, range: "Under 100 mg/dL", about: about.ldl, trend: ldlTrend, trendNote: "Getting better since last year." },
          { id: "hdl", name: "HDL cholesterol", value: 52, unit: "mg/dL", low: 50, range: "50 mg/dL or higher", about: about.hdl },
          { id: "tg", name: "Triglycerides", value: 80, unit: "mg/dL", high: 149, range: "Under 150 mg/dL", about: about.triglycerides },
        ],
      },
      {
        title: "Blood sugar and thyroid",
        tests: [
          { id: "glucose", name: "Glucose (fasting)", value: 88, unit: "mg/dL", low: 70, high: 99, range: "70–99 mg/dL", about: about.glucose },
          { id: "a1c", name: "Hemoglobin A1c", value: 5.4, unit: "%", low: 4, high: 5.6, range: "4.0–5.6 %", about: about.a1c },
          { id: "tsh", name: "TSH", value: 2.1, unit: "mIU/L", low: 0.4, high: 4, range: "0.4–4.0 mIU/L", about: about.tsh },
        ],
      },
      {
        title: "Vitamins",
        tests: [
          { id: "vitd", name: "Vitamin D", value: 24, unit: "ng/mL", low: 30, high: 100, range: "30–100 ng/mL", about: about.vitaminD, trend: vitaminDTrend, trendNote: "Slowly going up, but still below the healthy range." },
        ],
      },
      {
        title: "Blood count",
        tests: [
          { id: "wbc", name: "White blood cells", value: 6.2, unit: "K/µL", low: 4, high: 11, range: "4.0–11.0 K/µL", about: about.wbc },
          { id: "rbc", name: "Red blood cells", value: 4.5, unit: "M/µL", low: 4, high: 5.2, range: "4.0–5.2 M/µL", about: about.rbc },
          { id: "hgb", name: "Hemoglobin", value: 13.4, unit: "g/dL", low: 12, high: 15.5, range: "12.0–15.5 g/dL", about: about.hemoglobin },
          { id: "hct", name: "Hematocrit", value: 40.1, unit: "%", low: 36, high: 46, range: "36–46 %", about: about.hematocrit },
          { id: "plt", name: "Platelets", value: 248, unit: "K/µL", low: 150, high: 400, range: "150–400 K/µL", about: about.platelets },
        ],
      },
      {
        title: "Kidney, liver, and minerals",
        tests: [
          { id: "creat", name: "Creatinine", value: 0.82, unit: "mg/dL", low: 0.57, high: 1, range: "0.57–1.00 mg/dL", about: about.creatinine },
          { id: "egfr", name: "eGFR", value: 92, unit: "mL/min/1.73m²", low: 60, range: "60 or higher", about: about.egfr },
          { id: "na", name: "Sodium", value: 139, unit: "mmol/L", low: 135, high: 145, range: "135–145 mmol/L", about: about.sodium },
          { id: "k", name: "Potassium", value: 4.2, unit: "mmol/L", low: 3.5, high: 5.1, range: "3.5–5.1 mmol/L", about: about.potassium },
          { id: "ca", name: "Calcium", value: 9.4, unit: "mg/dL", low: 8.6, high: 10.3, range: "8.6–10.3 mg/dL", about: about.calcium },
          { id: "alt", name: "ALT", value: 18, unit: "U/L", low: 7, high: 35, range: "7–35 U/L", about: about.alt },
          { id: "ast", name: "AST", value: 21, unit: "U/L", low: 10, high: 35, range: "10–35 U/L", about: about.ast },
        ],
      },
    ],
    trends: [
      { test: "LDL cholesterol", unit: "mg/dL", points: ldlTrend, direction: "Improving", better: true },
      { test: "Vitamin D", unit: "ng/mL", points: vitaminDTrend, direction: "Slowly improving", better: true },
    ],
    nextSteps: [
      { label: "Start vitamin D 2,000 IU daily", done: true, detail: "Added to Prescriptions" },
      { label: "Recheck LDL and vitamin D", done: false, detail: "Due January 14, 2027", action: { label: "Book lab visit", href: "/book?doctor=emily-chen&service=labs" } },
    ],
  },
  {
    id: "lily-strep-2026-10",
    iso: "2026-10-02",
    date: "Oct 2, 2026",
    personId: "lily",
    title: "Rapid strep test",
    type: "rapid",
    orderedBy: "emily-chen",
    collected: "Collected Oct 2, 2026 at 3:28 PM",
    lab: "Linden Health Cleveland",
    note: { text: "No strep. Her sore throat was from the ear infection. Keep giving the amoxicillin as prescribed.", date: "Oct 2" },
    sections: [{ title: "Result", tests: [{ id: "strep", name: "Strep A (rapid)", value: "Negative", normalText: "Negative", range: "Negative", about: about.strep }] }],
  },
  {
    id: "noah-lipid-2026-06",
    iso: "2026-06-12",
    date: "Jun 12, 2026",
    personId: "noah",
    title: "Cholesterol screening",
    type: "screening",
    orderedBy: "sofia-ramirez",
    collected: "Collected Jun 12, 2026 at 10:40 AM",
    lab: "Linden Health Beachwood lab",
    note: { text: "Normal result. No follow-up needed. This screening is recommended once for every child between 9 and 11.", date: "Jun 13" },
    sections: [
      {
        title: "Heart health (lipids)",
        tests: [
          { id: "tc", name: "Total cholesterol", value: 152, unit: "mg/dL", high: 169, range: "Under 170 mg/dL", about: about.totalCholesterol },
          { id: "ldl", name: "LDL cholesterol", value: 88, unit: "mg/dL", high: 109, range: "Under 110 mg/dL", about: about.ldl },
          { id: "hdl", name: "HDL cholesterol", value: 56, unit: "mg/dL", low: 46, range: "Over 45 mg/dL", about: about.hdl },
          { id: "nonhdl", name: "Non-HDL cholesterol", value: 96, unit: "mg/dL", high: 119, range: "Under 120 mg/dL", about: about.nonHdl },
        ],
      },
    ],
  },
  {
    id: "david-annual-2026-04",
    iso: "2026-04-08",
    date: "Apr 8, 2026",
    personId: "david",
    title: "Annual blood work",
    type: "blood",
    orderedBy: "omar-khalil",
    collected: "Collected Apr 8, 2026 at 7:55 AM",
    lab: "Linden Health Cleveland lab",
    note: { text: "Let’s recheck at your November physical and talk about next steps.", date: "Apr 9" },
    sections: [
      {
        title: "Heart health (lipids)",
        tests: [
          { id: "tc", name: "Total cholesterol", value: 214, unit: "mg/dL", high: 199, range: "Under 200 mg/dL", about: about.totalCholesterol },
          { id: "ldl", name: "LDL cholesterol", value: 142, unit: "mg/dL", high: 99, range: "Under 100 mg/dL", about: about.ldl },
          { id: "hdl", name: "HDL cholesterol", value: 44, unit: "mg/dL", low: 40, range: "40 mg/dL or higher", about: about.hdl },
          { id: "tg", name: "Triglycerides", value: 132, unit: "mg/dL", high: 149, range: "Under 150 mg/dL", about: about.triglycerides },
        ],
      },
      {
        title: "Blood sugar and thyroid",
        tests: [
          { id: "glucose", name: "Glucose (fasting)", value: 94, unit: "mg/dL", low: 70, high: 99, range: "70–99 mg/dL", about: about.glucose },
          { id: "a1c", name: "Hemoglobin A1c", value: 5.6, unit: "%", low: 4, high: 5.6, range: "4.0–5.6 %", about: about.a1c },
          { id: "tsh", name: "TSH", value: 1.8, unit: "mIU/L", low: 0.4, high: 4, range: "0.4–4.0 mIU/L", about: about.tsh },
        ],
      },
      {
        title: "Blood count",
        tests: [{ id: "hgb", name: "Hemoglobin", value: 15.1, unit: "g/dL", low: 13.5, high: 17.5, range: "13.5–17.5 g/dL", about: about.hemoglobin }],
      },
      {
        title: "Kidney, liver, and minerals",
        tests: [
          { id: "creat", name: "Creatinine", value: 1.02, unit: "mg/dL", low: 0.74, high: 1.35, range: "0.74–1.35 mg/dL", about: about.creatinine },
          { id: "na", name: "Sodium", value: 141, unit: "mmol/L", low: 135, high: 145, range: "135–145 mmol/L", about: about.sodium },
          { id: "k", name: "Potassium", value: 4.4, unit: "mmol/L", low: 3.5, high: 5.1, range: "3.5–5.1 mmol/L", about: about.potassium },
          { id: "alt", name: "ALT", value: 26, unit: "U/L", low: 7, high: 55, range: "7–55 U/L", about: about.alt },
        ],
      },
    ],
  },
  {
    id: "sarah-lipid-2026-04",
    iso: "2026-04-08",
    date: "Apr 8, 2026",
    personId: "sarah",
    title: "Lipid panel + vitamin D",
    type: "blood",
    orderedBy: "emily-chen",
    collected: "Collected Apr 8, 2026 at 8:30 AM",
    lab: "Linden Health Cleveland lab",
    note: { text: "LDL is a bit lower than last year. Vitamin D is still low, so let’s talk about a supplement at your physical.", date: "Apr 9" },
    sections: [
      {
        title: "Heart health (lipids)",
        tests: [
          { id: "tc", name: "Total cholesterol", value: 199, unit: "mg/dL", high: 199, range: "Under 200 mg/dL", about: about.totalCholesterol },
          { id: "ldl", name: "LDL cholesterol", value: 134, unit: "mg/dL", high: 99, range: "Under 100 mg/dL", about: about.ldl },
          { id: "hdl", name: "HDL cholesterol", value: 50, unit: "mg/dL", low: 50, range: "50 mg/dL or higher", about: about.hdl },
          { id: "tg", name: "Triglycerides", value: 88, unit: "mg/dL", high: 149, range: "Under 150 mg/dL", about: about.triglycerides },
        ],
      },
      {
        title: "Vitamins",
        tests: [{ id: "vitd", name: "Vitamin D", value: 22, unit: "ng/mL", low: 30, high: 100, range: "30–100 ng/mL", about: about.vitaminD }],
      },
    ],
  },
]

const resultsById = new Map(results.map((r) => [r.id, r]))
/** Replace with a fetch to e.g. `/api/results/:id` when wiring a backend. */
export const resultById = (id: string) => resultsById.get(id)

/** The portal is pinned to this day, so "last 30 days" etc. always mean the same thing. */
export const RESULTS_TODAY = "2026-10-19"

export const resultsCopy = {
  heading: "Results",
  intro: "Lab and test results for your family, reviewed by your doctor.",
  filters: {
    person: "Show results for",
    allFamily: "All family",
    type: "Test type",
    types: [
      { id: "all", label: "All" },
      { id: "blood", label: "Blood work" },
      { id: "rapid", label: "Rapid tests" },
      { id: "screening", label: "Screenings" },
    ] as { id: "all" | ResultType; label: string }[],
    dateLabel: "Date range",
    dates: [
      { value: "all", label: "All time", days: null },
      { value: "30", label: "Last 30 days", days: 30 },
      { value: "180", label: "Last 6 months", days: 180 },
      { value: "365", label: "Last 12 months", days: 365 },
    ] as { value: string; label: string; days: number | null }[],
    search: "Search a test",
    searchPlaceholder: "Search a test, like “cholesterol”",
  },
  columns: { date: "Date", patient: "Patient", test: "Test", orderedBy: "Ordered by", status: "Status" },
  testCount: (n: number) => `${n} ${n === 1 ? "test" : "tests"}`,
  status: {
    new: "New",
    normal: "Normal",
    attention: (n: number) => `${n} ${n === 1 ? "needs" : "need"} attention`,
  },
  matches: (names: string[]) => `Matches: ${names.join(", ")}`,
  empty: { text: "No results match these filters.", clear: "Clear filters" },
  open: (title: string, name: string) => `Open ${name}’s ${title.toLowerCase()}`,
  detail: {
    back: "All results",
    orderedBy: (doctor: string, lab: string) => `Ordered by ${doctor} · ${lab}`,
    summary: (inRange: number, total: number) => `${inRange} of ${total} in range`,
    download: "Download PDF",
    message: (doctor: string) => `Message ${doctor}`,
    messageHref: "/portal/messages",
    recheck: "Book recheck",
    recheckHref: (slug: string) => `/book?doctor=${slug}&service=labs`,
    noteLabel: "Doctor’s note",
    chips: { all: "All", attention: "Needs attention", normal: "In range" },
    chipsLabel: "Show tests",
    statusLabel: { normal: "Normal", high: "High", low: "Low", abnormal: "Abnormal" },
    normalRange: "Normal range",
    columns: { test: "Test", result: "Result", status: "Status" },
    done: "Done: ",
    todo: "To do: ",
    whatItMeasures: "What it measures",
    yourTrend: "Your trend",
    rangeBar: (name: string, value: string, range: string) => `${name}: ${value}. Normal range ${range}.`,
    trends: { heading: "Trends", subtitle: "Your flagged tests over time" },
    nextSteps: "Next steps",
  },
}

// /portal/billing: bills, payments and insurance. Fictional demo data, pinned to Oct 19, 2026.
// Amounts line up with the visits page: every visit's "you paid" share appears on a statement,
// and the yearly totals below are added up from the visits, not typed in.
// The exported types (Bill, Statement, PaymentMethod) are the shapes a billing API would return.

import type { PersonId } from "@/lib/data/portal"
import { insurancePlans } from "@/lib/data/insurance"
import { pastVisits } from "@/lib/data/visits"

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
/** "$1,234.50", the one money format across the portal. */
export const money = (n: number) => usd.format(n)
/** "$45" for whole amounts, "$45.50" otherwise (badges, meters). */
export const wholeMoney = (n: number) => money(n).replace(/\.00$/, "")
const amount = (s: string) => Number(s.replace(/[$,]/g, ""))

export type BillLine = { label: string; charge: number; insurance: number; you: number }

export type Bill = {
  id: string
  date: string
  personId: PersonId
  service: string
  /** Short name for the overview card, e.g. "Annual physical". */
  short: string
  lines: BillLine[]
  claim: string
  processed: string
}

/** Bills on the October statement (still owed). */
export const bills: Bill[] = [
  {
    id: "bill-sarah-1014",
    date: "Oct 14, 2026",
    personId: "sarah",
    service: "Annual physical + blood work",
    short: "Annual physical",
    lines: [
      { label: "Annual physical (preventive)", charge: 180, insurance: 180, you: 0 },
      { label: "Blood work panel", charge: 31.4, insurance: 6.4, you: 25 },
    ],
    claim: "NBH-CLM-2026-55821",
    processed: "Processed Oct 17",
  },
  {
    id: "bill-lily-1002",
    date: "Oct 2, 2026",
    personId: "lily",
    service: "Sick visit + rapid strep",
    short: "Sick visit",
    lines: [
      { label: "Sick visit (primary care)", charge: 112, insurance: 92, you: 20 },
      { label: "Rapid strep test", charge: 20, insurance: 20, you: 0 },
    ],
    claim: "NBH-CLM-2026-55377",
    processed: "Processed Oct 7",
  },
]

export const billTotals = (b: Bill) => ({
  charge: b.lines.reduce((s, l) => s + l.charge, 0),
  insurance: b.lines.reduce((s, l) => s + l.insurance, 0),
  you: b.lines.reduce((s, l) => s + l.you, 0),
})

export const amountDue = bills.reduce((s, b) => s + billTotals(b).you, 0)
export const dueDate = "Nov 4, 2026"

export type Statement = { id: string; month: string; amount: number; status: "due" | "paid"; date: string }

/** Earlier statements, one per month with something owed (matching each visit's "you paid"). */
export const statements: Statement[] = [
  { id: "st-2026-10", month: "October 2026", amount: amountDue, status: "due", date: `Due ${dueDate.replace(", 2026", "")}` },
  { id: "st-2026-09", month: "September 2026", amount: 15, status: "paid", date: "Paid Sep 30" },
  { id: "st-2026-08", month: "August 2026", amount: 15, status: "paid", date: "Paid Aug 28" },
  { id: "st-2026-07", month: "July 2026", amount: 50, status: "paid", date: "Paid Jul 25" },
  { id: "st-2026-04", month: "April 2026", amount: 20, status: "paid", date: "Paid Apr 30" },
]

/** Visits this year, minus the ones still on the open bill. */
const settled = pastVisits.filter((v) => v.date.endsWith("2026") && !bills.some((b) => b.date === v.date && b.personId === v.personId))

export const yearToDate = {
  paid: settled.reduce((s, v) => s + amount(v.detail.billing.you), 0),
  insurance: pastVisits.filter((v) => v.date.endsWith("2026")).reduce((s, v) => s + amount(v.detail.billing.insurance), 0),
}

export const deductible = { met: 412, total: 2000 }
export const outOfPocket = { spent: yearToDate.paid + amountDue, max: 6000 }

export type PaymentMethod = { id: string; label: string; expires: string; kind: "card" | "hsa" }

export const paymentMethods: PaymentMethod[] = [
  { id: "visa-4417", label: "Visa ending 4417", expires: "08/28", kind: "card" },
  { id: "hsa-2290", label: "HSA card ending 2290", expires: "03/29", kind: "hsa" },
]

export const insurance = {
  name: "Northbridge Health PPO",
  rank: "Primary",
  memberId: "NBH-4821-7730",
  group: "55120",
  holder: "Sarah Mitchell",
  covers: ["sarah", "david", "lily", "noah"] as PersonId[],
  copays: [
    { label: "Primary care", amount: "$20" },
    { label: "Specialist", amount: "$50" },
    { label: "Video visit", amount: "$15" },
  ],
  phone: "(800) 555-0199",
}

/** Confirmation numbers for demo payments, in order. */
export const confirmations = ["LH-PAY-77310", "LH-PAY-77311", "LH-PAY-77312", "LH-PAY-77313"]

export const billingCopy = {
  heading: "Billing",
  intro: "Bills, payments, and insurance for your family.",
  tabs: [
    { id: "overview", label: "Overview" },
    { id: "statements", label: "Statements" },
    { id: "methods", label: "Payment methods" },
    { id: "insurance", label: "Insurance" },
  ] as const,
  cards: { due: "Amount due", dueDate: "Due date", paid: "Paid this year", insurance: "Insurance paid this year", nothingDue: "Nothing due", paidOn: "Paid today" },
  billsDue: "Bills due",
  billsPaid: "All paid. Thank you!",
  columns: { date: "Date", patient: "Patient", service: "Service", total: "Total", insurance: "Insurance paid", you: "You owe" },
  pay: (amount: string) => `Pay ${amount}`,
  details: "Details",
  deductible: {
    title: "Coverage this year",
    plan: (plan: string) => `${plan} · Family plan`,
    deductible: { label: "Deductible", left: (left: string) => `${left} left before insurance pays its share` },
    oop: { label: "Out-of-pocket max", left: (left: string) => `${left} left until insurance pays 100%` },
    of: (total: string) => `of ${total}`,
    note: "Preventive care, like annual physicals and vaccines, is covered before you meet your deductible.",
  },
  bill: {
    item: "Item",
    charge: "Charge",
    insurance: "Insurance",
    you: "You",
    total: "Total",
    claim: (claim: string, processed: string) => `Claim ${claim} · ${processed}`,
    download: "Download statement",
    /** Plain-text statement for "Download statement". */
    file: {
      title: (name: string) => `Linden Health statement · ${name}`,
      line: (label: string, charge: string, insurance: string, you: string) => `${label}: charge ${charge} · insurance ${insurance} · you ${you}`,
      total: (charge: string, insurance: string, you: string) => `Total: ${charge} · insurance ${insurance} · you ${you}`,
      month: (month: string, amount: string, date: string) => `Linden Health statement · ${month}\nAmount: ${amount}\n${date}`,
    },
    ask: { label: "Ask a billing question", href: "/portal/messages?c=billing-october" },
    paid: "Paid",
  },
  paySheet: {
    title: "Make a payment",
    amount: "Amount",
    full: (amount: string) => `Full balance ${amount}`,
    other: "Other amount",
    otherLabel: "Amount to pay",
    otherError: (max: string) => `Enter an amount between $1.00 and ${max}`,
    method: "Pay with",
    addMethod: "Add payment method",
    submit: (amount: string) => `Pay ${amount}`,
    success: (conf: string) => `Payment received. Confirmation ${conf}. A receipt was emailed to you.`,
    done: "Done",
  },
  statementCols: { month: "Month", amount: "Amount", status: "Status" },
  methods: {
    default: "Default",
    makeDefault: "Make default",
    remove: "Remove",
    expires: (date: string) => `Expires ${date}`,
    add: "Add card",
    addTitle: "Add a card",
    fields: {
      name: { label: "Name on card", placeholder: "Sarah Mitchell" },
      number: { label: "Card number", placeholder: "1234 5678 9012 3456" },
      expiry: { label: "Expiry", placeholder: "MM/YY" },
      zip: { label: "ZIP code", placeholder: "44107" },
    },
    errors: { number: "Enter a 16-digit card number", expiry: "Use MM/YY", zip: "Enter a 5-digit ZIP" },
    save: "Save card",
    cancel: "Cancel",
    added: (label: string) => `${label} added.`,
    exists: (label: string) => `${label} is already saved.`,
    brands: { "4": "Visa", "5": "Mastercard" } as Record<string, string>,
    genericBrand: "Card",
    label: (brand: string, last4: string) => `${brand} ending ${last4}`,
    autopay: "Turn on autopay",
    autopayHint: "Pay the full balance on the due date, from your default card.",
    autopayOn: (method: string, date: string) => `Autopay is on. ${method} will be charged on ${date}.`,
    demoNote: "Demo only. Don’t enter a real card.",
  },
  insurance: {
    member: "Member ID",
    group: "Group",
    holder: "Policy holder",
    covers: "Covers",
    copays: "Copays",
    phone: "Member services",
    front: "Front",
    back: "Back",
    update: "Update card",
    updated: "Card photos updated.",
    addSecondary: "Add secondary insurance",
    secondaryTitle: "Add secondary insurance",
    plan: "Insurance plan",
    planPlaceholder: `Search ${insurancePlans.length} plans…`,
    planEmpty: "No matching plans.",
    memberId: "Member ID",
    save: "Save insurance",
    secondary: "Secondary",
  },
}

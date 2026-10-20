// Fictional data for demo purposes only.
// Copy for the admin billing page: tabs, stat labels, empty states and refund reasons.

export const billingCopy = {
  tabs: [
    { id: "claims", label: "Claims" },
    { id: "payments", label: "Payments" },
    { id: "balances", label: "Balances" },
    { id: "refunds", label: "Refunds" },
  ],
  stats: {
    collected: { label: "Collected this month", hint: "Patient payments and insurance" },
    outstanding: { label: "Outstanding A/R", hint: "Open claims and patient balances" },
    denial: { label: "Denial rate", hint: "Of claims with a payer decision" },
    days: { label: "Avg days to pay", hint: "Visit to insurance payment" },
  },
  claims: {
    search: "Search claim #, patient, MRN or phone…",
    empty: { title: "No claims here yet", text: "Claims are created after each insured visit." },
    noResults: { title: "No claims match", text: "Try a wider date range or remove a filter." },
    amount: { label: "Amount", min: "Min billed", max: "Max billed", invalid: "Min must be less than max", apply: "Apply", clear: "Clear" },
    resubmit: "Resubmit",
    appeal: "Mark appealed",
    export: "Export CSV",
    clearFilters: "Clear filters",
    exported: (n: number) => `Exported ${n} claim${n === 1 ? "" : "s"}`,
  },
  claimSheet: {
    lines: "Line items",
    payer: "Payer response",
    timeline: "Timeline",
    notes: "Notes",
    notesEmpty: "No notes yet. Add context for the next person who picks this up.",
    notePlaceholder: "Add a note, e.g. called payer, reference #…",
    addNote: "Add note",
    resubmit: "Resubmit",
    appeal: "Appeal",
    writeOff: "Write off",
    writeOffTitle: "Write off the patient balance?",
    writeOffText: (amount: string, name: string) => `${amount} will be removed from ${name}’s balance. This can’t be undone from here.`,
    noPayer: "No response from the payer yet.",
  },
  payments: {
    search: "Search patient, MRN or reference…",
    record: "Record payment",
    pickTitle: "Record a payment",
    pickText: "Find the patient who is paying.",
    pickContinue: "Continue",
    empty: { title: "No payments match", text: "Try a wider date range or another method." },
  },
  balances: {
    search: "Search patient, MRN or phone…",
    chartTitle: "Aging",
    chartSubtitle: "Patient balances by days since the oldest unpaid visit",
    send: "Send statement",
    empty: { title: "No balances due", text: "Every patient is paid up." },
    noResults: { title: "No balances match", text: "Try another search or aging bucket." },
    statementSent: (name: string) => `Statement sent to ${name}`,
    statementsSent: (n: number) => `Statements sent to ${n} patients`,
    statementHint: "By email, with a link to pay online",
  },
  refunds: {
    title: "Refunds",
    subtitle: "Overpayments and duplicate charges returned to patients",
    issue: "Issue refund",
    empty: { title: "No refunds", text: "Refunds show up here when a patient overpays." },
    reasons: ["Copay charged twice", "Insurance paid more than expected", "Visit cancelled after payment", "Overpayment on balance", "Self-pay price adjusted"],
    issued: (amount: string, name: string) => `Refunded ${amount} to ${name}`,
    issuedHint: (method: string) => `Back to ${method} in 3–5 business days`,
  },
} as const

export const methodLabel: Record<string, string> = { card: "Card", hsa: "HSA card", cash: "Cash", check: "Check" }

/** "Card ·· 4242", "Cash". */
export const methodText = (p: { method: string; last4?: string }) => `${methodLabel[p.method] ?? p.method}${p.last4 && (p.method === "card" || p.method === "hsa") ? ` ·· ${p.last4}` : ""}`

/** Insurance plan categories (also the patient list's insurance facet, plus "Self-pay"). */
export const categoryLabel: Record<string, string> = {
  commercial: "Commercial",
  regional: "Regional",
  senior: "Senior",
  community: "Community",
  marketplace: "Marketplace",
  service: "Service members",
}

export const agingLabel: Record<string, string> = { "0-30": "0–30 days", "31-60": "31–60 days", "61-90": "61–90 days", "90+": "90+ days" }

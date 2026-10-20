// Demo payments made this session, so the balance, the sidebar's "$45 due" and the overview's
// billing panel all agree after you pay.

import { createSessionSet } from "@/lib/session-store"
import { amountDue, confirmations } from "@/lib/data/billing"

const store = createSessionSet("linden.payments")

/** Stored as "CONFIRMATION|amount". */
const parse = (entry: string) => Number(entry.split("|")[1] ?? 0)

export function usePayments() {
  const entries = store.useSet()
  const paid = [...entries].reduce((s, e) => s + parse(e), 0)
  const remaining = Math.max(0, Math.round((amountDue - paid) * 100) / 100)
  return { paid, remaining, count: entries.size }
}

/** Records a payment and returns its confirmation number. */
export function recordPayment(amount: number, count: number) {
  const conf = confirmations[count % confirmations.length]
  store.add(`${conf}|${amount}`)
  return conf
}

"use client"

import { cn } from "@/lib/utils"
import { chartCopy } from "@/lib/data/admin-patients"
import { methodText } from "@/lib/data/admin-billing"
import { fmtDate, fmtMoney } from "@/lib/admin/format"
import { getPlanSync } from "@/lib/admin/queries"
import type { Claim, Patient, Payment } from "@/lib/admin/types"
import { MoneyCell, panel, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { MiniTable, Muted, Section, td } from "@/components/admin/patient-detail/shared"

const c = chartCopy.billing

export function BillingTab({ patient, claims, payments, onPay }: { patient: Patient; claims: Claim[]; payments: Payment[]; onPay: () => void }) {
  const cl = [...claims].sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1))
  const pay = [...payments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const last = pay[0]

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(panel, "grid divide-neutral-100 sm:grid-cols-3 sm:divide-x max-sm:divide-y")}>
        <div className="flex items-end justify-between gap-3 p-5">
          <div>
            <p className="text-neutral-500 text-caption">{c.balance}</p>
            <p className="mt-1 text-neutral-950 tabular-nums text-title">{fmtMoney(patient.balance)}</p>
          </div>
          {patient.balance > 0 && (
            <Button size="sm" variant="outline" className="rounded-full px-3.5 text-caption" onClick={onPay}>
              {chartCopy.actions.pay}
            </Button>
          )}
        </div>
        <div className="p-5">
          <p className="text-neutral-500 text-caption">{c.lastPayment}</p>
          <p className="mt-1 text-neutral-950 tabular-nums text-title">{last ? fmtMoney(last.amount) : "—"}</p>
          {last && <p className="text-neutral-500 text-micro">{fmtDate(last.createdAt)} · {methodText(last)}</p>}
        </div>
        <div className="p-5">
          <p className="text-neutral-500 text-caption">{c.plan}</p>
          <p className="mt-1.5 text-neutral-950 text-body">{c.noPlan}</p>
        </div>
      </div>

      <Section title={c.claims} description={cl.length ? `${cl.length} total` : undefined} flush>
        {cl.length ? (
          <MiniTable label={c.claims} head={[{ label: "Claim #" }, { label: "Service date" }, { label: "Plan" }, { label: "Billed", align: "right" }, { label: "Paid", align: "right" }, { label: "Patient owes", align: "right" }, { label: "Status" }]}>
            {cl.map((x) => (
              <tr key={x.id}>
                <td className={`${td} whitespace-nowrap text-neutral-950 tabular-nums`}>{x.claimNumber}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{fmtDate(x.serviceDate)}</td>
                <td className={`${td} whitespace-nowrap`}>{getPlanSync(x.planId)?.name ?? "Self-pay"}</td>
                <td className={td}>
                  <MoneyCell value={x.amountBilled} muted />
                </td>
                <td className={td}>
                  <MoneyCell value={x.amountPaid} />
                </td>
                <td className={td}>
                  <MoneyCell value={x.patientResponsibility} muted={x.patientResponsibility === 0} />
                </td>
                <td className={td}>
                  <span className="flex flex-col items-start gap-0.5">
                    <StatusBadge kind="claim" status={x.status} />
                    {x.denialReason && <span className="text-red-700 text-micro">{x.denialReason}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </MiniTable>
        ) : (
          <Muted className="px-5 pb-5">{c.noClaims}</Muted>
        )}
      </Section>

      <Section title={c.payments} description={pay.length ? `${pay.length} total` : undefined} flush>
        {pay.length ? (
          <MiniTable label={c.payments} head={[{ label: "Date" }, { label: "Amount", align: "right" }, { label: "Method" }, { label: "Reference" }]}>
            {pay.map((x) => (
              <tr key={x.id}>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{fmtDate(x.createdAt)}</td>
                <td className={td}>
                  <MoneyCell value={x.amount} />
                </td>
                <td className={`${td} whitespace-nowrap`}>{methodText(x)}</td>
                <td className={`${td} whitespace-nowrap text-neutral-500 tabular-nums`}>{x.reference}</td>
              </tr>
            ))}
          </MiniTable>
        ) : (
          <Muted className="px-5 pb-5">{c.noPayments}</Muted>
        )}
      </Section>
    </div>
  )
}

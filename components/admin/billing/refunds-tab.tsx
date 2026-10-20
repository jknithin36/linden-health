"use client"

import { ReverseWithdrawal01Icon } from "@hugeicons/core-free-icons"

import { billingCopy, methodText } from "@/lib/data/admin-billing"
import { fmtDate, fmtMoney } from "@/lib/admin/format"
import { listRefunds } from "@/lib/admin/queries"
import { issueRefund } from "@/lib/admin/actions"
import type { Refund } from "@/lib/admin/types"
import { useQuery } from "@/components/admin/hooks"
import { EmptyState, ErrorState, MoneyCell, notify, panel, PatientCell, StatusBadge, TableSkeleton } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"

export function RefundsTab() {
  const t = billingCopy.refunds
  const { data: rows, error, retry } = useQuery(() => listRefunds(), [])

  const issue = (r: Refund) => {
    const { title, description } = issueRefund(r)
    notify.success(title, description)
  }

  const action = (r: Refund) =>
    r.status !== "issued" ? (
      <Button size="sm" variant={r.status === "approved" ? "default" : "outline"} className="h-8 rounded-full px-3 text-caption" onClick={() => issue(r)}>
        {t.issue}
      </Button>
    ) : null

  return (
    <section aria-labelledby="refunds-h" className={panel}>
      <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-4 py-4 md:px-5">
        <h2 id="refunds-h" className="text-neutral-950 text-body">
          {t.title}
        </h2>
        <p className="text-neutral-500 text-caption">{t.subtitle}</p>
      </div>
      {error ? (
        <ErrorState onRetry={retry} />
      ) : !rows ? (
        <TableSkeleton rows={6} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState icon={ReverseWithdrawal01Icon} title={t.empty.title} text={t.empty.text} />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-neutral-100 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-4 py-3.5">
                <span className="flex items-start justify-between gap-3">
                  <PatientCell patient={r.payment.patientId} />
                  <span className="text-neutral-950 tabular-nums text-caption">{fmtMoney(r.amount)}</span>
                </span>
                <span className="text-neutral-700 text-caption">{r.reason}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-neutral-500 tabular-nums text-micro">
                  <StatusBadge kind="refund" status={r.status} />
                  <span>{fmtDate(r.requestedAt)}</span>
                  <span>{r.payment.reference}</span>
                  <span className="ml-auto">{action(r)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="relative overflow-x-auto max-md:hidden">
            <table className="w-full text-caption">
              <thead className="text-neutral-500 text-micro">
                <tr className="border-b border-neutral-100">
                  <th scope="col" className="px-4 py-3 text-left font-regular">Requested</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Patient</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Reason</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Original payment</th>
                  <th scope="col" className="px-4 py-3 text-right font-regular">Refund</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-regular">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">{fmtDate(r.requestedAt)}</td>
                    <td className="min-w-56 px-4 py-3">
                      <PatientCell patient={r.payment.patientId} />
                    </td>
                    <td className="px-4 py-3">{r.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block tabular-nums">
                        {fmtMoney(r.payment.amount)} · {methodText(r.payment)}
                      </span>
                      <span className="block text-neutral-500 tabular-nums text-micro">{r.payment.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <MoneyCell value={r.amount} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="refund" status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">{action(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

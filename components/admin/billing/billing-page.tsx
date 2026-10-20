"use client"

import dynamic from "next/dynamic"

import { adminCopy } from "@/lib/data/admin"
import { billingCopy } from "@/lib/data/admin-billing"
import { fmtMoneyRound, fmtPercent } from "@/lib/admin/format"
import { billingStats } from "@/lib/admin/queries"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { CardSkeleton, ChartSkeleton, PageHeader, StatCard } from "@/components/admin/ui"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClaimsTab } from "@/components/admin/billing/claims-tab"
import { PaymentsTab } from "@/components/admin/billing/payments-tab"
import { RefundsTab } from "@/components/admin/billing/refunds-tab"

// The aging chart pulls in Recharts; load it only when the Balances tab opens.
const BalancesTab = dynamic(() => import("@/components/admin/billing/balances-tab").then((m) => m.BalancesTab), { loading: () => <ChartSkeleton /> })

type TabId = (typeof billingCopy.tabs)[number]["id"]

/** Every list param any billing tab uses; cleared when switching tabs so filters don't leak across. */
const tabParams = ["q", "status", "planId", "category", "from", "to", "min", "max", "method", "bucket", "sort", "page", "open"]

function BillingStats() {
  const { data } = useQuery(async () => billingStats(), [])
  const s = billingCopy.stats
  if (!data)
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label={s.collected.label} value={fmtMoneyRound(data.collected)} hint={s.collected.hint} />
      <StatCard label={s.outstanding.label} value={fmtMoneyRound(data.outstanding)} hint={s.outstanding.hint} />
      <StatCard label={s.denial.label} value={fmtPercent(data.denialRate, 1)} hint={s.denial.hint} tone={data.denialRate > 0.1 ? "amber" : undefined} />
      <StatCard label={s.days.label} value={`${data.daysToPay.toFixed(1)} days`} hint={s.days.hint} />
    </div>
  )
}

export function BillingPage() {
  const url = useUrlState()
  const raw = url.get("tab", "claims")
  const tab: TabId = billingCopy.tabs.some((t) => t.id === raw) ? (raw as TabId) : "claims"
  const c = adminCopy.pages.billing

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={c.title} description={c.description} />
      <BillingStats />
      <Tabs value={tab} onValueChange={(v) => url.set({ ...Object.fromEntries(tabParams.map((k) => [k, null])), tab: v === "claims" ? null : String(v) })}>
        <TabsList className="relative h-10 w-full justify-start overflow-x-auto bg-neutral-100 sm:w-fit sm:max-w-full">
          {billingCopy.tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 rounded-full px-4 text-caption">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tab === "claims" && <ClaimsTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "balances" && <BalancesTab />}
      {tab === "refunds" && <RefundsTab />}
    </div>
  )
}

"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, MoneyBag02Icon } from "@hugeicons/core-free-icons"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { agingLabel as bucketLabel, billingCopy } from "@/lib/data/admin-billing"
import { fmtDate, fmtMoney, fmtMoneyRound } from "@/lib/admin/format"
import { agingBuckets, clinics, getPatientSync, listBalances, type AgingSummary, type BalanceRow } from "@/lib/admin/queries"
import { sendStatements } from "@/lib/admin/actions"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, FacetFilter, FilterChips, Pagination, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { ChartCard, chartAxis, chartGrid, ChartSkeleton, ClinicBadge, EmptyState, MoneyCell, notify, PatientCell } from "@/components/admin/ui"
import { RecordPaymentDialog } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const bucketOptions = agingBuckets.map((b) => ({ value: b, label: bucketLabel[b] }))
const clinicColor: Record<string, string> = { cleveland: "var(--color-sky-500)", lakewood: "var(--color-emerald-500)", beachwood: "var(--color-violet-500)" }
const chartConfig: ChartConfig = Object.fromEntries(clinics.map((c) => [c.id, { label: c.short, color: clinicColor[c.id] }]))

function send(patientIds: string[]) {
  const msg = sendStatements(patientIds)
  if (msg) notify.success(msg, billingCopy.balances.statementHint)
}

function AgingChart({ aging }: { aging: AgingSummary }) {
  const t = billingCopy.balances
  const data = aging.map((a) => ({ bucket: bucketLabel[a.bucket], ...a.byClinic }))
  const totals = aging.map((a) => ({ b: a.bucket, total: a.total, count: a.count }))
  return (
    <ChartCard title={t.chartTitle} subtitle={t.chartSubtitle}>
      <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {totals.map((x) => (
          <div key={x.b} className="rounded-xl border border-neutral-100 px-3 py-2.5">
            <dt className="text-neutral-500 text-micro">{bucketLabel[x.b]}</dt>
            <dd className="mt-0.5 text-neutral-950 tabular-nums text-body">{fmtMoneyRound(x.total)}</dd>
            <dd className="text-neutral-400 tabular-nums text-micro">{x.count} {x.count === 1 ? "patient" : "patients"}</dd>
          </div>
        ))}
      </dl>
      <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="bucket" {...chartAxis} />
          <YAxis {...chartAxis} width={56} tickFormatter={(v: number) => fmtMoneyRound(v)} />
          <ChartTooltip cursor={{ fill: "var(--color-neutral-50)" }} content={<ChartTooltipContent className="rounded-xl" formatter={(v, name) => <TooltipRow label={String(chartConfig[String(name)]?.label ?? name)} value={fmtMoney(Number(v))} color={clinicColor[String(name)]} />} />} />
          <ChartLegend content={<ChartLegendContent />} />
          {clinics.map((c, i) => (
            <Bar key={c.id} dataKey={c.id} stackId="a" fill={`var(--color-${c.id})`} radius={i === clinics.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} isAnimationActive={false} maxBarSize={72} />
          ))}
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

function TooltipRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className="flex w-full items-center gap-2">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />
      <span className="flex-1 text-neutral-500">{label}</span>
      <span className="text-neutral-950 tabular-nums">{value}</span>
    </span>
  )
}

export function BalancesTab() {
  const url = useUrlState()
  const t = billingCopy.balances
  const [payFor, setPayFor] = React.useState<BalanceRow | null>(null)
  const q = url.get("q")
  const filters = { bucket: url.getList("bucket") }
  const key = JSON.stringify({ q, filters, sort: url.sort, page: url.page, size: url.pageSize })
  const { data, loading, initial, error, retry } = useQuery(() => listBalances({ q, filters, sort: url.sort, page: url.page, pageSize: url.pageSize }), [key])

  const columns = React.useMemo<Col<BalanceRow>[]>(
    () => [
      { id: "patient", header: "Patient", meta: { label: "Patient", className: "min-w-56" }, enableHiding: false, cell: ({ row }) => <PatientCell patient={row.original.patient} /> },
      { id: "clinic", header: "Clinic", enableSorting: false, meta: { label: "Clinic" }, cell: ({ row }) => <ClinicBadge id={row.original.patient.preferredClinicId} /> },
      { id: "phone", header: "Phone", enableSorting: false, meta: { label: "Phone" }, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{row.original.patient.phone}</span> },
      { id: "oldest", header: "Oldest visit", meta: { label: "Oldest visit" }, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(row.original.oldest)}</span> },
      {
        id: "bucket",
        header: "Aging",
        enableSorting: false,
        meta: { label: "Aging" },
        cell: ({ row }) => {
          const b = row.original.bucket
          return <span className={b === "90+" ? "whitespace-nowrap text-red-700" : b === "61-90" ? "whitespace-nowrap text-amber-800" : "whitespace-nowrap"}>{bucketLabel[b]}</span>
        },
      },
      { id: "balance", header: "Balance", meta: { label: "Balance", align: "right" }, enableHiding: false, cell: ({ row }) => <MoneyCell value={row.original.balance} /> },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-64 text-right" },
        cell: ({ row }) => (
          <span className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-caption"
              onClick={(e) => {
                e.stopPropagation()
                send([row.original.patient.id])
              }}
            >
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {t.send}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full px-3 text-caption"
              onClick={(e) => {
                e.stopPropagation()
                setPayFor(row.original)
              }}
            >
              {billingCopy.payments.record}
            </Button>
          </span>
        ),
      },
    ],
    [t.send],
  )

  const chips = url.getList("bucket").map((v) => ({ key: `b-${v}`, label: `Aging: ${bucketLabel[v] ?? v}`, onRemove: () => url.set({ bucket: url.getList("bucket").filter((x) => x !== v) }) }))
  const filtered = chips.length > 0 || !!q

  return (
    <div className="flex flex-col gap-6">
      {data ? <AgingChart aging={data.aging} /> : <ChartSkeleton />}
      <DataTable
        id="balances"
        label="Patient balances"
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(r) => r.patient.id}
        loading={initial}
        refreshing={loading && !initial}
        error={error}
        onRetry={retry}
        sort={url.sort ?? { id: "balance", desc: true }}
        onSortChange={url.setSort}
        selectable
        defaultHidden={["phone"]}
        rowLabel={(r) => `${r.patient.name}, ${fmtMoney(r.balance)}`}
        mobileCard={(r) => (
          <span className="flex flex-col gap-2">
            <span className="flex items-start justify-between gap-3">
              <PatientCell patient={r.patient} link={false} />
              <span className="text-neutral-950 tabular-nums text-caption">{fmtMoney(r.balance)}</span>
            </span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-neutral-500 tabular-nums text-micro">
              <span>{bucketLabel[r.bucket]}</span>
              <span>Since {fmtDate(r.oldest)}</span>
              <Button size="sm" variant="outline" className="ml-auto h-8 rounded-full px-3 text-caption" onClick={() => send([r.patient.id])}>
                {t.send}
              </Button>
            </span>
          </span>
        )}
        bulkActions={(ids, clear) => (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full bg-white px-3 text-caption"
            onClick={() => {
              send(ids)
              clear()
            }}
          >
            <HugeiconsIcon icon={Mail01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {t.send}
          </Button>
        )}
        toolbar={
          <>
            <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={t.search} />
            <FacetFilter title="Aging" options={bucketOptions} selected={url.getList("bucket")} onChange={(v) => url.set({ bucket: v })} counts={data?.facets.bucket} />
            <ResetButton show={filtered} onClick={() => url.set({ q: null, bucket: null, sort: null })} />
            <FilterChips chips={chips} />
          </>
        }
        empty={<EmptyState icon={MoneyBag02Icon} title={filtered ? t.noResults.title : t.empty.title} text={filtered ? t.noResults.text : t.empty.text} />}
        footer={data && data.total > 0 ? <Pagination page={data.page} pageCount={data.pageCount} pageSize={data.pageSize} total={data.total} onPage={(p) => url.set({ page: p }, { keepPage: true })} onPageSize={(n) => url.set({ size: n })} /> : null}
      />
      {payFor && <RecordPaymentDialog patientId={payFor.patient.id} open onOpenChange={(o) => !o && setPayFor(null)} suggested={getPatientSync(payFor.patient.id)?.balance} />}
    </div>
  )
}

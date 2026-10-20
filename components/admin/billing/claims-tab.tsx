"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Coins01Icon, Download01Icon, Invoice01Icon, Legal01Icon, Refresh01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { billingCopy, categoryLabel } from "@/lib/data/admin-billing"
import { fmtDate, fmtDateNumeric, fmtMoney, fmtMoneyRound, relative } from "@/lib/admin/format"
import { allPlans, getClaimSync, getPatientSync, getPlanSync, listClaims, type ClaimFilters } from "@/lib/admin/queries"
import { updateClaims } from "@/lib/admin/actions"
import type { Claim } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, DateRangeFilter, FacetFilter, FilterChips, filterTrigger, MoreFilters, Pagination, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { EmptyState, MoneyCell, notify, PatientCell, StatusBadge, statusLabel } from "@/components/admin/ui"
import { downloadCsv } from "@/components/admin/csv"
import { inputCls } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ClaimSheet } from "@/components/admin/billing/claim-sheet"

const statuses = ["draft", "submitted", "pending", "paid", "denied", "appealed"]
const categories = Object.keys(categoryLabel)
const facetKeys = ["status", "planId", "category"] as const
type FacetKey = (typeof facetKeys)[number]

const facetMeta: Record<FacetKey, { title: string; options: () => { value: string; label: string }[] }> = {
  status: { title: "Status", options: () => statuses.map((s) => ({ value: s, label: statusLabel("claim", s) })) },
  planId: { title: "Plan", options: () => allPlans().map((p) => ({ value: p.id, label: p.name })) },
  category: { title: "Category", options: () => categories.map((c) => ({ value: c, label: categoryLabel[c] })) },
}

const moneyText = (n: string) => fmtMoneyRound(Number(n))

/** Billed-amount range in a popover: two inputs, validated, applied together. */
function AmountFilter({ min, max, onChange }: { min: string; max: string; onChange: (min: string, max: string) => void }) {
  const t = billingCopy.claims.amount
  const [open, setOpen] = React.useState(false)
  const [lo, setLo] = React.useState(min)
  const [hi, setHi] = React.useState(max)
  const invalid = lo !== "" && hi !== "" && Number(lo) > Number(hi)
  const active = !!(min || max)
  const label = min && max ? `${moneyText(min)} – ${moneyText(max)}` : min ? `≥ ${moneyText(min)}` : max ? `≤ ${moneyText(max)}` : t.label
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setLo(min)
          setHi(max)
        }
      }}
    >
      <PopoverTrigger className={cn(filterTrigger(active), active && "text-neutral-950")}>
        <HugeiconsIcon icon={Coins01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-neutral-400" />
        <span className="tabular-nums">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-3 rounded-2xl p-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (invalid) return
            onChange(lo, hi)
            setOpen(false)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-neutral-500 text-micro">
              {t.min}
              <Input inputMode="decimal" value={lo} onChange={(e) => setLo(e.target.value.replace(/[^\d.]/g, ""))} placeholder="$0" aria-invalid={invalid || undefined} className={cn(inputCls, "h-9 tabular-nums")} />
            </label>
            <label className="flex flex-col gap-1 text-neutral-500 text-micro">
              {t.max}
              <Input inputMode="decimal" value={hi} onChange={(e) => setHi(e.target.value.replace(/[^\d.]/g, ""))} placeholder="Any" aria-invalid={invalid || undefined} className={cn(inputCls, "h-9 tabular-nums")} />
            </label>
          </div>
          {invalid && (
            <p role="alert" className="text-red-700 text-micro">
              {t.invalid}
            </p>
          )}
          <div className="flex justify-between gap-2 border-t border-neutral-100 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-caption"
              onClick={() => {
                onChange("", "")
                setOpen(false)
              }}
            >
              {t.clear}
            </Button>
            <Button type="submit" size="sm" className="rounded-full px-4 text-caption" disabled={invalid}>
              {t.apply}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function claimCsvRow(c: Claim) {
  const p = getPatientSync(c.patientId)
  return {
    "Claim #": c.claimNumber,
    Patient: p?.name,
    MRN: p?.mrn,
    "Date of service": fmtDateNumeric(c.serviceDate),
    Plan: getPlanSync(c.planId)?.name,
    Billed: c.amountBilled.toFixed(2),
    Paid: c.amountPaid.toFixed(2),
    "Patient owes": c.patientResponsibility.toFixed(2),
    Status: statusLabel("claim", c.status),
    "Denial reason": c.denialReason ?? "",
    Updated: c.updatedAt.replace("T", " "),
  }
}

export function ClaimsTab() {
  const url = useUrlState()
  const t = billingCopy.claims
  const open = url.get("open") || null
  const setOpen = (id: string | null) => url.set({ open: id }, { keepPage: true })

  const q = url.get("q")
  const filters: Partial<ClaimFilters> = { from: url.get("from"), to: url.get("to"), min: url.get("min"), max: url.get("max") }
  for (const k of facetKeys) filters[k] = url.getList(k)
  const key = JSON.stringify({ q, filters, sort: url.sort, page: url.page, size: url.pageSize })
  const { data, loading, initial, error, retry } = useQuery(() => listClaims({ q, filters, sort: url.sort, page: url.page, pageSize: url.pageSize }), [key])

  const columns = React.useMemo<Col<Claim>[]>(
    () => [
      { id: "claim", header: "Claim #", meta: { label: "Claim #" }, enableHiding: false, cell: ({ row }) => <span className="whitespace-nowrap text-neutral-950 tabular-nums">{row.original.claimNumber}</span> },
      { id: "patient", header: "Patient", meta: { label: "Patient", className: "min-w-56" }, enableHiding: false, cell: ({ row }) => <PatientCell patient={row.original.patientId} /> },
      { id: "service", header: "Date of service", meta: { label: "Date of service" }, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{fmtDate(row.original.serviceDate)}</span> },
      { id: "plan", header: "Plan", meta: { label: "Plan", className: "min-w-40" }, cell: ({ row }) => <span className="block max-w-48 truncate">{getPlanSync(row.original.planId)?.name}</span> },
      { id: "billed", header: "Billed", meta: { label: "Billed", align: "right" }, cell: ({ row }) => <MoneyCell value={row.original.amountBilled} /> },
      { id: "paid", header: "Paid", meta: { label: "Paid", align: "right" }, cell: ({ row }) => <MoneyCell value={row.original.amountPaid} muted={row.original.amountPaid === 0} /> },
      { id: "owes", header: "Patient owes", meta: { label: "Patient owes", align: "right" }, cell: ({ row }) => <MoneyCell value={row.original.patientResponsibility} muted={row.original.patientResponsibility === 0} /> },
      { id: "status", header: "Status", meta: { label: "Status" }, cell: ({ row }) => <StatusBadge kind="claim" status={row.original.status} /> },
      { id: "denial", header: "Denial reason", enableSorting: false, meta: { label: "Denial reason", className: "min-w-44" }, cell: ({ row }) => (row.original.denialReason ? <span className="text-red-700">{row.original.denialReason}</span> : <span className="text-neutral-300">—</span>) },
      {
        id: "updated",
        header: "Updated",
        meta: { label: "Updated" },
        cell: ({ row }) => (
          <span className="block whitespace-nowrap">
            <span className="block tabular-nums">{fmtDate(row.original.updatedAt)}</span>
            <span className="block text-neutral-400 text-micro">{relative(row.original.updatedAt)}</span>
          </span>
        ),
      },
    ],
    [],
  )

  const amountChip =
    url.get("min") || url.get("max")
      ? [{ key: "amount", label: `Billed: ${url.get("min") ? moneyText(url.get("min")) : "$0"} – ${url.get("max") ? moneyText(url.get("max")) : "any"}`, onRemove: () => url.set({ min: null, max: null }) }]
      : []
  const chips = [
    ...facetKeys.flatMap((k) =>
      url.getList(k).map((v) => ({
        key: `${k}-${v}`,
        label: `${facetMeta[k].title}: ${facetMeta[k].options().find((o) => o.value === v)?.label ?? v}`,
        onRemove: () => url.set({ [k]: url.getList(k).filter((x) => x !== v) }),
      })),
    ),
    ...(url.get("from") ? [{ key: "dates", label: `Service: ${fmtDate(url.get("from"))}${url.get("to") ? ` – ${fmtDate(url.get("to"))}` : ""}`, onRemove: () => url.set({ from: null, to: null }) }] : []),
    ...amountChip,
  ]
  const filtered = chips.length > 0 || !!q
  const clearAll = () => url.set(Object.fromEntries([...facetKeys, "q", "from", "to", "min", "max"].map((k) => [k, null])))

  const exportRows = (ids: string[]) => {
    const list = ids.map(getClaimSync).filter((c) => c !== undefined)
    downloadCsv("claims.csv", list.map(claimCsvRow))
    notify.success(t.exported(list.length))
  }

  return (
    <>
      <DataTable
        id="claims"
        label="Claims"
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(c) => c.id}
        loading={initial}
        refreshing={loading && !initial}
        error={error}
        onRetry={retry}
        sort={url.sort ?? { id: "updated", desc: true }}
        onSortChange={url.setSort}
        selectable
        defaultHidden={["paid"]}
        onRowClick={(c) => setOpen(c.id)}
        rowLabel={(c) => `Claim ${c.claimNumber}, ${getPatientSync(c.patientId)?.name}`}
        mobileCard={(c) => (
          <span className="flex flex-col gap-2">
            <span className="flex items-start justify-between gap-3">
              <PatientCell patient={c.patientId} link={false} />
              <StatusBadge kind="claim" status={c.status} />
            </span>
            <span className="flex flex-wrap gap-x-3 text-neutral-500 tabular-nums text-micro">
              <span className="text-neutral-950">{c.claimNumber}</span>
              <span>{fmtDate(c.serviceDate)}</span>
              <span>Billed {fmtMoney(c.amountBilled)}</span>
              {c.patientResponsibility > 0 && <span>Owes {fmtMoney(c.patientResponsibility)}</span>}
            </span>
            {c.denialReason && <span className="text-red-700 text-micro">{c.denialReason}</span>}
          </span>
        )}
        bulkActions={(ids, clear) => (
          <>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => (notify.success(updateClaims(ids, "submitted")), clear())}>
              <HugeiconsIcon icon={Refresh01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {t.resubmit}
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => (notify.success(updateClaims(ids, "appealed")), clear())}>
              <HugeiconsIcon icon={Legal01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {t.appeal}
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => exportRows(ids)}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {t.export}
            </Button>
          </>
        )}
        toolbar={
          <>
            <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={t.search} />
            <DateRangeFilter from={url.get("from")} to={url.get("to")} onChange={(from, to) => url.set({ from, to })} label="Service date" />
            {(["status", "planId"] as const).map((k) => (
              <FacetFilter key={k} title={facetMeta[k].title} options={facetMeta[k].options()} selected={url.getList(k)} onChange={(v) => url.set({ [k]: v })} counts={data?.facets[k]} />
            ))}
            <AmountFilter key={`${url.get("min")}-${url.get("max")}`} min={url.get("min")} max={url.get("max")} onChange={(min, max) => url.set({ min, max })} />
            <MoreFilters groups={[{ key: "category", title: facetMeta.category.title, options: facetMeta.category.options(), selected: url.getList("category"), onChange: (v: string[]) => url.set({ category: v }), counts: data?.facets.category }]} />
            <ResetButton show={filtered} onClick={() => url.set(Object.fromEntries([...facetKeys, "q", "from", "to", "min", "max", "sort"].map((k) => [k, null])))} />
            <FilterChips chips={chips} />
          </>
        }
        empty={
          <EmptyState
            icon={Invoice01Icon}
            title={filtered ? t.noResults.title : t.empty.title}
            text={filtered ? t.noResults.text : t.empty.text}
            action={
              filtered ? (
                <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={clearAll}>
                  {t.clearFilters}
                </Button>
              ) : undefined
            }
          />
        }
        footer={data && data.total > 0 ? <Pagination page={data.page} pageCount={data.pageCount} pageSize={data.pageSize} total={data.total} onPage={(p) => url.set({ page: p }, { keepPage: true })} onPageSize={(n) => url.set({ size: n })} /> : null}
      />
      <ClaimSheet id={open} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  )
}

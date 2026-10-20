"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon, MoneyReceive01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { billingCopy, methodLabel, methodText } from "@/lib/data/admin-billing"
import { fmtDate, fmtDateNumeric, fmtMoney, fmtTime, TODAY } from "@/lib/admin/format"
import { allPayments, getAppointmentSync, getPatientSync, listPayments } from "@/lib/admin/queries"
import type { Payment } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, DateRangeFilter, FacetFilter, FilterChips, Pagination, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { EmptyState, MoneyCell, notify, PatientCell } from "@/components/admin/ui"
import { FormActions, FormDialog, FormRow, PatientPicker, RecordPaymentDialog, visitTypeLabel } from "@/components/admin/forms"
import { downloadCsv } from "@/components/admin/csv"
import { Button } from "@/components/ui/button"

const methods = ["card", "hsa", "cash", "check"]
const methodOptions = methods.map((m) => ({ value: m, label: methodLabel[m] }))

function AppointmentText({ id }: { id?: string }) {
  if (!id) return <span className="text-neutral-300">—</span>
  const a = getAppointmentSync(id)
  if (!a) return <span className="text-neutral-300">—</span>
  return (
    <span className="block whitespace-nowrap">
      <span className="block tabular-nums">{fmtDate(a.start)}</span>
      <span className="block text-neutral-500 text-micro">{visitTypeLabel(a.visitType)}</span>
    </span>
  )
}

/** Step one of recording a payment: choose the patient, then hand over to RecordPaymentDialog. */
function PickPatientDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (id: string) => void }) {
  const t = billingCopy.payments
  const [id, setId] = React.useState("")
  const [error, setError] = React.useState("")
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setId("")
          setError("")
        }
      }}
      title={t.pickTitle}
      description={t.pickText}
      onSubmit={(e) => {
        e.preventDefault()
        if (!id) return setError("Choose a patient")
        onPick(id)
        setId("")
      }}
      footer={<FormActions onCancel={() => onOpenChange(false)} submit={t.pickContinue} />}
    >
      <FormRow label="Patient" htmlFor="pay-patient" error={error}>
        <PatientPicker
          id="pay-patient"
          value={id}
          invalid={!!error}
          onChange={(v) => {
            setId(v)
            setError("")
          }}
        />
      </FormRow>
    </FormDialog>
  )
}

export function PaymentsTab() {
  const url = useUrlState()
  const t = billingCopy.payments
  const [picking, setPicking] = React.useState(false)
  const [payFor, setPayFor] = React.useState<string | null>(null)

  const q = url.get("q")
  // The generated data has a few statement payments dated after "now"; never show the future.
  const to = url.get("to") && url.get("to") < TODAY ? url.get("to") : TODAY
  const filters = { method: url.getList("method"), from: url.get("from"), to }
  const key = JSON.stringify({ q, filters, sort: url.sort, page: url.page, size: url.pageSize })
  const { data, loading, initial, error, retry } = useQuery(() => listPayments({ q, filters, sort: url.sort, page: url.page, pageSize: url.pageSize }), [key])

  const columns = React.useMemo<Col<Payment>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        meta: { label: "Date" },
        enableHiding: false,
        cell: ({ row }) => (
          <span className="block whitespace-nowrap tabular-nums">
            <span className="block text-neutral-950">{fmtDate(row.original.createdAt)}</span>
            <span className="block text-neutral-500 text-micro">{fmtTime(row.original.createdAt)}</span>
          </span>
        ),
      },
      { id: "patient", header: "Patient", meta: { label: "Patient", className: "min-w-56" }, enableHiding: false, cell: ({ row }) => <PatientCell patient={row.original.patientId} /> },
      { id: "amount", header: "Amount", meta: { label: "Amount", align: "right" }, cell: ({ row }) => <MoneyCell value={row.original.amount} /> },
      { id: "method", header: "Method", meta: { label: "Method" }, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{methodText(row.original)}</span> },
      { id: "reference", header: "Reference", enableSorting: false, meta: { label: "Reference" }, cell: ({ row }) => <span className="whitespace-nowrap text-neutral-500 tabular-nums">{row.original.reference}</span> },
      { id: "appointment", header: "Appointment", enableSorting: false, meta: { label: "Appointment" }, cell: ({ row }) => <AppointmentText id={row.original.appointmentId} /> },
    ],
    [],
  )

  const chips = [
    ...url.getList("method").map((v) => ({ key: `m-${v}`, label: `Method: ${methodLabel[v] ?? v}`, onRemove: () => url.set({ method: url.getList("method").filter((x) => x !== v) }) })),
    ...(url.get("from") ? [{ key: "dates", label: `Dates: ${fmtDate(url.get("from"))}${url.get("to") ? ` – ${fmtDate(url.get("to"))}` : ""}`, onRemove: () => url.set({ from: null, to: null }) }] : []),
  ]
  const filtered = chips.length > 0 || !!q
  const clearAll = () => url.set({ q: null, method: null, from: null, to: null })

  const exportRows = (ids?: string[]) => {
    const set = ids ? new Set(ids) : null
    const list = set ? allPayments().filter((p) => set.has(p.id)) : (data?.rows ?? [])
    downloadCsv(
      "payments.csv",
      list.map((p) => ({ Date: fmtDateNumeric(p.createdAt), Time: fmtTime(p.createdAt), Patient: getPatientSync(p.patientId)?.name, MRN: getPatientSync(p.patientId)?.mrn, Amount: p.amount.toFixed(2), Method: methodText(p), Reference: p.reference })),
    )
    notify.success(`Exported ${list.length} payment${list.length === 1 ? "" : "s"}`)
  }

  return (
    <>
      <DataTable
        id="payments"
        label="Payments"
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(p) => p.id}
        loading={initial}
        refreshing={loading && !initial}
        error={error}
        onRetry={retry}
        sort={url.sort ?? { id: "date", desc: true }}
        onSortChange={url.setSort}
        selectable
        rowLabel={(p) => `${fmtMoney(p.amount)} from ${getPatientSync(p.patientId)?.name}`}
        mobileCard={(p) => (
          <span className="flex flex-col gap-2">
            <span className="flex items-start justify-between gap-3">
              <PatientCell patient={p.patientId} link={false} />
              <span className="text-neutral-950 tabular-nums text-caption">{fmtMoney(p.amount)}</span>
            </span>
            <span className="flex flex-wrap gap-x-3 text-neutral-500 tabular-nums text-micro">
              <span className="text-neutral-950">{fmtDate(p.createdAt)} · {fmtTime(p.createdAt)}</span>
              <span>{methodText(p)}</span>
              <span>{p.reference}</span>
            </span>
          </span>
        )}
        bulkActions={(ids) => (
          <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => exportRows(ids)}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {billingCopy.claims.export}
          </Button>
        )}
        toolbar={
          <>
            <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={t.search} />
            <DateRangeFilter from={url.get("from")} to={url.get("to")} onChange={(from, to) => url.set({ from, to })} />
            <FacetFilter title="Method" options={methodOptions} selected={url.getList("method")} onChange={(v) => url.set({ method: v })} counts={data?.facets.method} />
            <ResetButton show={filtered} onClick={() => url.set({ q: null, method: null, from: null, to: null, sort: null })} />
            <div className="ml-auto">
              <Button className="h-9 rounded-full px-4 text-caption" onClick={() => setPicking(true)}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                {t.record}
              </Button>
            </div>
            <FilterChips chips={chips} />
          </>
        }
        empty={
          <EmptyState
            icon={MoneyReceive01Icon}
            title={t.empty.title}
            text={t.empty.text}
            action={
              filtered ? (
                <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={clearAll}>
                  {billingCopy.claims.clearFilters}
                </Button>
              ) : undefined
            }
          />
        }
        footer={data && data.total > 0 ? <Pagination page={data.page} pageCount={data.pageCount} pageSize={data.pageSize} total={data.total} onPage={(p) => url.set({ page: p }, { keepPage: true })} onPageSize={(n) => url.set({ size: n })} /> : null}
      />
      <PickPatientDialog
        open={picking}
        onOpenChange={setPicking}
        onPick={(id) => {
          setPicking(false)
          setPayFor(id)
        }}
      />
      {payFor && <RecordPaymentDialog patientId={payFor} open onOpenChange={(o) => !o && setPayFor(null)} suggested={getPatientSync(payFor)?.balance || undefined} />}
    </>
  )
}

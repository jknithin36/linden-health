"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon, MailSend01Icon, PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { adminCopy } from "@/lib/data/admin"
import { patientsCopy as copy } from "@/lib/data/admin-patients"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import { fmtDate, fmtDateNumeric, fmtTime } from "@/lib/admin/format"
import { ageGroups, allDoctors, clinics, getDoctorSync, getPatientSync, getPlanSync, listPatients, type PatientFilters } from "@/lib/admin/queries"
import { myDoctorId } from "@/lib/admin/doctor"
import { useSession } from "@/lib/session-client"
import { useAdminState } from "@/lib/admin/store"
import type { Patient } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, FacetFilter, FilterChips, MoreFilters, Pagination, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { EmptyState, MoneyCell, notify, PageHeader, PatientCell, StatusBadge, statusLabel } from "@/components/admin/ui"
import { NewPatientDialog } from "@/components/admin/forms"
import { downloadCsv } from "@/components/admin/csv"
import { Button } from "@/components/ui/button"
import { focusRing } from "@/lib/styles"

const facetKeys = ["primaryDoctorId", "insuranceCategory", "ageGroup", "flags", "clinic", "balance", "newThisMonth"] as const
type FacetKey = (typeof facetKeys)[number]
const primary: FacetKey[] = ["primaryDoctorId", "insuranceCategory", "ageGroup", "flags"]
const more: FacetKey[] = ["clinic", "balance", "newThisMonth"]

const fromMap = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }))
const facetOptions: Record<FacetKey, () => { value: string; label: string }[]> = {
  primaryDoctorId: () =>
    allDoctors()
      .filter((d) => d.specialtyId === "family-medicine" || d.specialtyId === "pediatrics")
      .map((d) => ({ value: d.id, label: d.name })),
  insuranceCategory: () => fromMap(copy.insuranceCategory),
  ageGroup: () => ageGroups.map((g) => ({ value: g.id, label: g.label })),
  flags: () => ["high-risk", "new", "balance-due", "forms-pending"].map((f) => ({ value: f, label: statusLabel("flag", f) })),
  clinic: () => clinics.map((c) => ({ value: c.id, label: c.short })),
  balance: () => fromMap(copy.balance),
  newThisMonth: () => fromMap(copy.newThisMonth),
}

const insuranceText = (p: Patient) => {
  if (!p.insurance) return null
  const plan = getPlanSync(p.insurance.planId)
  return plan ? `${plan.name} ${p.insurance.planType}` : p.insurance.planType
}

/** First flag as a badge, the rest as "+N" so rows keep one height. All flags stay readable to screen readers. */
function FlagList({ flags }: { flags: Patient["flags"] }) {
  const rest = flags.slice(1)
  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <StatusBadge kind="flag" status={flags[0]} />
      {rest.length > 0 && (
        <span title={rest.map((f) => statusLabel("flag", f)).join(", ")} className="inline-flex h-6 items-center rounded-full bg-neutral-100 px-2 text-neutral-600 tabular-nums text-micro">
          <span aria-hidden="true">+{rest.length}</span>
          <span className="sr-only">{rest.map((f) => statusLabel("flag", f)).join(", ")}</span>
        </span>
      )}
    </span>
  )
}

const dash = <span className="text-neutral-300">—</span>

export function PatientsPage() {
  const url = useUrlState()
  const router = useRouter()
  const clinic = useAdminState((s) => s.clinic)
  const [creating, setCreating] = React.useState(false)
  const isDoctor = useSession()?.role === "doctor"
  // Doctors open "My patients" (?doctor=me) from the sidebar; admins and the front desk always see everyone.
  const mineOnly = isDoctor && url.get("doctor") === "me"

  const q = url.get("q")
  const filters: Partial<PatientFilters> = {}
  for (const k of facetKeys) filters[k] = url.getList(k)
  // The sidebar clinic switcher narrows the list unless a clinic filter is chosen here.
  if (clinic !== "all" && !filters.clinic?.length) filters.clinic = [clinic]
  const key = JSON.stringify({ q, filters, sort: url.sort, page: url.page, size: url.pageSize, mineOnly })
  const { data, loading, initial, error, retry } = useQuery(() => listPatients({ q, filters, sort: url.sort, page: url.page, pageSize: url.pageSize, doctorId: mineOnly ? myDoctorId() : undefined }), [key])

  const columns = React.useMemo<Col<Patient>[]>(
    () => [
      { id: "name", header: "Patient", meta: { label: "Patient", className: "min-w-52" }, enableHiding: false, cell: ({ row }) => <PatientCell patient={row.original} /> },
      { id: "dob", header: "DOB", meta: { label: "Date of birth" }, cell: ({ row }) => <span className="tabular-nums">{fmtDateNumeric(row.original.dob)}</span> },
      { id: "phone", header: "Phone", enableSorting: false, meta: { label: "Phone" }, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{row.original.phone}</span> },
      { id: "primaryDoctor", header: "Primary provider", meta: { label: "Primary provider" }, cell: ({ row }) => <span className="whitespace-nowrap text-neutral-900">{getDoctorSync(row.original.primaryDoctorId)?.name}</span> },
      {
        id: "insurance",
        header: "Insurance",
        meta: { label: "Insurance", className: "min-w-40" },
        cell: ({ row }) => {
          const p = row.original
          return p.insurance ? (
            <span className="block max-w-44">
              <span className="block truncate text-neutral-900">{insuranceText(p)}</span>
              <span className="block truncate text-neutral-400 tabular-nums text-micro">{p.insurance.memberId}</span>
            </span>
          ) : (
            <span className="text-neutral-500">Self-pay</span>
          )
        },
      },
      { id: "lastVisit", header: "Last visit", meta: { label: "Last visit" }, cell: ({ row }) => (row.original.lastVisitAt ? <span className="whitespace-nowrap tabular-nums">{fmtDate(row.original.lastVisitAt)}</span> : dash) },
      {
        id: "nextVisit",
        header: "Next visit",
        meta: { label: "Next visit" },
        cell: ({ row }) =>
          row.original.nextVisitAt ? (
            <span className="block whitespace-nowrap tabular-nums">
              <span className="block text-neutral-950">{fmtDate(row.original.nextVisitAt)}</span>
              <span className="block text-neutral-400 text-micro">{fmtTime(row.original.nextVisitAt)}</span>
            </span>
          ) : (
            dash
          ),
      },
      { id: "balance", header: "Balance", meta: { label: "Balance", align: "right" }, cell: ({ row }) => <MoneyCell value={row.original.balance} muted={row.original.balance === 0} /> },
      {
        id: "flags",
        header: "Flags",
        enableSorting: false,
        meta: { label: "Flags", className: "min-w-40" },
        cell: ({ row }) =>
          row.original.flags.length ? <FlagList flags={row.original.flags} /> : null,
      },
    ],
    []
  )

  const labelOf = (k: FacetKey, v: string) => facetOptions[k]().find((o) => o.value === v)?.label ?? v
  const chips = facetKeys.flatMap((k) =>
    url.getList(k).map((v) => ({
      key: `${k}-${v}`,
      label: `${copy.facets[k]}: ${labelOf(k, v)}`,
      onRemove: () => url.set({ [k]: url.getList(k).filter((x) => x !== v) }),
    }))
  )
  const filtered = chips.length > 0 || !!q
  const clearAll = () => url.set(Object.fromEntries([...facetKeys, "q"].map((k) => [k, null])))

  const exportRows = (ids?: string[]) => {
    const list = ids ? ids.map(getPatientSync).filter((p) => p !== undefined) : (data?.rows ?? [])
    downloadCsv(
      "patients.csv",
      list.map((p) => ({
        MRN: p.mrn,
        Name: p.name,
        DOB: fmtDateNumeric(p.dob),
        Sex: p.sex,
        Phone: p.phone,
        Email: p.email,
        "Primary provider": getDoctorSync(p.primaryDoctorId)?.name,
        Insurance: insuranceText(p) ?? "Self-pay",
        "Member ID": p.insurance?.memberId ?? "",
        "Last visit": p.lastVisitAt?.slice(0, 10) ?? "",
        "Next visit": p.nextVisitAt ?? "",
        Balance: p.balance.toFixed(2),
        Flags: p.flags.map((f) => statusLabel("flag", f)).join("; "),
      }))
    )
    notify.success(copy.bulk.exported(list.length))
  }

  const c = adminCopy.pages.patients
  const dc = doctorChartCopy.patients
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={mineOnly ? dc.myTitle : c.title}
        description={mineOnly ? dc.myDescription : c.description}
        actions={
          <>
            <Button variant="outline" className="h-10 rounded-full px-4 text-caption" onClick={() => exportRows()} disabled={!data?.rows.length}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.bulk.export}
            </Button>
            <Button className="h-10 rounded-full px-4 text-caption" onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              {copy.newPatient}
            </Button>
          </>
        }
      />

      <DataTable
        id="patients"
        label="Patients"
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(p) => p.id}
        loading={initial}
        refreshing={loading && !initial}
        error={error}
        onRetry={retry}
        sort={url.sort ?? { id: "name", desc: false }}
        onSortChange={url.setSort}
        selectable
        defaultHidden={["phone"]}
        onRowClick={(p) => router.push(`/admin/patients/${p.id}`)}
        rowLabel={(p) => `${p.name}, ${p.mrn}`}
        mobileCard={(p) => (
          <span className="flex flex-col gap-2">
            <span className="flex items-start justify-between gap-3">
              <PatientCell patient={p} link={false} />
              {p.balance > 0 && <MoneyCell value={p.balance} />}
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-1 text-neutral-500 tabular-nums text-micro">
              <span>{getDoctorSync(p.primaryDoctorId)?.name}</span>
              <span>{insuranceText(p) ?? "Self-pay"}</span>
              {p.nextVisitAt && <span className="text-neutral-950">Next {fmtDate(p.nextVisitAt)}</span>}
            </span>
            {p.flags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {p.flags.map((f) => (
                  <StatusBadge key={f} kind="flag" status={f} />
                ))}
              </span>
            )}
          </span>
        )}
        bulkActions={(ids, clear) => (
          <>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => (notify.success(copy.bulk.sent(ids.length)), clear())}>
              <HugeiconsIcon icon={MailSend01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.bulk.message}
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => exportRows(ids)}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.bulk.export}
            </Button>
          </>
        )}
        toolbar={
          <>
            {isDoctor && <ScopeChip mine={mineOnly} onChange={(mine) => url.set({ doctor: mine ? "me" : null })} />}
            <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={copy.search} />
            {primary.map((k) => (
              <FacetFilter key={k} title={copy.facets[k]} options={facetOptions[k]()} selected={url.getList(k)} onChange={(v) => url.set({ [k]: v })} counts={data?.facets[k]} />
            ))}
            <MoreFilters groups={more.map((k) => ({ key: k, title: copy.facets[k], options: facetOptions[k](), selected: url.getList(k), onChange: (v: string[]) => url.set({ [k]: v }), counts: data?.facets[k] }))} />
            <ResetButton show={filtered} onClick={() => url.set(Object.fromEntries([...facetKeys, "q", "sort"].map((k) => [k, null])))} />
            <FilterChips chips={chips} />
          </>
        }
        empty={
          <EmptyState
            icon={UserGroupIcon}
            title={filtered ? copy.empty.filtered.title : copy.empty.none.title}
            text={filtered ? copy.empty.filtered.text : copy.empty.none.text}
            action={
              filtered ? (
                <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={clearAll}>
                  {copy.empty.clear}
                </Button>
              ) : undefined
            }
          />
        }
        footer={data && data.total > 0 ? <Pagination page={data.page} pageCount={data.pageCount} pageSize={data.pageSize} total={data.total} onPage={(p) => url.set({ page: p }, { keepPage: true })} onPageSize={(n) => url.set({ size: n })} /> : null}
      />

      <NewPatientDialog open={creating} onOpenChange={setCreating} onCreated={(p) => router.push(`/admin/patients/${p.id}`)} />
    </div>
  )
}

/** "My patients · Show all" — lets a doctor switch between their own patients and everyone. */
function ScopeChip({ mine, onChange }: { mine: boolean; onChange: (mine: boolean) => void }) {
  const dc = doctorChartCopy.patients
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white pr-1 pl-3.5 text-caption">
      <span className="text-neutral-950">{mine ? dc.mine : dc.all}</span>
      <span aria-hidden="true" className="text-neutral-300">
        ·
      </span>
      <button type="button" onClick={() => onChange(!mine)} className={cn("h-7 rounded-full px-2.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950", focusRing.dark)}>
        {mine ? dc.showAll : dc.showMine}
      </button>
    </span>
  )
}

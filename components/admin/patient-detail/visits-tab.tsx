"use client"

import * as React from "react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"

import { chartCopy } from "@/lib/data/admin-patients"
import { fmtMoney, NOW } from "@/lib/admin/format"
import type { Appointment } from "@/lib/admin/types"
import { DataTable, FacetFilter, Pagination, type Col } from "@/components/admin/data-table"
import { ClinicBadge, DoctorCell, EmptyState, StatusBadge, statusLabel, TimeCell } from "@/components/admin/ui"
import { visitTypeLabel } from "@/components/admin/forms"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const c = chartCopy.visits
const views = [
  { id: "all", label: c.all },
  { id: "upcoming", label: c.upcoming },
  { id: "past", label: c.past },
] as const
type View = (typeof views)[number]["id"]

export function VisitsTab({ appointments, onOpen }: { appointments: Appointment[]; onOpen: (id: string) => void }) {
  const [view, setView] = React.useState<View>("all")
  const [status, setStatus] = React.useState<string[]>([])
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>({ id: "start", desc: true })
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const inView = appointments.filter((a) => (view === "all" ? true : view === "upcoming" ? a.start > NOW : a.start <= NOW))
  const counts = inView.reduce<Record<string, number>>((m, a) => ((m[a.status] = (m[a.status] ?? 0) + 1), m), {})
  const rows = inView.filter((a) => !status.length || status.includes(a.status))
  const dir = sort?.desc === false ? 1 : -1
  const sorted = [...rows].sort((a, b) => (a.start < b.start ? -dir : a.start > b.start ? dir : 0))
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const p = Math.min(page, pageCount)
  const shown = sorted.slice((p - 1) * pageSize, p * pageSize)

  const columns = React.useMemo<Col<Appointment>[]>(
    () => [
      { id: "start", header: "When", meta: { label: "When" }, enableHiding: false, cell: ({ row }) => <TimeCell value={row.original.start} video={row.original.type === "video"} /> },
      {
        id: "visit",
        header: "Visit",
        enableSorting: false,
        meta: { label: "Visit", className: "min-w-48" },
        cell: ({ row }) => (
          <span className="block max-w-64">
            <span className="block truncate text-neutral-950">{visitTypeLabel(row.original.visitType)}</span>
            <span className="block truncate text-neutral-500 text-micro">{row.original.reason}</span>
          </span>
        ),
      },
      { id: "doctor", header: "Provider", enableSorting: false, meta: { label: "Provider", className: "min-w-44" }, cell: ({ row }) => <DoctorCell id={row.original.doctorId} /> },
      { id: "clinic", header: "Clinic", enableSorting: false, meta: { label: "Clinic" }, cell: ({ row }) => (row.original.type === "video" ? <span className="text-neutral-500">Video</span> : <ClinicBadge id={row.original.clinicId} />) },
      { id: "status", header: "Status", enableSorting: false, meta: { label: "Status" }, cell: ({ row }) => <StatusBadge kind="appointment" status={row.original.status} /> },
      { id: "copay", header: "Copay", enableSorting: false, meta: { label: "Copay", align: "right" }, cell: ({ row }) => <span className="block text-right tabular-nums">{fmtMoney(row.original.copay)}</span> },
    ],
    []
  )

  const statusOptions = [...new Set(appointments.map((a) => a.status))].map((s) => ({ value: s, label: statusLabel("appointment", s) }))

  return (
    <DataTable
      id="patient-visits"
      label="Visits"
      columns={columns}
      rows={shown}
      getRowId={(a) => a.id}
      sort={sort}
      onSortChange={(s) => (setSort(s), setPage(1))}
      onRowClick={(a) => onOpen(a.id)}
      rowLabel={(a) => `${visitTypeLabel(a.visitType)}, ${a.start}`}
      defaultHidden={["copay"]}
      mobileCard={(a) => (
        <span className="flex flex-col gap-1.5">
          <span className="flex items-start justify-between gap-3">
            <TimeCell value={a.start} video={a.type === "video"} />
            <StatusBadge kind="appointment" status={a.status} />
          </span>
          <span className="text-neutral-500 text-micro">
            {visitTypeLabel(a.visitType)} · {a.reason}
          </span>
        </span>
      )}
      toolbar={
        <>
          <Tabs value={view} onValueChange={(v) => (setView(v as View), setPage(1))}>
            <TabsList className="h-9 bg-neutral-100">
              {views.map((v) => (
                <TabsTrigger key={v.id} value={v.id} className="h-full rounded-full px-3.5 text-caption">
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <FacetFilter title="Status" options={statusOptions} selected={status} onChange={(v) => (setStatus(v), setPage(1))} counts={counts} />
        </>
      }
      empty={<EmptyState icon={Calendar03Icon} title={c.empty} />}
      footer={sorted.length > 0 ? <Pagination page={p} pageCount={pageCount} pageSize={pageSize} total={sorted.length} onPage={setPage} onPageSize={(n) => (setPageSize(n), setPage(1))} /> : null}
    />
  )
}

"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Download01Icon, MoreHorizontalIcon, Notification03Icon, PlusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { adminCopy, appointmentsCopy as copy } from "@/lib/data/admin"
import { fmtDate, fmtTime } from "@/lib/admin/format"
import { allDoctors, clinics, getAppointmentSync, getDoctorSync, getPatientSync, listAppointments, type AppointmentFilters } from "@/lib/admin/queries"
import { confirmAppointments, sendReminders, setAppointmentStatus } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import type { Appointment } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, DateRangeFilter, FacetFilter, FilterChips, MoreFilters, Pagination, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { ClinicBadge, DoctorCell, EmptyState, notify, PageHeader, PatientCell, StatusBadge, statusLabel, TimeCell, touchTarget } from "@/components/admin/ui"
import { NewAppointmentDialog, visitTypeLabel, visitTypeOptions } from "@/components/admin/forms"
import { AppointmentSheet } from "@/components/admin/appointment-sheet"
import { downloadCsv } from "@/components/admin/csv"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const statuses = ["scheduled", "confirmed", "arrived", "checked-in", "waiting", "with-doctor", "completed", "no-show", "cancelled", "late-cancel"]
const facetKeys = ["status", "doctorId", "clinicId", "type", "visitType", "source", "forms", "insurance"] as const
type FacetKey = (typeof facetKeys)[number]

const facetMeta: Record<FacetKey, { title: string; options: () => { value: string; label: string }[] }> = {
  status: { title: "Status", options: () => statuses.map((s) => ({ value: s, label: statusLabel("appointment", s) })) },
  doctorId: { title: "Provider", options: () => allDoctors().map((d) => ({ value: d.id, label: d.name })) },
  clinicId: { title: "Clinic", options: () => clinics.map((c) => ({ value: c.id, label: c.short })) },
  type: { title: "Type", options: () => [{ value: "in-person", label: "In person" }, { value: "video", label: "Video" }] },
  visitType: { title: "Visit", options: () => visitTypeOptions },
  source: { title: "Booked via", options: () => ["online", "app", "phone", "walk-in"].map((s) => ({ value: s, label: s === "app" ? "App" : s === "walk-in" ? "Walk-in" : s[0].toUpperCase() + s.slice(1) })) },
  forms: { title: "Forms", options: () => [{ value: "done", label: "Done" }, { value: "pending", label: "Pending" }] },
  insurance: { title: "Insurance", options: () => [{ value: "verified", label: "Verified" }, { value: "not-verified", label: "Not verified" }] },
}

function RowMenu({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  const upcoming = a.status === "scheduled" || a.status === "confirmed"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} render={<Button variant="ghost" size="icon" aria-label={`Actions for ${getPatientSync(a.patientId)?.name}`} className={cn("size-8 rounded-full text-neutral-500", touchTarget)} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.8} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className="rounded-xl text-caption" onClick={onOpen}>
          {copy.menu.view}
        </DropdownMenuItem>
        {upcoming && (
          <>
            {a.status === "scheduled" && (
              <DropdownMenuItem className="rounded-xl text-caption" onClick={() => notify.success(setAppointmentStatus(a.id, "confirmed"))}>
                {copy.menu.confirm}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="rounded-xl text-caption" onClick={() => notify.success(sendReminders([a.id]))}>
              {copy.menu.remind}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem className="rounded-xl text-caption" onClick={onOpen}>
              {copy.menu.change}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppointmentsPage() {
  const url = useUrlState()
  const clinic = useAdminState((s) => s.clinic)
  const [creating, setCreating] = React.useState(false)
  const open = url.get("open") || null
  const setOpen = (id: string | null) => url.set({ open: id }, { keepPage: true })

  const tab = (url.get("tab", "today") as AppointmentFilters["tab"]) || "today"
  const q = url.get("q")
  const filters: Partial<AppointmentFilters> = { tab, from: url.get("from"), to: url.get("to") }
  for (const k of facetKeys) filters[k] = url.getList(k)
  // The clinic switcher narrows the list unless a clinic filter is chosen here.
  if (clinic !== "all" && !filters.clinicId?.length) filters.clinicId = [clinic]
  const key = JSON.stringify({ q, filters, sort: url.sort, page: url.page, size: url.pageSize })

  const { data, loading, initial, error, retry } = useQuery(() => listAppointments({ q, filters, sort: url.sort, page: url.page, pageSize: url.pageSize }), [key])

  const columns = React.useMemo<Col<Appointment>[]>(
    () => [
      { id: "start", accessorKey: "start", header: "When", meta: { label: "When" }, enableHiding: false, cell: ({ row }) => <TimeCell value={row.original.start} video={row.original.type === "video"} /> },
      { id: "patient", header: "Patient", meta: { label: "Patient", className: "min-w-56" }, enableHiding: false, cell: ({ row }) => <PatientCell patient={row.original.patientId} /> },
      { id: "doctor", header: "Provider", meta: { label: "Provider", className: "min-w-48" }, cell: ({ row }) => <DoctorCell id={row.original.doctorId} /> },
      { id: "clinic", header: "Clinic", meta: { label: "Clinic" }, cell: ({ row }) => (row.original.type === "video" ? <span className="text-neutral-500">Video</span> : <ClinicBadge id={row.original.clinicId} />) },
      {
        id: "visitType",
        header: "Visit",
        meta: { label: "Visit", className: "min-w-44" },
        cell: ({ row }) => (
          <span className="block max-w-56">
            <span className="block truncate text-neutral-950">{visitTypeLabel(row.original.visitType)}</span>
            <span className="block truncate text-neutral-500 text-micro">{row.original.reason}</span>
          </span>
        ),
      },
      { id: "status", header: "Status", meta: { label: "Status" }, cell: ({ row }) => <StatusBadge kind="appointment" status={row.original.status} /> },
      { id: "forms", header: "Forms", enableSorting: false, meta: { label: "Forms" }, cell: ({ row }) => <StatusBadge kind="forms" status={row.original.formsDone ? "done" : "pending"} /> },
      { id: "insurance", header: "Insurance", enableSorting: false, meta: { label: "Insurance" }, cell: ({ row }) => <StatusBadge kind="insurance" status={row.original.insuranceVerified ? "verified" : "not-verified"} /> },
      { id: "source", header: "Booked via", meta: { label: "Booked via" }, cell: ({ row }) => <span className="capitalize">{row.original.source}</span> },
      { id: "actions", header: () => <span className="sr-only">Actions</span>, enableSorting: false, enableHiding: false, meta: { className: "w-12 text-right" }, cell: ({ row }) => <RowMenu a={row.original} onOpen={() => setOpen(row.original.id)} /> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const chips = [
    ...facetKeys.flatMap((k) =>
      url.getList(k).map((v) => ({
        key: `${k}-${v}`,
        label: `${facetMeta[k].title}: ${facetMeta[k].options().find((o) => o.value === v)?.label ?? v}`,
        onRemove: () => url.set({ [k]: url.getList(k).filter((x) => x !== v) }),
      }))
    ),
    ...(url.get("from") ? [{ key: "dates", label: `Dates: ${fmtDate(url.get("from"))}${url.get("to") ? ` – ${fmtDate(url.get("to"))}` : ""}`, onRemove: () => url.set({ from: null, to: null }) }] : []),
  ]
  const filtered = chips.length > 0 || !!q

  const exportRows = (ids?: string[]) => {
    const list = ids ? ids.map(getAppointmentSync).filter((a) => a !== undefined) : (data?.rows ?? [])
    downloadCsv(
      `appointments-${tab}.csv`,
      list.map((a) => ({
        ID: a.id,
        Date: a.start.slice(0, 10),
        Time: fmtTime(a.start),
        Patient: getPatientSync(a.patientId)?.name,
        MRN: getPatientSync(a.patientId)?.mrn,
        Provider: getDoctorSync(a.doctorId)?.name,
        Clinic: a.type === "video" ? "Video" : a.clinicId,
        Visit: visitTypeLabel(a.visitType),
        Reason: a.reason,
        Status: statusLabel("appointment", a.status),
      }))
    )
    notify.success(copy.exported(list.length))
  }

  const c = adminCopy.pages.appointments
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <>
            <Button variant="outline" className="h-10 rounded-full px-4 text-caption" onClick={() => exportRows()} disabled={!data?.rows.length}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.export}
            </Button>
            <Button className="h-10 rounded-full px-4 text-caption" onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              {adminCopy.newAppointment}
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === "today" ? null : String(v) })}>
        <TabsList className="relative h-10 w-full justify-start overflow-x-auto bg-neutral-100 sm:w-fit sm:max-w-full">
          {copy.tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 rounded-full px-4 text-caption">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        id="appointments"
        label="Appointments"
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(a) => a.id}
        loading={initial}
        refreshing={loading && !initial}
        error={error}
        onRetry={retry}
        sort={url.sort ?? { id: "start", desc: tab === "no-shows" || tab === "cancelled" }}
        onSortChange={url.setSort}
        selectable
        defaultHidden={["source", "insurance"]}
        onRowClick={(a) => setOpen(a.id)}
        rowLabel={(a) => `${getPatientSync(a.patientId)?.name}, ${fmtDate(a.start)} ${fmtTime(a.start)}`}
        mobileCard={(a) => (
          <span className="flex flex-col gap-2">
            <span className="flex items-start justify-between gap-3">
              <PatientCell patient={a.patientId} link={false} />
              <StatusBadge kind="appointment" status={a.status} />
            </span>
            <span className="flex flex-wrap gap-x-3 text-neutral-500 tabular-nums text-micro">
              <span className="text-neutral-950">{fmtDate(a.start)} · {fmtTime(a.start)}</span>
              <span>{getDoctorSync(a.doctorId)?.name}</span>
              <span>{visitTypeLabel(a.visitType)}</span>
            </span>
          </span>
        )}
        bulkActions={(ids, clear) => (
          <>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => (notify.success(confirmAppointments(ids)), clear())}>
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
              {copy.bulk.confirm}
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => (notify.success(sendReminders(ids)), clear())}>
              <HugeiconsIcon icon={Notification03Icon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.bulk.remind}
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full bg-white px-3 text-caption" onClick={() => exportRows(ids)}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.bulk.export}
            </Button>
          </>
        )}
        toolbar={
          <>
            <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={copy.search} />
            <DateRangeFilter from={url.get("from")} to={url.get("to")} onChange={(from, to) => url.set({ from, to })} />
            {(["status", "doctorId", "clinicId", "visitType"] as const).map((k) => (
              <FacetFilter key={k} title={facetMeta[k].title} options={facetMeta[k].options()} selected={url.getList(k)} onChange={(v) => url.set({ [k]: v })} counts={data?.facets[k]} />
            ))}
            <MoreFilters
              groups={(["type", "forms", "insurance", "source"] as const).map((k) => ({ key: k, title: facetMeta[k].title, options: facetMeta[k].options(), selected: url.getList(k), onChange: (v: string[]) => url.set({ [k]: v }), counts: data?.facets[k] }))}
            />
            <ResetButton show={filtered} onClick={() => url.set(Object.fromEntries([...facetKeys, "q", "from", "to", "sort"].map((k) => [k, null])))} />
            <FilterChips chips={chips} />
          </>
        }
        empty={
          <EmptyState
            icon={Calendar03Icon}
            title={filtered ? copy.empty.filtered.title : copy.empty.none.title}
            text={filtered ? copy.empty.filtered.text : copy.empty.none.text}
            action={
              filtered ? (
                <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={() => url.set(Object.fromEntries([...facetKeys, "q", "from", "to"].map((k) => [k, null])))}>
                  {copy.empty.clear}
                </Button>
              ) : undefined
            }
          />
        }
        footer={data && data.total > 0 ? <Pagination page={data.page} pageCount={data.pageCount} pageSize={data.pageSize} total={data.total} onPage={(p) => url.set({ page: p }, { keepPage: true })} onPageSize={(n) => url.set({ size: n })} /> : null}
      />

      <AppointmentSheet id={open} onOpenChange={(o) => !o && setOpen(null)} />
      <NewAppointmentDialog open={creating} onOpenChange={setCreating} onCreated={(id) => setOpen(id)} />
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { GridViewIcon, LeftToRightListBulletIcon, StarIcon, Stethoscope02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { adminCopy } from "@/lib/data/admin"
import { doctorsCopy } from "@/lib/data/admin-schedule"
import { fmtDate, fmtTime, relative } from "@/lib/admin/format"
import { allDoctors, clinics, listDoctors, specialties, type DoctorRow } from "@/lib/admin/queries"
import { useAdminState } from "@/lib/admin/store"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, FacetFilter, FilterChips, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { Avatar, CardSkeleton, ClinicBadge, EmptyState, ErrorState, PageHeader, panel, StatusBadge } from "@/components/admin/ui"
import { LoadBar } from "@/components/admin/schedule/load"
import { Button } from "@/components/ui/button"

const facetKeys = ["specialty", "clinic", "accepting", "status", "language"] as const
type FacetKey = (typeof facetKeys)[number]

const facetMeta: Record<FacetKey, { title: string; options: () => { value: string; label: string }[] }> = {
  specialty: { title: "Specialty", options: () => specialties.map((s) => ({ value: s.id, label: s.name })) },
  clinic: { title: "Clinic", options: () => clinics.map((c) => ({ value: c.id, label: c.short })) },
  accepting: { title: "Accepting new", options: () => [{ value: "yes", label: "Accepting" }, { value: "no", label: "Not accepting" }] },
  status: { title: "Status", options: () => [{ value: "active", label: "Active" }, { value: "on-leave", label: "On leave" }] },
  language: { title: "Language", options: () => [...new Set(allDoctors().flatMap((d) => d.languages))].sort().map((l) => ({ value: l, label: l })) },
}

function TodayLoad({ d }: { d: DoctorRow }) {
  if (!d.todayCapacity) return <span className="text-neutral-400 text-caption">{d.status === "on-leave" ? "On leave" : "Off today"}</span>
  return (
    <span className="flex w-28 flex-col gap-1">
      <span className="text-neutral-950 tabular-nums text-caption">
        {d.todayBooked}
        <span className="text-neutral-400">/{d.todayCapacity}</span>
      </span>
      <LoadBar booked={d.todayBooked} capacity={d.todayCapacity} />
    </span>
  )
}

function NextOpen({ value }: { value: string | null }) {
  if (!value) return <span className="text-neutral-400 text-caption">None in 2 weeks</span>
  return (
    <span className="block whitespace-nowrap">
      <span className="block text-neutral-950 tabular-nums text-caption">
        {fmtDate(value)} · {fmtTime(value)}
      </span>
      <span className="block text-neutral-400 text-micro">{relative(value)}</span>
    </span>
  )
}

function Rating({ d }: { d: DoctorRow }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums text-caption">
      <HugeiconsIcon icon={StarIcon} strokeWidth={1.8} aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="text-neutral-950">{d.rating.toFixed(1)}</span>
      <span className="text-neutral-400">({d.reviewCount})</span>
    </span>
  )
}

function DoctorCard({ d }: { d: DoctorRow }) {
  return (
    <li>
      <Link href={`/admin/doctors/${d.id}`} className={cn(panel, "flex h-full flex-col gap-4 p-4 transition-colors hover:border-neutral-300", focusRing.dark)}>
        <div className="flex items-start gap-3">
          <Avatar name={d.name} id={d.id} src={d.avatar} className="size-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-neutral-950 text-body">{d.name}</p>
            <p className="truncate text-neutral-500 text-caption">{d.specialty}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {d.clinicIds.map((c) => (
                <ClinicBadge key={c} id={c} />
              ))}
              <Rating d={d} />
            </div>
          </div>
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
          <div>
            <dt className="text-neutral-400 text-micro">Today</dt>
            <dd className="mt-1">
              <TodayLoad d={d} />
            </dd>
          </div>
          <div>
            <dt className="text-neutral-400 text-micro">Next open</dt>
            <dd className="mt-1">
              <NextOpen value={d.nextOpen} />
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge kind="doctor" status={d.status} />
          <StatusBadge kind="accepting" status={d.acceptingNew ? "yes" : "no"} />
        </div>
      </Link>
    </li>
  )
}

export function DoctorsPage() {
  const url = useUrlState()
  const router = useRouter()
  const layout = url.get("layout") === "table" ? "table" : "grid"
  const q = url.get("q")
  const clinic = useAdminState((s) => s.clinic)
  const filters = Object.fromEntries(facetKeys.map((k) => [k, url.getList(k)])) as Record<FacetKey, string[]>
  // The sidebar clinic switcher narrows the list unless a clinic filter is chosen here.
  if (clinic !== "all" && !filters.clinic.length) filters.clinic = [clinic]
  const key = JSON.stringify({ q, filters, sort: url.sort })
  const { data, loading, initial, error, retry } = useQuery(() => listDoctors({ q, filters, sort: url.sort, pageSize: 100 }), [key])

  const columns = React.useMemo<Col<DoctorRow>[]>(
    () => [
      {
        id: "name",
        header: "Doctor",
        meta: { label: "Doctor", className: "min-w-56" },
        enableHiding: false,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar name={row.original.name} id={row.original.id} src={row.original.avatar} />
            <span className="min-w-0">
              <span className="block truncate text-neutral-950 text-body">{row.original.name}</span>
              <span className="block truncate text-neutral-500 text-micro">
                {row.original.credential} · {row.original.yearsExperience} yrs · {row.original.languages.join(", ")}
              </span>
            </span>
          </span>
        ),
      },
      { id: "specialty", header: "Specialty", meta: { label: "Specialty", className: "whitespace-nowrap" }, cell: ({ row }) => row.original.specialty },
      { id: "clinics", header: "Clinics", enableSorting: false, meta: { label: "Clinics" }, cell: ({ row }) => <span className="flex flex-wrap gap-2">{row.original.clinicIds.map((c) => <ClinicBadge key={c} id={c} />)}</span> },
      { id: "today", header: "Today", meta: { label: "Today" }, cell: ({ row }) => <TodayLoad d={row.original} /> },
      { id: "nextOpen", header: "Next open slot", meta: { label: "Next open slot" }, cell: ({ row }) => <NextOpen value={row.original.nextOpen} /> },
      { id: "rating", header: "Rating", meta: { label: "Rating" }, cell: ({ row }) => <Rating d={row.original} /> },
      { id: "accepting", header: "Accepting new", enableSorting: false, meta: { label: "Accepting new" }, cell: ({ row }) => <StatusBadge kind="accepting" status={row.original.acceptingNew ? "yes" : "no"} /> },
      { id: "status", header: "Status", enableSorting: false, meta: { label: "Status" }, cell: ({ row }) => <StatusBadge kind="doctor" status={row.original.status} /> },
    ],
    []
  )

  const chips = facetKeys.flatMap((k) =>
    url.getList(k).map((v) => ({
      key: `${k}-${v}`,
      label: `${facetMeta[k].title}: ${facetMeta[k].options().find((o) => o.value === v)?.label ?? v}`,
      onRemove: () => url.set({ [k]: url.getList(k).filter((x) => x !== v) }),
    }))
  )
  const filtered = chips.length > 0 || !!q
  const clear = () => url.set(Object.fromEntries([...facetKeys, "q"].map((k) => [k, null])))

  const toolbar = (
    <>
      <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={doctorsCopy.search} />
      {facetKeys.map((k) => (
        <FacetFilter key={k} title={facetMeta[k].title} options={facetMeta[k].options()} selected={url.getList(k)} onChange={(v) => url.set({ [k]: v })} counts={data?.facets[k]} />
      ))}
      <ResetButton show={filtered} onClick={clear} />
      <FilterChips chips={chips} />
    </>
  )

  const empty = (
    <EmptyState
      icon={Stethoscope02Icon}
      title={doctorsCopy.emptyTitle}
      text={doctorsCopy.emptyText}
      action={
        filtered ? (
          <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={clear}>
            {doctorsCopy.clear}
          </Button>
        ) : undefined
      }
    />
  )

  const c = adminCopy.pages.doctors
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <div role="group" aria-label="Layout" className="inline-flex h-10 items-center rounded-full bg-neutral-100 p-1">
            {(["grid", "table"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={layout === l}
                onClick={() => url.set({ layout: l === "grid" ? null : l }, { keepPage: true })}
                className={cn("inline-flex h-full items-center gap-1.5 rounded-full px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption", layout === l ? "bg-white text-neutral-950" : "text-neutral-500 hover:text-neutral-950")}
              >
                <HugeiconsIcon icon={l === "grid" ? GridViewIcon : LeftToRightListBulletIcon} strokeWidth={1.8} className="size-4" />
                {doctorsCopy.layout[l]}
              </button>
            ))}
          </div>
        }
      />

      {layout === "table" ? (
        <DataTable
          id="doctors"
          label="Doctors"
          columns={columns}
          rows={data?.rows ?? []}
          getRowId={(d) => d.id}
          loading={initial}
          refreshing={loading && !initial}
          error={error}
          onRetry={retry}
          sort={url.sort ?? { id: "name", desc: false }}
          onSortChange={url.setSort}
          onRowClick={(d) => router.push(`/admin/doctors/${d.id}`)}
          rowLabel={(d) => `${d.name}, ${d.specialty}`}
          toolbar={toolbar}
          empty={empty}
          mobileCard={(d) => (
            <span className="flex flex-col gap-2">
              <span className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={d.name} id={d.id} src={d.avatar} />
                  <span className="min-w-0">
                    <span className="block truncate text-neutral-950 text-body">{d.name}</span>
                    <span className="block truncate text-neutral-500 text-micro">{d.specialty}</span>
                  </span>
                </span>
                <StatusBadge kind="doctor" status={d.status} />
              </span>
              <span className="flex flex-wrap gap-x-3 text-neutral-500 tabular-nums text-micro">
                <span className="text-neutral-950">{d.todayCapacity ? `${d.todayBooked}/${d.todayCapacity} today` : "Off today"}</span>
                <span>{d.nextOpen ? `Next ${fmtDate(d.nextOpen)} · ${fmtTime(d.nextOpen)}` : "No openings"}</span>
              </span>
            </span>
          )}
          footer={data ? <p className="px-4 py-3 text-neutral-500 tabular-nums text-caption">{data.total} providers</p> : null}
        />
      ) : (
        <section aria-label="Doctors" className="flex flex-col gap-4">
          <div className={cn(panel, "flex flex-wrap items-center gap-2 p-3")}>{toolbar}</div>
          {error ? (
            <div className={panel}>
              <ErrorState onRetry={retry} />
            </div>
          ) : initial ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <CardSkeleton key={i} className="h-56" />
              ))}
            </div>
          ) : !data?.rows.length ? (
            <div className={panel}>{empty}</div>
          ) : (
            <ul className={cn("grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", loading && "opacity-60")}>
              {data.rows.map((d) => (
                <DoctorCard key={d.id} d={d} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { Activity01Icon } from "@hugeicons/core-free-icons"

import { settingsCopy } from "@/lib/data/admin-settings"
import { fmtDateTime, relative } from "@/lib/admin/format"
import { authorName, getStaffSync, listActivity } from "@/lib/admin/queries"
import type { ActivityEvent } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { DataTable, FacetFilter, FilterChips, Pagination, ResetButton, SearchInput, type Col } from "@/components/admin/data-table"
import { Avatar, EmptyState } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"

const t = settingsCopy.audit
const entityOptions = Object.entries(t.entity).map(([value, label]) => ({ value, label }))

function Actor({ id }: { id: string }) {
  const name = authorName(id)
  const s = getStaffSync(id)
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} id={id} className="size-7" />
      <span className="min-w-0">
        <span className="block truncate text-neutral-950 text-caption">{name}</span>
        <span className="block truncate text-neutral-500 text-micro">{s?.title ?? "System"}</span>
      </span>
    </span>
  )
}

export function AuditTab() {
  const url = useUrlState()
  const q = url.get("q")
  const entity = url.getList("entity")
  const key = JSON.stringify({ q, entity, page: url.page, size: url.pageSize })
  const { data, loading, initial, error, retry } = useQuery(() => listActivity({ q, filters: { entity }, page: url.page, pageSize: url.pageSize }), [key])

  const columns = React.useMemo<Col<ActivityEvent>[]>(
    () => [
      {
        id: "at",
        header: "When",
        enableSorting: false,
        enableHiding: false,
        meta: { label: "When" },
        cell: ({ row }) => (
          <span className="block whitespace-nowrap">
            <span className="block text-neutral-950 tabular-nums">{fmtDateTime(row.original.at)}</span>
            <span className="block text-neutral-400 text-micro">{relative(row.original.at)}</span>
          </span>
        ),
      },
      { id: "actor", header: "Who", enableSorting: false, meta: { label: "Who", className: "min-w-48" }, cell: ({ row }) => <Actor id={row.original.actorId} /> },
      { id: "summary", header: "What happened", enableSorting: false, enableHiding: false, meta: { label: "What happened", className: "min-w-80" }, cell: ({ row }) => <span className="text-neutral-900">{row.original.summary}</span> },
      { id: "entity", header: "Area", enableSorting: false, meta: { label: "Area" }, cell: ({ row }) => <span className="inline-flex h-6 items-center rounded-full bg-neutral-100 px-2.5 text-neutral-600 text-micro">{t.entity[row.original.entityType] ?? row.original.entityType}</span> },
    ],
    [],
  )

  const chips = entity.map((v) => ({ key: v, label: `Area: ${t.entity[v] ?? v}`, onRemove: () => url.set({ entity: entity.filter((x) => x !== v) }) }))
  const filtered = !!q || entity.length > 0

  return (
    <DataTable
      id="audit"
      label="Audit log"
      columns={columns}
      rows={data?.rows ?? []}
      getRowId={(e) => e.id}
      loading={initial}
      refreshing={loading && !initial}
      error={error}
      onRetry={retry}
      mobileCard={(e) => (
        <span className="flex flex-col gap-2">
          <span className="text-neutral-950 text-caption">{e.summary}</span>
          <span className="flex flex-wrap gap-x-3 text-neutral-500 tabular-nums text-micro">
            <span>{authorName(e.actorId)}</span>
            <span>{fmtDateTime(e.at)}</span>
            <span>{t.entity[e.entityType] ?? e.entityType}</span>
          </span>
        </span>
      )}
      toolbar={
        <>
          <SearchInput value={q} onChange={(v) => url.set({ q: v })} placeholder={t.search} />
          <FacetFilter title="Area" options={entityOptions} selected={entity} onChange={(v) => url.set({ entity: v })} counts={data?.facets.entity} />
          <ResetButton show={filtered} onClick={() => url.set({ q: null, entity: null })} />
          <FilterChips chips={chips} />
        </>
      }
      empty={
        <EmptyState
          icon={Activity01Icon}
          title={t.empty.title}
          text={t.empty.text}
          action={
            filtered ? (
              <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={() => url.set({ q: null, entity: null })}>
                {t.clear}
              </Button>
            ) : undefined
          }
        />
      }
      footer={data && data.total > 0 ? <Pagination page={data.page} pageCount={data.pageCount} pageSize={data.pageSize} total={data.total} onPage={(p) => url.set({ page: p }, { keepPage: true })} onPageSize={(n) => url.set({ size: n })} /> : null}
    />
  )
}

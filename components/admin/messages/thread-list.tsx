"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Attachment01Icon, BubbleChatIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { messagesCopy as m } from "@/lib/data/admin-messages"
import { relative } from "@/lib/admin/format"
import { getPatientSync, waitingTooLong } from "@/lib/admin/queries"
import type { MessageThread } from "@/lib/admin/types"
import { FacetFilter, ResetButton, SearchInput } from "@/components/admin/data-table"
import { SelectInput } from "@/components/admin/forms"
import { Avatar, EmptyState, ErrorState, patientPhoto } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export type ThreadFilters = { q: string; status: string[]; topic: string[]; priority: string[]; mine: boolean; unread: boolean; sort: string }

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("h-10 shrink-0 rounded-full border px-3 md:h-9 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption", on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300")}
    >
      {children}
    </button>
  )
}

/** `lockMine`: the "Assigned to me" filter is always on (a doctor's own threads) and its toggle is hidden. */
export function ThreadFiltersBar({ f, facets, onChange, onReset, lockMine }: { f: ThreadFilters; facets?: Record<string, Record<string, number>>; onChange: (patch: Record<string, string | string[] | null>) => void; onReset: () => void; lockMine?: boolean }) {
  const active = !!f.q || f.status.length + f.topic.length + f.priority.length > 0 || (f.mine && !lockMine) || f.unread
  return (
    <div className="flex flex-col gap-2 border-b border-neutral-100 p-3">
      <div className="flex gap-2">
        <SearchInput value={f.q} onChange={(v) => onChange({ q: v })} placeholder={m.search} className="min-w-0 flex-1 sm:w-auto" />
        <SelectInput label="Sort" value={f.sort} onChange={(v) => onChange({ sort: v === "-last" ? null : v })} options={[...m.sort]} className="h-10 w-32 shrink-0 rounded-full data-[size=default]:h-10 md:h-9 md:data-[size=default]:h-9" />
      </div>
      <div className="relative -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none]">
        {(["status", "topic", "priority"] as const).map((k) => (
          <span key={k} className="shrink-0">
            <FacetFilter title={m.filters[k].title} options={[...m.filters[k].options]} selected={f[k]} onChange={(v) => onChange({ [k]: v })} counts={facets?.[k]} />
          </span>
        ))}
        {!lockMine && (
          <Toggle on={f.mine} onClick={() => onChange({ mine: f.mine ? null : "yes" })}>
            {m.filters.mine}
          </Toggle>
        )}
        <Toggle on={f.unread} onClick={() => onChange({ unread: f.unread ? null : "yes" })}>
          {m.filters.unread}
        </Toggle>
        <ResetButton show={active} onClick={onReset} />
      </div>
    </div>
  )
}

function ThreadItem({ t, selected, onSelect }: { t: MessageThread; selected: boolean; onSelect: () => void }) {
  const p = getPatientSync(t.patientId)
  const last = t.messages.at(-1)
  const overdue = waitingTooLong(t)
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn("flex w-full gap-3 border-b border-neutral-100 px-3 py-3 text-left outline-none focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset", selected ? "bg-neutral-100" : "hover:bg-neutral-50")}
      >
        <span className="relative">
          <Avatar name={p?.name ?? "?"} id={t.patientId} src={p ? patientPhoto(p) : undefined} />
          {t.unread && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-sky-500 ring-2 ring-white" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-neutral-950 text-caption", t.unread && "font-emphasis")}>
              {p?.name}
              {t.unread && <span className="sr-only"> (unread)</span>}
            </span>
            <span className="shrink-0 text-neutral-400 tabular-nums text-micro">{relative(t.lastMessageAt)}</span>
          </span>
          <span className="block truncate text-neutral-800 text-caption">{t.subject}</span>
          <span className="flex items-center gap-1 truncate text-neutral-500 text-micro">
            {last?.attachments?.length ? <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} className="size-3 shrink-0" aria-hidden="true" /> : null}
            <span className="truncate">{last ? `${last.internal ? "Note: " : last.from === "staff" ? "You: " : ""}${last.body}` : "No messages yet"}</span>
          </span>
          {(overdue || t.priority === "high" || t.status === "waiting") && (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {overdue && <span className="inline-flex h-5 items-center rounded-full bg-amber-50 px-2 text-amber-800 text-micro">{m.overdue}</span>}
              {t.priority === "high" && <span className="inline-flex h-5 items-center rounded-full bg-red-50 px-2 text-red-700 text-micro">High priority</span>}
              {t.status === "waiting" && <span className="inline-flex h-5 items-center rounded-full bg-sky-50 px-2 text-sky-800 text-micro">Waiting on patient</span>}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

export function ThreadList({ rows, loading, error, onRetry, selectedId, onSelect, total, onMore }: { rows: MessageThread[] | null; loading: boolean; error: Error | null; onRetry: () => void; selectedId: string | null; onSelect: (t: MessageThread) => void; total: number; onMore: () => void }) {
  if (error) return <ErrorState onRetry={onRetry} />
  if (!rows)
    return (
      <div aria-hidden="true" className="flex flex-col">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex gap-3 border-b border-neutral-100 px-3 py-3.5">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  if (!rows.length) return <EmptyState icon={BubbleChatIcon} title={m.empty.title} text={m.empty.text} />
  return (
    <>
      <ul aria-label="Conversations" aria-busy={loading || undefined}>
        {rows.map((t) => (
          <ThreadItem key={t.id} t={t} selected={t.id === selectedId} onSelect={() => onSelect(t)} />
        ))}
      </ul>
      {total > rows.length && (
        <div className="p-3">
          <Button variant="outline" className="h-10 w-full rounded-full px-4 text-caption" onClick={onMore} disabled={loading}>
            {m.loadMore}
            <span className="text-neutral-400 tabular-nums">
              {rows.length} of {total}
            </span>
          </Button>
        </div>
      )}
    </>
  )
}

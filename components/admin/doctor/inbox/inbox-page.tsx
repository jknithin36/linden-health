"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, InboxIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { adminCopy } from "@/lib/data/admin"
import { inboxCopy as c } from "@/lib/data/admin-doctor"
import { fmtDateTime, relative } from "@/lib/admin/format"
import { allInbox, listInbox, markResultsReviewed, reopenInboxItem, type InboxRow } from "@/lib/admin/doctor"
import { useAdminState } from "@/lib/admin/store"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { FacetFilter, ResetButton } from "@/components/admin/data-table"
import { EmptyState, ErrorState, notify, PageHeader, panel, PatientCell } from "@/components/admin/ui"
import { useMounted } from "@/hooks/use-mounted"
import { inboxTypeIcon, PriorityLabel } from "@/components/admin/doctor/badges"
import { InboxList, InboxListSkeleton } from "@/components/admin/doctor/inbox/inbox-list"
import { ResultDetail } from "@/components/admin/doctor/inbox/result-detail"
import { RefillDetail } from "@/components/admin/doctor/inbox/refill-detail"
import { FormDetail, MessageDetail, NoteDetail } from "@/components/admin/doctor/inbox/other-details"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tabIds = c.tabs.map((t) => t.id)

function Detail({ item, onBack }: { item: InboxRow; onBack: () => void }) {
  const done = item.status === "done"
  return (
    <section aria-label={`${c.typeLabel[item.type]}: ${item.summary}`} className={cn(panel, "flex min-w-0 flex-col")}>
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-5 md:px-6">
        <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1 rounded-full text-neutral-500 outline-none hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption lg:hidden">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
          {c.back}
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PatientCell patient={item.patientId} />
          <div className="flex flex-wrap items-center gap-2.5">
            <PriorityLabel priority={item.priority} />
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-neutral-100 px-2.5 text-neutral-700 text-micro">
              <HugeiconsIcon icon={inboxTypeIcon[item.type]} strokeWidth={1.8} aria-hidden="true" className="size-3" />
              {c.typeLabel[item.type]}
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-neutral-950 text-title">{item.summary}</h2>
          <p className="text-neutral-500 tabular-nums text-caption">
            {fmtDateTime(item.createdAt)} · {relative(item.createdAt)}
          </p>
        </div>
        {done && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-100 px-3.5 py-2.5">
            <p className="flex items-center gap-1.5 text-neutral-700 text-caption">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
              {c.done}
              {item.action ? ` · ${item.action}` : ""}
              {item.doneAt ? ` · ${relative(item.doneAt)}` : ""}
            </p>
            {item.type !== "note-to-sign" && (
              <Button variant="ghost" size="sm" className="h-7 rounded-full px-3 text-caption" onClick={() => (reopenInboxItem(item.id), notify.info("Moved back to To review"))}>
                Reopen
              </Button>
            )}
          </div>
        )}
      </div>
      <div className={cn("p-5 md:p-6", done && item.type !== "message" && "[&_figure]:opacity-90")}>
        {item.type === "result" && <ResultDetail key={item.id} item={item} />}
        {item.type === "refill" && <RefillDetail key={item.id} item={item} />}
        {item.type === "note-to-sign" && <NoteDetail key={item.id} item={item} />}
        {item.type === "message" && <MessageDetail key={item.id} item={item} />}
        {item.type === "form" && <FormDetail key={item.id} item={item} />}
      </div>
    </section>
  )
}

export function InboxPage() {
  const url = useUrlState()
  const mounted = useMounted()
  useAdminState((s) => s.version)
  const tab = tabIds.includes(url.get("tab") as (typeof tabIds)[number]) ? url.get("tab") : "all"
  const priority = url.getList("priority")
  const showDone = url.get("status") === "all"
  const itemId = url.get("item") || null
  const [checked, setChecked] = React.useState<string[]>([])

  const key = JSON.stringify({ tab, priority, showDone })
  const { data, initial, loading, error, retry } = useQuery(() => listInbox({ type: tab, priority, status: showDone ? [] : ["new"] }), [key])

  // Counts cover every item of a type (done included); "to review" counts only new ones.
  const everything = mounted ? allInbox() : []
  const counts = Object.fromEntries(tabIds.map((id) => [id, everything.filter((i) => id === "all" || i.type === id)]))
  const item = mounted && itemId ? (everything.find((i) => i.id === itemId) ?? null) : null

  const rows = data ?? []
  const liveChecked = checked.filter((id) => rows.some((r) => r.id === id && r.status === "new"))
  const select = (id: string | null) => url.set({ item: id })
  const filtered = priority.length > 0 || showDone

  const p = adminCopy.pages.inbox
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={p.title} description={mounted ? `${p.description} ${c.toReview(everything.filter((i) => i.status === "new").length)}.` : p.description} />

      <Tabs value={tab} onValueChange={(v) => (url.set({ tab: v === "all" ? null : String(v), item: null }), setChecked([]))}>
        <TabsList className="h-10 w-full justify-start overflow-x-auto bg-neutral-100 sm:w-fit sm:max-w-full">
          {c.tabs.map((t) => {
            const list = counts[t.id] ?? []
            const open = list.filter((i) => i.status === "new").length
            return (
              <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 gap-1.5 rounded-full px-4 text-caption">
                {t.label}
                {mounted && (
                  <span className="tabular-nums text-neutral-500">
                    <span className="sr-only">, {list.length} total, {open} to review</span>
                    <span aria-hidden="true">
                      {list.length}
                      {open !== list.length && <span className="text-micro"> · {open} new</span>}
                    </span>
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <section aria-label="Inbox items" className={cn(panel, "flex min-w-0 flex-col", item && "hidden lg:flex")}>
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
            <FacetFilter
              title={c.filters.priority}
              options={[
                { value: "high", label: c.filters.high },
                { value: "normal", label: c.filters.normal },
              ]}
              selected={priority}
              onChange={(v) => url.set({ priority: v })}
            />
            <label className="ml-1 flex items-center gap-2 text-neutral-700 text-caption">
              <Switch checked={showDone} onCheckedChange={(v) => url.set({ status: v ? "all" : null })} />
              {c.filters.showDone}
            </label>
            <ResetButton show={filtered} onClick={() => url.set({ priority: null, status: null })} />
            {loading && !initial && <span className="ml-auto text-neutral-400 text-micro">Updating…</span>}
          </div>
          {liveChecked.length > 0 && (
            <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <span className="text-neutral-700 tabular-nums text-caption">{c.bulk.selected(liveChecked.length)}</span>
              <Button
                size="sm"
                className="h-8 rounded-full px-3 text-caption"
                onClick={() => {
                  const n = liveChecked.length
                  const undo = markResultsReviewed(liveChecked)
                  setChecked([])
                  notify.undo(`${n} result${n === 1 ? "" : "s"} marked reviewed`, undo)
                }}
              >
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />
                {c.bulk.markReviewed}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 rounded-full px-3 text-caption" onClick={() => setChecked([])}>
                {c.bulk.clear}
              </Button>
            </div>
          )}
          {error ? (
            <ErrorState onRetry={retry} />
          ) : initial ? (
            <InboxListSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title={c.empty.title}
              text={filtered ? c.empty.filtered : c.empty.text}
              action={
                !showDone ? (
                  <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" onClick={() => url.set({ status: "all" })}>
                    {c.filters.showDone}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/my-day" />} className="rounded-full px-4 text-caption">
                    Back to My day
                  </Button>
                )
              }
            />
          ) : (
            <InboxList rows={rows} selectedId={itemId} onSelect={select} checked={liveChecked} onCheck={(id, on) => setChecked((x) => (on ? [...x, id] : x.filter((y) => y !== id)))} />
          )}
        </section>

        <div className={cn("min-w-0", !item && "hidden lg:block")}>
          {item ? (
            <Detail item={item} onBack={() => select(null)} />
          ) : (
            <div className={panel}>
              <EmptyState icon={InboxIcon} title={c.empty.pick} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Activity01Icon, ArrowRight01Icon, Download01Icon, File01Icon, Image01Icon, MessageMultiple01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chartCopy } from "@/lib/data/admin-patients"
import { topicLabel } from "@/lib/data/admin-messages"
import { fmtDateTime, relative } from "@/lib/admin/format"
import { authorName, type PatientDetail } from "@/lib/admin/queries"
import type { ActivityEvent, MessageThread } from "@/lib/admin/types"
import { EmptyState, notify, panel, StatusBadge, touchTarget } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { anyDate } from "@/components/admin/patient-detail/shared"

export function MessagesTab({ threads }: { threads: MessageThread[] }) {
  const c = chartCopy.messages
  if (!threads.length)
    return (
      <div className={panel}>
        <EmptyState icon={MessageMultiple01Icon} title={c.empty.title} text={c.empty.text} />
      </div>
    )
  return (
    <ul className={cn(panel, "flex flex-col divide-y divide-neutral-100 overflow-hidden")}>
      {threads.map((t) => {
        const last = t.messages.filter((m) => !m.internal).at(-1)
        return (
          <li key={t.id}>
            <Link href={`/admin/messages?thread=${t.id}`} className="flex items-start gap-4 px-5 py-4 outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)]" aria-label={`${c.open}: ${t.subject}`}>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {t.unread && (
                    <span className="size-2 shrink-0 rounded-full bg-sky-500">
                      <span className="sr-only">Unread: </span>
                    </span>
                  )}
                  <span className="truncate text-neutral-950 text-body">{t.subject}</span>
                </span>
                {last && <span className="mt-0.5 block truncate text-neutral-500 text-caption">{last.from === "staff" ? `${authorName(last.authorId)}: ` : ""}{last.body}</span>}
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge kind="thread" status={t.status} />
                  {t.priority === "high" && <StatusBadge kind="priority" status="high" />}
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600 text-micro">{topicLabel[t.topic]}</span>
                  <span className="text-neutral-400 text-micro">Assigned to {authorName(t.assignedToId)}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-neutral-400 tabular-nums text-micro">
                {relative(t.lastMessageAt)}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-neutral-300" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function DocumentsTab({ documents }: { documents: NonNullable<PatientDetail>["documents"] }) {
  const c = chartCopy.documents
  if (!documents.length)
    return (
      <div className={panel}>
        <EmptyState icon={File01Icon} title={c.empty.title} text={c.empty.text} />
      </div>
    )
  return (
    <ul className={cn(panel, "flex flex-col divide-y divide-neutral-100")}>
      {documents.map((d) => (
        <li key={d.id} className="flex items-center gap-4 px-5 py-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
            <HugeiconsIcon icon={d.type === "Image" ? Image01Icon : File01Icon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-neutral-950 text-caption">{d.name}</span>
            <span className="block text-neutral-500 text-micro">
              {d.type} · Added {anyDate(d.added)}
              {d.note ? ` · ${d.note}` : ""}
            </span>
          </span>
          <Button variant="ghost" size="icon" className={cn("size-8 rounded-full text-neutral-500", touchTarget)} aria-label={`${c.download} ${d.name}`} onClick={() => notify.info(c.demo)}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} />
          </Button>
        </li>
      ))}
    </ul>
  )
}

export function ActivityTab({ activity }: { activity: ActivityEvent[] }) {
  const c = chartCopy.activity
  if (!activity.length)
    return (
      <div className={panel}>
        <EmptyState icon={Activity01Icon} title={c.empty.title} text={c.empty.text} />
      </div>
    )
  const rows = [...activity].sort((a, b) => (a.at < b.at ? 1 : -1))
  return (
    <ol className={cn(panel, "flex flex-col px-5 py-2")}>
      {rows.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 py-3">
          <span aria-hidden="true" className="relative flex w-2 shrink-0 justify-center">
            <span className="mt-1.5 size-2 rounded-full bg-neutral-300" />
            {i < rows.length - 1 && <span className="absolute top-4 -bottom-4 w-px bg-neutral-100" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-pretty text-neutral-900 text-caption">{e.summary}</span>
            <span className="block text-neutral-400 text-micro">
              {authorName(e.actorId)} · {fmtDateTime(e.at)} · {relative(e.at)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

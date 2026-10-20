"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { adminCopy } from "@/lib/data/admin"
import { messagesCopy as m } from "@/lib/data/admin-messages"
import { allRefills, allThreads, currentUserId, getPatientSync, listThreads } from "@/lib/admin/queries"
import { updateThread } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import { myDoctorId } from "@/lib/admin/doctor"
import { useSession } from "@/lib/session-client"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import type { MessageThread } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { PageHeader, panel } from "@/components/admin/ui"
import { useMounted } from "@/hooks/use-mounted"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThreadFiltersBar, ThreadList, type ThreadFilters } from "@/components/admin/messages/thread-list"
import { RefillList } from "@/components/admin/messages/refill-list"
import { Conversation } from "@/components/admin/messages/conversation"
import { PatientPanel } from "@/components/admin/messages/patient-panel"

type Pane = "list" | "thread" | "context"

export function MessagesPage() {
  const url = useUrlState()
  const mounted = useMounted()
  useAdminState((s) => s.version)
  // Doctors only see threads assigned to them and their own refill requests.
  const isDoctor = useSession()?.role === "doctor"

  const tab = url.get("tab") === "refills" ? "refills" : "threads"
  const threadParam = url.get("thread") || null
  const patientParam = url.get("patient") || null
  const size = Math.max(20, Number(url.get("size")) || 20)
  const f: ThreadFilters = {
    q: url.get("q"),
    status: url.getList("status"),
    topic: url.getList("topic"),
    priority: url.getList("priority"),
    mine: isDoctor || url.get("mine") === "yes",
    unread: url.get("unread") === "yes",
    sort: url.get("sort", "-last"),
  }
  const sort = { id: f.sort.replace(/^-/, ""), desc: f.sort.startsWith("-") }
  const key = JSON.stringify({ f, size })
  const list = useQuery(
    () =>
      listThreads({
        q: f.q,
        filters: { status: f.status, topic: f.topic, priority: f.priority, mine: f.mine ? ["yes"] : [], unread: f.unread ? ["yes"] : [] },
        sort,
        pageSize: size,
      }),
    [key]
  )
  const refills = useQuery(async () => (isDoctor ? allRefills().filter((r) => r.doctorId === myDoctorId()) : allRefills()), [isDoctor])

  const [pane, setPane] = React.useState<Pane>(threadParam || patientParam ? "thread" : "list")

  // Resolve the open thread: ?thread=, or the latest thread for ?patient=.
  const threads = mounted ? allThreads() : []
  let thread: MessageThread | null = null
  if (threadParam) thread = threads.find((t) => t.id === threadParam) ?? null
  else if (patientParam) thread = threads.filter((t) => t.patientId === patientParam && (!isDoctor || t.assignedToId === currentUserId())).sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))[0] ?? null
  const patientId = thread?.patientId ?? (patientParam && mounted && getPatientSync(patientParam) ? patientParam : null)

  // Opening a thread marks it read.
  const openId = thread?.unread ? thread.id : null
  React.useEffect(() => {
    if (openId) updateThread(openId, { unread: false })
  }, [openId])

  // Threads started here are part of the store now, so listThreads already returns them.
  const rows = list.data ? list.data.rows : null

  const select = (t: MessageThread) => {
    url.set({ thread: t.id, patient: null }, { keepPage: true })
    setPane("thread")
  }

  const c = isDoctor ? doctorChartCopy.messages : adminCopy.pages.messages
  const newRefills = refills.data?.filter((r) => r.status === "new").length ?? 0
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={c.title} description={c.description} />

      <div className={cn(panel, "grid h-[calc(100dvh-15rem)] min-h-[560px] grid-cols-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_300px]")}>
        {/* Left: threads and refills */}
        <section aria-label="Inbox" className={cn("min-h-0 min-w-0 flex-col border-neutral-100 lg:flex lg:border-r", pane === "list" ? "flex" : "hidden")}>
          <div className="border-b border-neutral-100 px-3 pt-3">
            <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === "refills" ? "refills" : null }, { keepPage: true })}>
              <TabsList className="mb-3 h-9 w-full bg-neutral-100">
                <TabsTrigger value="threads" className="h-full flex-1 rounded-full text-caption">
                  {m.tabs.threads}
                  {list.data && <span className="text-neutral-400 tabular-nums">{list.data.total}</span>}
                </TabsTrigger>
                <TabsTrigger value="refills" className="h-full flex-1 rounded-full text-caption">
                  {m.tabs.refills}
                  {newRefills > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-amber-800 tabular-nums text-micro">{newRefills}</span>}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {tab === "threads" ? (
            <>
              <ThreadFiltersBar
                f={f}
                lockMine={isDoctor}
                facets={list.data?.facets}
                onChange={(patch) => url.set({ ...patch, size: null }, { keepPage: true })}
                onReset={() => url.set({ q: null, status: null, topic: null, priority: null, mine: null, unread: null, size: null }, { keepPage: true })}
              />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ThreadList rows={rows} loading={list.loading} error={list.error} onRetry={list.retry} selectedId={thread?.id ?? null} onSelect={select} total={list.data?.total ?? 0} onMore={() => url.set({ size: size + 20 }, { keepPage: true })} />
              </div>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RefillList
                rows={refills.data}
                selectedPatient={patientId}
                onSelectPatient={(id) => {
                  url.set({ patient: id, thread: null }, { keepPage: true })
                  setPane("thread")
                }}
              />
            </div>
          )}
        </section>

        {/* Middle: conversation */}
        <section aria-label="Conversation" className={cn("min-h-0 min-w-0 flex-col", pane === "thread" ? "flex" : pane === "list" ? "hidden lg:flex" : "hidden xl:flex")}>
          <Conversation
            thread={thread}
            patientId={patientId}
            onBack={() => setPane("list")}
            onDetails={() => setPane("context")}
            onCreated={(t) => url.set({ thread: t.id, patient: null }, { keepPage: true })}
          />
        </section>

        {/* Right: patient context */}
        <aside aria-label="Patient details" className={cn("min-h-0 min-w-0 flex-col border-neutral-100 xl:flex xl:border-l", pane === "context" ? "flex" : "hidden")}>
          <PatientPanel patientId={patientId} thread={thread} onBack={() => setPane("thread")} />
        </aside>
      </div>
    </div>
  )
}

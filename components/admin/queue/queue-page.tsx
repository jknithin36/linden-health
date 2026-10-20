"use client"

import * as React from "react"
import { LayoutGroup } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserAdd01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/lib/motion"
import { adminCopy } from "@/lib/data/admin"
import { queueCopy } from "@/lib/data/admin-queue"
import { addMinutes, NOW } from "@/lib/admin/format"
import { clinics, getClinicSync, getPatientSync, getQueue, queueColumn, queueRowsSync, waitLevel, waitMinutes, type QueueColumn } from "@/lib/admin/queries"
import { setAppointmentStatus, simulateQueueTick } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import type { Appointment, AppointmentStatus, ClinicId } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { CardSkeleton, ErrorState, notify, PageHeader, panel, StatCard } from "@/components/admin/ui"
import { AppointmentSheet } from "@/components/admin/appointment-sheet"
import { QueueCard } from "@/components/admin/queue/queue-card"
import { RoomDialog } from "@/components/admin/queue/room-dialog"
import { WalkInDialog } from "@/components/admin/queue/walk-in-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TICK_MS = 30_000
const DONE_PREVIEW = 6

const order: Record<QueueColumn, (a: Appointment) => string> = {
  arrived: (a) => a.arrivedAt ?? a.start,
  "checked-in": (a) => a.checkedInAt ?? a.arrivedAt ?? a.start,
  waiting: (a) => a.checkedInAt ?? a.arrivedAt ?? a.start,
  "with-doctor": (a) => a.roomedAt ?? a.start,
  done: (a) => a.completedAt ?? a.start,
}

const statusFor: Record<QueueColumn, AppointmentStatus> = { arrived: "arrived", "checked-in": "checked-in", waiting: "waiting", "with-doctor": "with-doctor", done: "completed" }

export function QueuePage() {
  const url = useUrlState()
  const sidebarClinic = useAdminState((s) => s.clinic)
  const urlClinic = url.get("clinic") as ClinicId
  const clinic: ClinicId = sidebarClinic !== "all" ? sidebarClinic : clinics.some((c) => c.id === urlClinic) ? urlClinic : "cleveland"
  const clinicInfo = getClinicSync(clinic)
  const reduced = useReducedMotion()

  // The clock only moves for the timers: 30 s per refresh, starting at the pinned NOW.
  const [tick, setTick] = React.useState(0)
  const now = addMinutes(NOW, Math.floor((tick * TICK_MS) / 60_000))
  const tickRef = React.useRef(0)
  const [flash, setFlash] = React.useState<string[]>([])
  const flashTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlight = React.useCallback((ids: string[]) => {
    setFlash(ids)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash([]), 2000)
  }, [])

  React.useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1
      const t = tickRef.current
      setTick(t)
      const changed = simulateQueueTick(clinic, t, addMinutes(NOW, Math.floor((t * TICK_MS) / 60_000)))
      if (changed.length) highlight(changed)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [clinic, highlight])
  React.useEffect(() => () => void (flashTimer.current && clearTimeout(flashTimer.current)), [])

  const { data, error, retry } = useQuery(() => getQueue(clinic), [clinic])
  useAdminState((s) => s.version)
  const rows = data ? queueRowsSync(clinic) : null

  const byCol = React.useMemo(() => {
    const out: Record<QueueColumn, Appointment[]> = { arrived: [], "checked-in": [], waiting: [], "with-doctor": [], done: [] }
    for (const a of rows ?? []) out[queueColumn(a.status)!].push(a)
    for (const k of Object.keys(out) as QueueColumn[]) out[k].sort((a, b) => (order[k](a) < order[k](b) ? -1 : 1) * (k === "done" ? -1 : 1))
    return out
  }, [rows])

  const waiting = [...byCol.arrived, ...byCol["checked-in"], ...byCol.waiting]
  const waits = waiting.map((a) => waitMinutes(a, now))
  const avg = waits.length ? Math.round(waits.reduce((s, n) => s + n, 0) / waits.length) : 0
  const longest = waits.length ? Math.max(...waits) : 0
  const roomsInUse = React.useMemo(() => new Set(byCol["with-doctor"].map((a) => a.room).filter((r): r is number => !!r)), [byCol])
  const avgTone = waitLevel(avg)
  const longTone = waitLevel(longest)

  const [roomFor, setRoomFor] = React.useState<Appointment | null>(null)
  const [walkIn, setWalkIn] = React.useState(false)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [dragId, setDragIdState] = React.useState<string | null>(null)
  const dragRef = React.useRef<string | null>(null)
  const setDragId = (id: string | null) => {
    dragRef.current = id
    setDragIdState(id)
  }
  const [over, setOver] = React.useState<QueueColumn | null>(null)
  const [showAllDone, setShowAllDone] = React.useState(false)

  const move = (a: Appointment, to: QueueColumn) => {
    if (queueColumn(a.status) === to) return
    if (to === "with-doctor") {
      setRoomFor(a)
      return
    }
    notify.success(setAppointmentStatus(a.id, statusFor[to], { now }))
    highlight([a.id])
  }

  const c = adminCopy.pages.queue
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <Button className="h-10 rounded-full px-4 text-caption" onClick={() => setWalkIn(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {queueCopy.addWalkIn}
          </Button>
        }
      >
        {sidebarClinic === "all" && (
          <Tabs value={clinic} onValueChange={(v) => url.set({ clinic: v === "cleveland" ? null : String(v) })}>
            <TabsList aria-label={queueCopy.clinicLabel} className="relative h-10 w-full justify-start overflow-x-auto bg-neutral-100 sm:w-fit sm:max-w-full">
              {clinics.map((cl) => (
                <TabsTrigger key={cl.id} value={cl.id} className="h-full shrink-0 rounded-full px-4 text-caption">
                  {cl.short}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </PageHeader>

      {error ? (
        <div className={panel}>
          <ErrorState onRetry={retry} />
        </div>
      ) : (
        <>
          <section aria-label="Queue summary" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {!rows ? (
              Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <StatCard label={queueCopy.stats.avgWait} value={`${avg} min`} hint={`${waiting.length} waiting`} tone={avgTone === "normal" ? undefined : avgTone} />
                <StatCard label={queueCopy.stats.longestWait} value={`${longest} min`} hint={waiting.length ? (getPatientSync(waiting[waits.indexOf(longest)].patientId)?.name ?? "") : "No one waiting"} tone={longTone === "normal" ? undefined : longTone} />
                <StatCard label={queueCopy.stats.inClinic} value={waiting.length + byCol["with-doctor"].length} hint={`${byCol.done.length} done today`} />
                <StatCard label={queueCopy.stats.rooms} value={`${roomsInUse.size} of ${clinicInfo.rooms}`} hint={clinicInfo.short} />
              </>
            )}
          </section>

          <div className="flex flex-col gap-2">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-500 text-micro">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
                {queueCopy.autoRefresh}
              </span>
              <span className="hidden sm:inline">{queueCopy.dragHint}</span>
            </p>

            <LayoutGroup>
              <div className="relative -mx-5 snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0 lg:snap-none">
                <div className="grid w-max grid-cols-[repeat(5,17rem)] gap-3 lg:w-auto lg:min-w-[1060px] lg:grid-cols-5">
                  {queueCopy.columns.map((col) => {
                    const list = byCol[col.id]
                    const shown = col.id === "done" && !showAllDone ? list.slice(0, DONE_PREVIEW) : list
                    const isOver = over === col.id
                    return (
                      <section
                        key={col.id}
                        aria-labelledby={`qcol-${col.id}`}
                        onDragOver={(e) => {
                          if (!dragRef.current && !e.dataTransfer.types.includes("text/plain")) return
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                          if (over !== col.id) setOver(col.id)
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((o) => (o === col.id ? null : o))
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const id = e.dataTransfer.getData("text/plain") || dragRef.current
                          const a = rows?.find((r) => r.id === id)
                          setOver(null)
                          setDragId(null)
                          if (a) move(a, col.id)
                        }}
                        className={cn("flex min-h-80 snap-start flex-col rounded-2xl border bg-neutral-50/70 p-2 transition-colors", isOver ? "border-neutral-400 bg-neutral-100" : "border-neutral-200/70")}
                      >
                        <header className="flex items-center justify-between px-1.5 pt-1 pb-2.5">
                          <h2 id={`qcol-${col.id}`} className="text-neutral-950 text-caption">
                            {col.label}
                          </h2>
                          <span className="rounded-full bg-white px-2 py-0.5 text-neutral-600 tabular-nums ring-1 ring-neutral-200/70 text-micro">
                            <span className="sr-only">Count: </span>
                            {rows ? list.length : "–"}
                          </span>
                        </header>
                        {!rows ? (
                          <div className="flex flex-col gap-2">
                            {Array.from({ length: 3 }, (_, i) => (
                              <Skeleton key={i} className="h-28 rounded-xl" />
                            ))}
                          </div>
                        ) : list.length === 0 ? (
                          <p className="m-1 rounded-xl border border-dashed border-neutral-200 px-3 py-6 text-center text-neutral-400 text-micro">{col.empty}</p>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {shown.map((a) => (
                              <QueueCard
                                key={a.id}
                                a={a}
                                now={now}
                                reduced={reduced}
                                highlighted={flash.includes(a.id)}
                                dragging={dragId === a.id}
                                onDragStart={setDragId}
                                onDragEnd={() => {
                                  setDragId(null)
                                  setOver(null)
                                }}
                                onMove={move}
                                onOpen={setOpenId}
                              />
                            ))}
                          </ul>
                        )}
                        {col.id === "done" && list.length > DONE_PREVIEW && (
                          <Button variant="ghost" size="sm" className="mt-2 rounded-full text-neutral-600 text-caption" onClick={() => setShowAllDone((v) => !v)}>
                            {showAllDone ? queueCopy.showFewer : queueCopy.showAllDone(list.length)}
                          </Button>
                        )}
                      </section>
                    )
                  })}
                </div>
              </div>
            </LayoutGroup>
          </div>
        </>
      )}

      <RoomDialog
        appointment={roomFor}
        rooms={clinicInfo.rooms}
        inUse={roomsInUse}
        onOpenChange={(o) => !o && setRoomFor(null)}
        onConfirm={(room) => {
          if (!roomFor) return
          notify.success(setAppointmentStatus(roomFor.id, "with-doctor", { room, now }))
          highlight([roomFor.id])
          setRoomFor(null)
        }}
      />
      <WalkInDialog open={walkIn} onOpenChange={setWalkIn} clinic={clinic} now={now} onAdded={(id) => highlight([id])} />
      <AppointmentSheet id={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  )
}

"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { fmtClock, minutesOfDay, NOW, dayOf } from "@/lib/admin/format"
import { getPatientSync, openSlots, slotLength } from "@/lib/admin/queries"
import type { Appointment, WorkBlock } from "@/lib/admin/types"
import { statusLabel } from "@/components/admin/ui"
import { Skeleton } from "@/components/ui/skeleton"
import { blockTone, hatch } from "@/components/admin/schedule/tones"

/** Visible day: 7 AM to 8 PM. */
const DAY_START = 7 * 60
const DAY_END = 20 * 60
/** Pixels per minute; a 20-minute visit is 32px, enough for two lines. */
const PX = 1.6
const HEIGHT = (DAY_END - DAY_START) * PX
const GUTTER = 64
const COL_MIN = 208

const openLabel = "Open"

const y = (m: number) => (m - DAY_START) * PX

export type GridColumn = {
  key: string
  /** Accessible name for the column. */
  label: string
  day: string
  doctorId: string
  header: React.ReactNode
  block: WorkBlock | null
  appointments: Appointment[]
  blocked: { start: number; end: number; label: string }[]
}

type Placed = { a: Appointment; start: number; end: number; lane: number; lanes: number }

/** Side-by-side lanes for overlapping visits (e.g. a cancelled slot that was rebooked). */
function placeAppointments(list: Appointment[]): Placed[] {
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start) || b.durationMin - a.durationMin)
  const out: Placed[] = []
  let cluster: Placed[] = []
  let lanesEnd: number[] = []
  let clusterEnd = -1
  const flush = () => {
    for (const p of cluster) p.lanes = lanesEnd.length
    cluster = []
    lanesEnd = []
  }
  for (const a of sorted) {
    const start = minutesOfDay(a.start)
    const end = start + a.durationMin
    if (start >= clusterEnd) flush()
    let lane = lanesEnd.findIndex((e) => e <= start)
    if (lane === -1) {
      lane = lanesEnd.length
      lanesEnd.push(end)
    } else lanesEnd[lane] = end
    const p = { a, start, end, lane, lanes: 1 }
    cluster.push(p)
    out.push(p)
    clusterEnd = Math.max(clusterEnd, end)
  }
  flush()
  return out
}

const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START + i * 60)
const hourLabel = (m: number) => (m === 12 * 60 ? "12 PM" : m > 12 * 60 ? `${m / 60 - 12} PM` : `${m / 60} AM`)

const gridLines = {
  backgroundImage: [
    `linear-gradient(to bottom, var(--color-neutral-200) 1px, transparent 1px)`,
    `linear-gradient(to bottom, var(--color-neutral-100) 1px, transparent 1px)`,
  ].join(", "),
  backgroundSize: `100% ${60 * PX}px, 100% ${15 * PX}px`,
}

function AppointmentBlock({ p, onOpen }: { p: Placed; onOpen: (id: string) => void }) {
  const { a } = p
  const patient = getPatientSync(a.patientId)
  const t = blockTone(a.status)
  const h = (p.end - p.start) * PX
  const status = statusLabel("appointment", a.status)
  const struck = a.status === "cancelled" || a.status === "late-cancel"
  const width = 100 / p.lanes
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(a.id)
      }}
      onMouseMove={(e) => e.stopPropagation()}
      aria-label={`${fmtClock(p.start)}, ${patient?.name}, ${status}, ${a.reason}${a.type === "video" ? ", video visit" : ""}`}
      title={`${fmtClock(p.start)}–${fmtClock(p.end)} · ${patient?.name} · ${status} · ${a.reason}`}
      className={cn(
        "group/block absolute z-[2] flex overflow-hidden rounded-md border text-left outline-none transition-[border-color,box-shadow] focus-visible:z-[5] focus-visible:ring-2 focus-visible:ring-neutral-950",
        t.box,
        struck && "z-[1]"
      )}
      style={{ top: y(p.start) + 1, height: Math.max(h - 2, 14), left: `calc(${p.lane * width}% + 3px)`, width: `calc(${width}% - 6px)` }}
    >
      <span aria-hidden="true" className={cn("w-[3px] shrink-0", t.accent)} />
      <span className="flex min-w-0 flex-1 flex-col justify-start px-1.5 py-[2px]">
        <span className="flex min-w-0 items-center gap-1 text-micro" style={{ lineHeight: "13px" }}>
          <span className={cn("shrink-0 tabular-nums", t.meta)}>{fmtClock(p.start).replace(" AM", "").replace(" PM", "")}</span>
          <span className={cn("min-w-0 truncate font-emphasis", struck && "line-through")}>{patient?.name}</span>
          {a.type === "video" && <HugeiconsIcon icon={Video01Icon} strokeWidth={2} aria-hidden="true" className="ml-auto size-3 shrink-0 opacity-70" />}
        </span>
        {h >= 26 && (
          <span className={cn("block truncate text-micro", t.meta)} style={{ lineHeight: "13px" }}>
            {status} · {a.reason}
          </span>
        )}
      </span>
    </button>
  )
}

function Column({
  col,
  mobileHidden,
  hover,
  setHover,
  onOpen,
  onSlot,
  showOpen,
}: {
  col: GridColumn
  mobileHidden: boolean
  hover: number | null
  setHover: (t: number | null) => void
  onOpen: (id: string) => void
  onSlot: (col: GridColumn, minutes: number) => void
  showOpen?: boolean
}) {
  const placed = React.useMemo(() => placeAppointments(col.appointments), [col.appointments])
  const b = col.block
  // Slot length follows the work block (Dr. Chen's Monday uses 30-minute visits).
  const SLOT = slotLength(b)
  const open = React.useMemo(() => {
    const free = openSlots(col.doctorId, col.day).filter((t) => !col.blocked.some((x) => t < x.end && t + SLOT > x.start))
    return new Set(free)
  }, [col.doctorId, col.day, col.blocked, SLOT])

  const slotAt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!b) return null
    const rect = e.currentTarget.getBoundingClientRect()
    const m = DAY_START + (e.clientY - rect.top) / PX
    if (m < b.start || m >= b.end) return null
    const t = b.start + Math.floor((m - b.start) / SLOT) * SLOT
    return open.has(t) ? t : null
  }

  return (
    <div
      role="group"
      aria-label={col.label}
      className={cn("relative min-w-0 flex-1 border-l border-neutral-100 md:min-w-(--col-min)", mobileHidden && "max-md:hidden", hover !== null && "cursor-pointer")}
      style={{ height: HEIGHT }}
      onMouseMove={(e) => {
        const t = slotAt(e)
        if (t !== hover) setHover(t)
      }}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        const t = slotAt(e)
        if (t !== null) onSlot(col, t)
      }}
    >
      {/* Outside working hours */}
      {b ? (
        <>
          {b.start > DAY_START && <div aria-hidden="true" className="absolute inset-x-0 top-0 bg-neutral-100/70" style={{ height: y(b.start) }} />}
          {b.end < DAY_END && <div aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-neutral-100/70" style={{ top: y(b.end) }} />}
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-neutral-100/70" />
      )}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={gridLines} />

      {/* Blocked time */}
      {col.blocked.map((x) => (
        <div
          key={`${x.label}-${x.start}`}
          className="absolute inset-x-[3px] z-[1] flex items-start overflow-hidden rounded-md border border-neutral-200 bg-white px-2 py-[3px]"
          style={{ top: y(x.start) + 1, height: (x.end - x.start) * PX - 2, ...hatch }}
        >
          <span className="rounded bg-white/90 px-1 text-neutral-500 text-micro leading-[13px]">
            {x.label} · {fmtClock(x.start).replace(/ [AP]M$/, "")}–{fmtClock(x.end)}
          </span>
        </div>
      ))}

      {/* Hovered open slot */}
      {hover !== null && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[3px] z-[3] flex items-center gap-1 rounded-md border border-dashed border-neutral-400 bg-white/70 px-2 text-neutral-700 text-micro" style={{ top: y(hover) + 1, height: SLOT * PX - 2 }}>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3" />
          {fmtClock(hover)}
        </div>
      )}

      {/* Open slots, drawn for a single provider's own schedule */}
      {showOpen &&
        [...open].map((t) =>
          // Skip the box where a (cancelled) visit already sits, so blocks never overlap.
          t === hover || placed.some((p) => p.start < t + SLOT && p.end > t) ? null : (
            <div key={`open-${t}`} className="pointer-events-none absolute inset-x-[3px] z-[1] flex items-center rounded-md border border-dashed border-emerald-300 bg-emerald-50/60 px-2 text-emerald-800 text-micro" style={{ top: y(t) + 1, height: SLOT * PX - 2 }}>
              {openLabel} · {fmtClock(t)}
            </div>
          )
        )}

      {placed.map((p) => (
        <AppointmentBlock key={p.a.id} p={p} onOpen={onOpen} />
      ))}
    </div>
  )
}

/**
 * The scheduling grid: a sticky header row, a sticky time gutter, 15-minute rules, and one
 * column per provider (day view) or per day (doctor view). Phones show one column at a time.
 */
export function TimeGrid({
  columns,
  mobileKey,
  onOpen,
  onSlot,
  refreshing,
  label,
  showOpen,
}: {
  /** Draw open slots as labeled boxes (a doctor's own schedule), not only on hover. */
  showOpen?: boolean
  columns: GridColumn[]
  mobileKey?: string
  onOpen: (id: string) => void
  onSlot: (col: GridColumn, minutes: number) => void
  refreshing?: boolean
  label: string
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const [hover, setHover] = React.useState<{ key: string; t: number } | null>(null)
  const nowMin = minutesOfDay(NOW)
  const nowCols = columns.filter((c) => c.day === dayOf(NOW))
  const showNow = nowCols.length > 0 && nowMin >= DAY_START && nowMin <= DAY_END
  const shownKey = mobileKey && columns.some((c) => c.key === mobileKey) ? mobileKey : columns[0]?.key
  const allNow = nowCols.length === columns.length

  // Bring "now" into view on today's schedule.
  React.useEffect(() => {
    const el = scroller.current
    if (el && showNow) el.scrollTop = Math.max(0, y(nowMin) - 160)
  }, [showNow, nowMin])

  const style = { "--col-min": `${COL_MIN}px`, "--grid-w": `${GUTTER + columns.length * COL_MIN}px` } as React.CSSProperties

  return (
    <div ref={scroller} role="region" aria-label={label} tabIndex={0} className={cn("relative max-h-[calc(100dvh-20rem)] min-h-[28rem] overflow-auto overscroll-contain outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset", refreshing && "opacity-70")}>
      <div className="w-full md:min-w-(--grid-w)" style={style}>
        {/* Header */}
        <div className="sticky top-0 z-20 flex border-b border-neutral-200/70 bg-white">
          <div className="sticky left-0 z-30 shrink-0 bg-white" style={{ width: GUTTER }} />
          {columns.map((c) => (
            <div key={c.key} className={cn("min-w-0 flex-1 border-l border-neutral-100 md:min-w-(--col-min)", c.key !== shownKey && "max-md:hidden")}>
              {c.header}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="relative flex">
          <div className="sticky left-0 z-10 shrink-0 border-r border-neutral-100 bg-white" style={{ width: GUTTER, height: HEIGHT }} aria-hidden="true">
            {hours.map((m) => (
              <span key={m} className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-neutral-400 tabular-nums text-micro first:translate-y-0.5" style={{ top: y(m) }}>
                {m === DAY_END ? "" : hourLabel(m)}
              </span>
            ))}
            {showNow && (
              <span className="absolute right-1 z-10 -translate-y-1/2 rounded-full bg-red-600 px-1.5 py-px text-white tabular-nums text-micro leading-4" style={{ top: y(nowMin) }}>
                {fmtClock(nowMin).replace(" PM", "").replace(" AM", "")}
              </span>
            )}
          </div>

          {columns.map((c) => (
            <Column
              key={c.key}
              col={c}
              mobileHidden={c.key !== shownKey}
              hover={hover?.key === c.key ? hover.t : null}
              setHover={(t) => setHover(t === null ? null : { key: c.key, t })}
              onOpen={onOpen}
              onSlot={onSlot}
              showOpen={showOpen}
            />
          ))}

          {/* Now line */}
          {showNow && allNow && (
            <div aria-hidden="true" className="pointer-events-none absolute right-0 z-[4] h-0.5 bg-red-500" style={{ top: y(nowMin) - 1, left: GUTTER }}>
              <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-red-500" />
            </div>
          )}
          {showNow && !allNow && nowCols.map((c) => <NowInColumn key={c.key} index={columns.indexOf(c)} count={columns.length} hidden={c.key !== shownKey} top={y(nowMin) - 1} />)}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {showNow ? `Current time ${fmtClock(nowMin)}` : ""}
      </p>
    </div>
  )
}

/** In the doctor (7-day) view, the now line crosses only today's column. */
function NowInColumn({ index, count, top, hidden }: { index: number; count: number; top: number; hidden: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-[4] h-0.5 bg-red-500", hidden && "max-md:hidden")}
      style={{ top, left: `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${index / count})`, width: `calc((100% - ${GUTTER}px) / ${count})` }}
    >
      <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-red-500" />
    </div>
  )
}

export function TimeGridSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div aria-hidden="true" className="flex max-h-[calc(100dvh-20rem)] min-h-[28rem] overflow-hidden">
      <div className="shrink-0 border-r border-neutral-100" style={{ width: GUTTER }} />
      {Array.from({ length: cols }, (_, i) => (
        <div key={i} className={cn("flex min-w-0 flex-1 flex-col gap-3 border-l border-neutral-100 p-3 md:min-w-44", i > 0 && "max-md:hidden")}>
          <div className="flex items-center gap-2 pb-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-2.5 w-16 rounded-full" />
            </div>
          </div>
          {[32, 32, 64, 32, 48, 32].map((h, j) => (
            <Skeleton key={j} className="w-full rounded-md" style={{ height: h, opacity: 1 - j * 0.12, marginTop: (i + j) % 3 === 0 ? 24 : 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

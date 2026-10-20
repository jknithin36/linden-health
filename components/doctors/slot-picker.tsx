"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { chip, focusRing } from "@/lib/styles"
import { timeOf, type AvailabilityDay } from "@/lib/data/availability"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type SlotPickerProps = {
  days: AvailabilityDay[]
  value: string | null
  onValueChange: (slot: string) => void
  dayLabel: string
  timeLabel: string
  openLabel: (n: number) => string
  /** Tighter layout for narrow side panels. */
  compact?: boolean
}

/** Day strip ("Today · 3 open") + times for the selected day. Shared by doctor profiles and /book. */
export function SlotPicker({ days, value, onValueChange, dayLabel, timeLabel, openLabel, compact = false }: SlotPickerProps) {
  const initialDay = days.find((d) => d.slots.some((s) => s.value === value))?.id ?? days.find((d) => d.slots.length)?.id ?? days[0]?.id
  const [dayId, setDayId] = React.useState(initialDay)
  const day = days.find((d) => d.id === dayId) ?? days[0]
  const ids = { day: React.useId(), time: React.useId() }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p id={ids.day} className="mb-2 text-neutral-600 text-caption">
          {dayLabel}
        </p>
        <ToggleGroup
          aria-labelledby={ids.day}
          value={dayId ? [dayId] : []}
          onValueChange={(v: string[]) => {
            const next = v[v.length - 1]
            if (next) setDayId(next)
          }}
          className={cn(
            "gap-1.5",
            compact ? "grid w-full grid-cols-5" : "-mx-1 w-auto flex-nowrap overflow-x-auto overflow-y-hidden px-1 pb-1 scrollbar-none"
          )}
        >
          {days.map((d) => (
            <ToggleGroupItem
              key={d.id}
              value={d.id}
              disabled={d.slots.length === 0}
              className={cn(
                "group/day h-auto shrink-0 flex-col gap-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-950",
                "hover:border-neutral-400 hover:bg-white aria-pressed:border-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white",
                compact ? "min-w-0 px-1" : "min-w-20",
                focusRing.dark
              )}
            >
              <span className="text-caption">{d.label}</span>
              <span className="text-neutral-500 group-aria-pressed/day:text-white/60 text-micro">
                {openLabel(d.slots.length)}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div>
        <p id={ids.time} className="mb-2 text-neutral-600 text-caption">
          {timeLabel}
        </p>
        <ToggleGroup
          aria-labelledby={ids.time}
          value={value && day?.slots.some((s) => s.value === value) ? [value] : []}
          onValueChange={(v: string[]) => {
            const next = v[v.length - 1]
            if (next) onValueChange(next)
          }}
          className={cn("grid w-full gap-1.5", compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-5")}
        >
          {day?.slots.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value} className={cn(chip, "h-10 w-full px-2 text-caption")}>
              {timeOf(s.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type FilterOption = { value: string; label: string }

type FilterSelectProps = {
  /** Accessible name when there's no visible label. */
  ariaLabel?: string
  value: string
  onValueChange: (value: string) => void
  options: FilterOption[]
  className?: string
}

/**
 * Pill dropdown for filters (shadcn Select), styled to match the plan picker:
 * one clean border that darkens on focus, the list drops below and lines up with
 * the trigger, a soft fade + 4px rise, and options in the site's type.
 */
export function FilterSelect({ ariaLabel, value, onValueChange, options, className }: FilterSelectProps) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(v: string | null) => {
        if (v !== null) onValueChange(v)
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-11 w-full gap-3 rounded-full border-neutral-200 bg-white pr-3.5 pl-4 text-neutral-800 shadow-none sm:w-auto sm:min-w-44",
          "hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 data-popup-open:border-neutral-950",
          "data-[size=default]:h-11 [&_svg]:text-neutral-400 text-caption",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        sideOffset={8}
        className={cn(
          "min-w-(--anchor-width) rounded-2xl bg-white p-1.5 ring-neutral-950/[0.06]",
          "shadow-[0_18px_40px_-16px_rgba(0,0,0,0.22),0_2px_6px_-2px_rgba(0,0,0,0.06)]",
          "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:zoom-in-100 data-closed:zoom-out-100",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
        )}
      >
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className={cn(
              "rounded-lg px-3 py-2.5 text-neutral-800 transition-colors duration-100",
              "focus:bg-neutral-100 focus:text-neutral-950 data-selected:text-neutral-950 text-caption"
            )}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

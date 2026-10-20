"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

type PlanComboboxProps = {
  id: string
  items: string[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder: string
  emptyText: string
}

/**
 * Searchable plan picker, styled to match the site rather than shadcn's defaults:
 * - one clean border that turns dark on focus (no grey double ring),
 * - the list is anchored to the whole field, so its edges line up,
 * - a soft fade + 4px rise instead of the default zoom "pop",
 * - options in the site's body type.
 */
export function PlanCombobox({ id, items, value, onValueChange, placeholder, emptyText }: PlanComboboxProps) {
  const anchorRef = React.useRef<HTMLDivElement>(null)

  return (
    <Combobox items={items} value={value} onValueChange={onValueChange}>
      <div ref={anchorRef} className="w-full">
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full rounded-xl border-neutral-200 bg-white px-1.5 shadow-none transition-colors",
            "hover:border-neutral-300",
            "has-[[data-slot=input-group-control]:focus-visible]:border-neutral-950 has-[[data-slot=input-group-control]:focus-visible]:ring-0",
            "[&_input]:px-2.5 [&_input]:text-body [&_input]:placeholder:text-neutral-400",
            "[&_[data-slot=input-group-button]]:text-neutral-400"
          )}
        />
      </div>
      <ComboboxContent
        anchor={anchorRef}
        sideOffset={8}
        className={cn(
          "min-w-(--anchor-width) rounded-2xl bg-white ring-neutral-950/[0.06]",
          "shadow-[0_18px_40px_-16px_rgba(0,0,0,0.22),0_2px_6px_-2px_rgba(0,0,0,0.06)]",
          "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:zoom-in-100 data-closed:zoom-out-100",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
        )}
      >
        <ComboboxEmpty className="py-4 text-neutral-500 text-caption">{emptyText}</ComboboxEmpty>
        <ComboboxList className="max-h-[min(19rem,var(--available-height))] p-1.5">
          {(item: string) => (
            <ComboboxItem
              key={item}
              value={item}
              className={cn(
                "rounded-lg px-3 py-2.5 text-neutral-800 transition-colors duration-100",
                "data-highlighted:bg-neutral-100 data-highlighted:text-neutral-950 data-selected:text-neutral-950 text-body"
              )}
            >
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { chip } from "@/lib/styles"
import { family, type PersonId } from "@/lib/data/portal"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PersonAvatar } from "@/components/portal/person-avatar"

export type PersonFilterValue = "all" | PersonId

/** "All family · Sarah · David · Lily · Noah" chips with photos. Scrolls sideways on phones: ToggleGroup is
 * `w-fit`, so the max width keeps the row inside the page (it scrolls) instead of widening the page. */
export function PersonFilter({
  value,
  onValueChange,
  label,
  allLabel,
  className,
}: {
  value: PersonFilterValue
  onValueChange: (value: PersonFilterValue) => void
  label: string
  allLabel: string
  className?: string
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(v: string[]) => {
        const next = v[v.length - 1]
        if (next) onValueChange(next as PersonFilterValue)
      }}
      className={cn("-mx-5 flex max-w-[calc(100%+2.5rem)] justify-start gap-2 overflow-x-auto overflow-y-hidden px-5 pb-1 md:mx-0 md:max-w-full md:px-0", className)}
    >
      <ToggleGroupItem value="all" className={cn(chip, "h-9 px-4 text-caption")}>
        {allLabel}
      </ToggleGroupItem>
      {family.map((m) => (
        <ToggleGroupItem key={m.id} value={m.id} className={cn(chip, "h-9 gap-2 pr-4 pl-1 text-caption")}>
          <PersonAvatar person={m} className="size-7" />
          {m.firstName}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Small segmented control ("All · In person · Video") on a grey track. */
export function SegmentedFilter<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T
  onValueChange: (value: T) => void
  options: { id: T; label: string }[]
  label: string
  className?: string
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(v: string[]) => {
        const next = v[v.length - 1]
        if (next) onValueChange(next as T)
      }}
      className={cn("flex w-fit gap-0.5 rounded-full bg-neutral-100 p-[3px]", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.id}
          value={o.id}
          className="h-8 rounded-full px-3.5 whitespace-nowrap text-neutral-600 text-caption hover:bg-transparent hover:text-neutral-950 aria-pressed:bg-white aria-pressed:text-neutral-950 aria-pressed:shadow-sm"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

import { cn } from "@/lib/utils"
import { insuranceCopy } from "@/lib/data/insurance"

type PriceListProps = {
  items: { label: string; value: string }[]
  className?: string
}

/** Menu-style list: label, dotted leader, price. */
export function PriceList({ items, className }: PriceListProps) {
  return (
    <dl aria-label={insuranceCopy.pricesCaption} className={cn("flex flex-col", className)}>
      {items.map((row) => (
        <div key={row.label} className="flex items-baseline gap-3 py-2.5 text-neutral-950 text-body">
          <dt>{row.label}</dt>
          <span aria-hidden="true" className="flex-1 -translate-y-[3px] border-b border-dotted border-neutral-300" />
          <dd className="tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

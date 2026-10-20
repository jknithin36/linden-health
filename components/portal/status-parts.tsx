import { cn } from "@/lib/utils"
import { panel } from "@/components/portal/styles"

/** Half-filled amber dot: "in progress / needs you" next to a status label. */
export function HalfDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-3 shrink-0 rounded-full border-[1.5px] border-amber-500 bg-linear-to-r from-amber-500 from-50% to-transparent to-50%", className)}
    />
  )
}

/** Empty list or tab: a quiet centered message, optionally with an action under it. */
export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(panel, "flex flex-col items-center px-6 py-14 text-center text-pretty text-neutral-500 text-body", className)}>{children}</div>
}

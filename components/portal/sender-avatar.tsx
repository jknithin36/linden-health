import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Doctor02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/data/messages"
import { LindenMark } from "@/components/site/icons"

/** Who a conversation is with: their photo, the Linden mark (billing, front desk), a clinician icon (nurses), or initials. */
export function SenderAvatar({ c, className }: { c: Pick<Conversation, "image" | "brand" | "clinician" | "initials">; className?: string }) {
  const base = cn("grid size-10 shrink-0 place-items-center overflow-hidden rounded-full", className)
  if (c.image) return <Image src={c.image} alt="" width={80} height={96} className={cn(base, "bg-neutral-100 object-cover object-top")} />
  if (c.brand)
    return (
      <span aria-hidden="true" className={cn(base, "bg-neutral-100")}>
        <LindenMark className="size-5" />
      </span>
    )
  if (c.clinician)
    return (
      <span aria-hidden="true" className={cn(base, "bg-sky-50 text-sky-700")}>
        <HugeiconsIcon icon={Doctor02Icon} strokeWidth={1.7} className="size-[18px]" />
      </span>
    )
  return (
    <span aria-hidden="true" className={cn(base, "bg-neutral-100 text-neutral-700 text-caption")}>
      {c.initials}
    </span>
  )
}

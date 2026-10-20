import Image from "next/image"

import { cn } from "@/lib/utils"
import type { FamilyMember, PersonId } from "@/lib/data/portal"

/** One soft colour per family member, so the same person reads the same everywhere in the portal. */
const personTone: Record<PersonId, string> = {
  sarah: "bg-violet-100 text-violet-800",
  david: "bg-sky-100 text-sky-800",
  lily: "bg-rose-100 text-rose-800",
  noah: "bg-amber-100 text-amber-800",
}

/** A family member's photo, on their tint so it never flashes grey while loading. */
export function PersonAvatar({ person, className }: { person: FamilyMember; className?: string }) {
  return (
    <Image
      src={person.avatar}
      alt=""
      width={72}
      height={72}
      className={cn("size-9 shrink-0 rounded-full object-cover", personTone[person.id], className)}
    />
  )
}


"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { family, overviewCopy } from "@/lib/data/portal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const c = overviewCopy.family

/** Everyone on the account as overlapping photos (name on hover), plus a button to add someone. */
export function FamilyStrip() {
  return (
    <nav aria-label={c.label} className="flex items-center">
      <ul className="flex -space-x-2.5">
        {family.map((m) => {
          const label = c.tooltip(m.name, c.relation[m.relation], m.age)
          return (
            <li key={m.id} className="relative hover:z-10 focus-within:z-10">
              <Tooltip>
                <TooltipTrigger
                  render={<Link href={c.href(m.id)} aria-label={label} />}
                  className={cn("block rounded-full transition-transform duration-200 hover:-translate-y-0.5", focusRing.dark)}
                >
                  <Avatar size="lg" className="ring-2 ring-white after:hidden">
                    <AvatarImage src={m.avatar} alt="" />
                    <AvatarFallback className="text-caption">{m.firstName[0]}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  {label}
                </TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>
      <Tooltip>
        <TooltipTrigger
          render={<Link href={c.add.href} aria-label={c.add.label} />}
          className={cn(
            "ml-2 grid size-10 place-items-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950",
            focusRing.dark
          )}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.8} className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          {c.add.label}
        </TooltipContent>
      </Tooltip>
    </nav>
  )
}

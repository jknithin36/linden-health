"use client"

import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, Files01Icon, Wallet01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { helpCards, type HelpCard } from "@/lib/data/insurance"

const ICONS: Record<HelpCard["id"], typeof Wallet01Icon> = {
  "self-pay": Wallet01Icon,
  paperwork: Files01Icon,
  hsa: CreditCardIcon,
}

/** The three insurance reassurances, as icon + two lines each. */
export function HelpPoints({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.ul
      variants={stagger(0.08)}
      {...revealOnView(reduceMotion, 0.3)}
      className={cn("grid gap-8 border-t border-neutral-200 pt-10 md:grid-cols-3", className)}
    >
      {helpCards.map((help) => (
        <motion.li key={help.id} variants={fadeUp} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-neutral-950 ring-1 ring-neutral-950/[0.06]">
            <HugeiconsIcon aria-hidden="true" icon={ICONS[help.id]} strokeWidth={1.6} className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-neutral-950 text-body">{help.title}</h3>
            <p className="mt-1 text-neutral-500 text-body">{help.body}</p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  )
}

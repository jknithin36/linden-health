"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { fadeUp, revealOnView, useReducedMotion } from "@/lib/motion"

type SectionHeaderProps = {
  /** Used for the section's aria-labelledby. */
  id: string
  label?: React.ReactNode
  heading: string
  intro?: string
  align?: "center" | "start"
  /** Use 1 when the section opens its own page. */
  level?: 1 | 2
  className?: string
}

/** The small label / heading / intro block that opens every section. */
export function SectionHeader({ id, label, heading, intro, align = "center", level = 2, className }: SectionHeaderProps) {
  const reduceMotion = useReducedMotion()
  const Heading = level === 1 ? "h1" : "h2"

  return (
    <motion.div
      variants={fadeUp}
      {...revealOnView(reduceMotion, 0.6)}
      className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl", className)}
    >
      {label && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-neutral-500",
            align === "center" && "justify-center",
            "text-caption"
          )}
        >
          {label}
        </div>
      )}
      <Heading id={id} className={cn("text-neutral-950", label && "mt-3", level === 1 ? "text-display" : "text-heading")}>
        {heading}
      </Heading>
      {intro && (
        <p className={cn("mt-4 text-neutral-500", align === "center" && "mx-auto", "max-w-2xl text-lead")}>
          {intro}
        </p>
      )}
    </motion.div>
  )
}

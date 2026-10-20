"use client"

import Link from "next/link"
import { motion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"
import { EASE, fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { focusRing, sectionY } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { selfPaySummary } from "@/lib/data/insurance"
import { Button } from "@/components/ui/button"

/** Rows slide in a touch from below and fade, one after another. */
const row: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

/** Centred heading, striped table of prices and reassurances, one CTA. */
export function SelfPay() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="self-pay-prices" aria-labelledby="self-pay-heading" className={cn("scroll-mt-24", sectionY)}>
      <div className="mx-auto flex max-w-[800px] flex-col items-center px-6 text-center">
        <motion.div variants={stagger(0.08)} {...revealOnView(reduceMotion, 0.5)} className="flex flex-col items-center">
          <motion.p variants={fadeUp} className="text-neutral-950 text-body">
            {selfPaySummary.eyebrow}
          </motion.p>
          <motion.h2 variants={fadeUp} id="self-pay-heading" className="mt-6 text-neutral-950 text-display">
            {selfPaySummary.heading[0]}
            <br />
            {selfPaySummary.heading[1]}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 max-w-md text-neutral-500 text-body">
            {selfPaySummary.intro}
          </motion.p>
        </motion.div>

        <motion.dl
          variants={stagger(0.06, 0.1)}
          {...revealOnView(reduceMotion, 0.25)}
          className="mt-12 w-full text-left"
        >
          {selfPaySummary.rows.map((r) => (
            <motion.div
              key={r.label}
              variants={row}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-lg px-4 py-3.5 odd:bg-neutral-50",
                "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
              )}
            >
              <dt className="text-neutral-950 text-body">{r.label}</dt>
              <dd className={cn(r.price ? "text-right text-neutral-950 tabular-nums sm:text-left" : "col-span-2 text-neutral-500 sm:col-span-1", "text-body")}>
                {r.detail}
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        <motion.div variants={fadeUp} {...revealOnView(reduceMotion, 0.5)} className="mt-10 flex flex-col items-center gap-4">
          <Button size="2xl" nativeButton={false} render={<Link href={selfPaySummary.cta.href} />}>
            {selfPaySummary.cta.label}
          </Button>
          <a
            href={`tel:${site.billingPhone.tel}`}
            className={cn("rounded-sm text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline text-caption", focusRing.dark)}
          >
            {selfPaySummary.contact(site.billingPhone.display, site.billingHours)}
          </a>
        </motion.div>
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { container, focusRing, headerGap, portraitBackdrop, sectionY } from "@/lib/styles"
import { doctors, doctorsSpotlight, doctorsCopy, type Doctor } from "@/lib/data/doctors"
import { institutionByName } from "@/lib/data/trust"
import { Button } from "@/components/ui/button"
import { InstitutionMark } from "@/components/home/institution-mark"
import { Media } from "@/components/site/media"
import { SectionHeader } from "@/components/site/section-header"

const featured = doctors.filter((d) => d.featured)

/** Lines the scroller's first card up with the page container, while letting cards bleed off the right edge. */
const bleedLeft = "pl-[max(1.5rem,calc((100vw-77.5rem)/2+1.5rem))]"

function SpotlightCard({ doctor }: { doctor: Doctor }) {
  const institution = institutionByName(doctor.trainedAt)

  return (
    <motion.li
      variants={fadeUp}
      className="relative mr-6 w-[min(85vw,640px)] shrink-0 snap-start border-r border-neutral-200 pr-6 last:mr-0 last:border-r-0 sm:mr-8 sm:pr-8"
    >
      <article className="grid gap-6 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] sm:gap-8">
        <Media
          image={doctor.image}
          alt={doctorsCopy.portraitAlt(doctor.name)}
          placeholder={doctor.placeholder}
          sizes="(min-width: 640px) 280px, 85vw"
          className={cn("aspect-5/6 rounded-[20px]", portraitBackdrop)}
          imageClassName="mix-blend-multiply"
        />

        <div className="flex flex-col">
          {institution && (
            <InstitutionMark institution={institution} className="text-neutral-400" />
          )}

          <h3 className="mt-6 text-neutral-950 sm:mt-8 text-title">
            {doctor.name}, {doctor.credentials}
          </h3>
          <p className="mt-1 text-neutral-500 text-body">
            {doctorsSpotlight.role(doctor.specialty, doctor.yearsExperience)}
          </p>

          {doctor.bio && <p className="mt-5 text-neutral-900 text-body">{doctor.bio}</p>}

          <Link
            href={doctor.href}
            className={cn(
              "mt-4 self-start rounded-sm text-neutral-950 underline underline-offset-4 hover:no-underline text-body",
              focusRing.dark
            )}
          >
            {doctorsSpotlight.learnMore}
            <span className="sr-only">: {doctor.name}</span>
          </Link>
        </div>
      </article>
    </motion.li>
  )
}

/** Homepage: three featured doctors in a horizontal strip, linking to the full directory. */
export function DoctorSpotlight() {
  const reduceMotion = useReducedMotion()

  return (
    // `relative` makes the section the containing block, so hidden (sr-only) text in
    // off-screen cards is clipped instead of widening the page.
    <section aria-labelledby="doctors-heading" className={cn("relative overflow-hidden", sectionY)}>
      <div className={cn(container, "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between")}>
        <SectionHeader id="doctors-heading" align="start" heading={doctorsSpotlight.heading} />
        <Button
          variant="outline"
          size="xl"
          nativeButton={false}
          render={<Link href={doctorsSpotlight.seeAll.href} />}
          className="shrink-0 self-start sm:self-auto"
        >
          {doctorsSpotlight.seeAll.label}
          <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" />
        </Button>
      </div>

      <motion.ul
        variants={stagger(0.1)}
        {...revealOnView(reduceMotion, 0.2)}
        aria-label={doctorsSpotlight.scrollerLabel}
        tabIndex={0}
        className={cn(
          headerGap,
          bleedLeft,
          "flex snap-x snap-mandatory scroll-pl-[max(1.5rem,calc((100vw-77.5rem)/2+1.5rem))] overflow-x-auto overflow-y-hidden overscroll-x-contain pr-6 scrollbar-none",
          focusRing.dark
        )}
      >
        {featured.map((doctor) => (
          <SpotlightCard key={doctor.id} doctor={doctor} />
        ))}
      </motion.ul>
    </section>
  )
}

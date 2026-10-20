"use client"

import Image from "next/image"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { fadeIn, fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { portraitBackdrop, sectionY } from "@/lib/styles"
import {
  trustDoctors,
  trustHeadline,
  trustInstitutions,
  trustLabel,
  type TrustDoctor,
  type TrustInstitution,
} from "@/lib/data/trust"
import { InstitutionMark } from "@/components/home/institution-mark"

const markColor = "text-neutral-400 transition-colors duration-200 hover:text-neutral-600"

function DoctorAvatar({ doctor }: { doctor: TrustDoctor }) {
  return (
    <li className="-ml-2.5 first:ml-0">
      {doctor.avatar ? (
        <span className={cn("block size-10 overflow-hidden rounded-full ring-2 ring-white", portraitBackdrop)}>
          <Image
            src={doctor.avatar}
            alt={doctor.name}
            width={80}
            height={80}
            className="size-full object-cover object-[50%_22%] mix-blend-multiply"
          />
        </span>
      ) : (
        <span
          role="img"
          aria-label={doctor.name}
          style={{ backgroundImage: doctor.gradient }}
          className="block size-10 rounded-full ring-2 ring-white"
        />
      )}
    </li>
  )
}

/** Mobile: slow seamless marquee. The second copy is decorative. */
function MarksMarquee({ institutions }: { institutions: TrustInstitution[] }) {
  const copy = (decorative: boolean) => (
    <ul
      aria-hidden={decorative || undefined}
      className={cn(
        "flex shrink-0 items-center gap-12 pr-12",
        decorative && "motion-reduce:hidden"
      )}
    >
      {institutions.map((institution) => (
        <li key={institution.id}>
          <InstitutionMark
            institution={institution}
            className={markColor}
          />
        </li>
      ))}
    </ul>
  )

  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] sm:hidden">
      <div className="flex w-max animate-marquee motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  )
}

export function TrustStrip() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      aria-label={trustLabel}
      variants={stagger(0.12)}
      {...revealOnView(reduceMotion, 0.4)}
      className={cn("bg-linear-to-b from-neutral-50 to-white", sectionY)}
    >
      <div className="mx-auto max-w-[1100px] px-6">
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:text-left"
        >
          <ul className="flex items-center">
            {trustDoctors.map((doctor) => (
              <DoctorAvatar key={doctor.id} doctor={doctor} />
            ))}
          </ul>
          <p className="text-neutral-900 text-lead">{trustHeadline}</p>
        </motion.div>

        <motion.div variants={stagger(0.08, 0.1)} className="mt-10">
          {/* Tablet: wrapped, centred rows. Desktop: one row, spread out. */}
          <ul className="hidden flex-wrap items-center justify-center gap-x-14 gap-y-8 sm:flex lg:flex-nowrap lg:justify-between lg:gap-0">
            {trustInstitutions.map((institution) => (
              <motion.li key={institution.id} variants={fadeIn}>
                <InstitutionMark institution={institution} className={markColor} />
              </motion.li>
            ))}
          </ul>

          <motion.div variants={fadeIn}>
            <MarksMarquee institutions={trustInstitutions} />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}

"use client"

import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Location01Icon,
  Stethoscope02Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { container, glass as glassSurface, headerGap, sectionY } from "@/lib/styles"
import { Media } from "@/components/site/media"
import { SectionHeader } from "@/components/site/section-header"
import {
  howItWorksHeading,
  howItWorksIntro,
  howItWorksSteps,
  type HowItWorksStep,
  type StepPreview,
} from "@/lib/data/how-it-works"

const glass = cn(glassSurface, "rounded-2xl")

function Preview({ preview }: { preview: StepPreview }) {
  switch (preview.kind) {
    case "appointment":
      return (
        <div className={cn(glass, "flex items-center gap-3 p-3")}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
            <HugeiconsIcon aria-hidden="true" icon={Location01Icon} strokeWidth={1.8} className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption">{preview.title}</span>
            <span className="text-white/65 text-micro">
              {preview.when} · {preview.where}
            </span>
          </span>
          <HugeiconsIcon aria-hidden="true"
            icon={CheckmarkCircle02Icon}
            strokeWidth={1.8}
            className="size-5 shrink-0 text-white/90"
          />
        </div>
      )

    case "doctor":
      return (
        <div className={cn(glass, "flex items-center gap-3 p-3")}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
            <HugeiconsIcon aria-hidden="true" icon={Stethoscope02Icon} strokeWidth={1.8} className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption">{preview.name}</span>
            <span className="text-white/65 text-micro">
              {preview.role} · {preview.note}
            </span>
          </span>
        </div>
      )

    case "plan":
      return (
        <div className={cn(glass, "flex flex-col gap-1 p-2")}>
          <span className="px-2 pt-1 pb-1 text-white/65 text-micro">
            {preview.title}
          </span>
          {preview.items.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-2 py-2"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-white/70" />
              <span className="flex min-w-0 flex-col">
                <span className="text-caption">{item.label}</span>
                <span className="text-white/65 text-micro">{item.detail}</span>
              </span>
            </span>
          ))}
        </div>
      )

    case "message":
      return (
        <div className={cn(glass, "flex flex-col gap-1.5 p-3")}>
          <span className="flex items-center justify-between text-white/65 text-micro">
            <span>{preview.from}</span>
            <span>{preview.time}</span>
          </span>
          <span className="text-caption">{preview.text}</span>
        </div>
      )
  }
}

function StepCard({ step, index }: { step: HowItWorksStep; index: number }) {
  return (
    <motion.li variants={fadeUp} className="flex flex-col">
      <Media
        image={step.image}
        alt={step.imageAlt}
        placeholder={step.placeholder}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-square rounded-[20px]"
      >
        {/* Finished artwork already carries its own caption card (and sometimes the number). */}
        {!step.imageNumbered && (
          <span
            aria-hidden="true"
            className="absolute top-3 left-3 grid size-8 place-items-center rounded-lg bg-neutral-900/40 text-white tabular-nums backdrop-blur-md text-caption"
          >
            {index + 1}
          </span>
        )}
        {!step.imageCaptioned && (
          <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
            <Preview preview={step.preview} />
          </div>
        )}
      </Media>

      <h3 className="mt-6 text-neutral-950 text-title">{step.title}</h3>
      <p className="mt-2 max-w-[34ch] text-neutral-500 text-body">
        {step.description}
      </p>
    </motion.li>
  )
}

export function HowItWorks() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className={cn("scroll-mt-20", sectionY)}>
      <div className={container}>
        <SectionHeader id="how-it-works-heading" heading={howItWorksHeading} intro={howItWorksIntro} />

        <motion.ol
          variants={stagger(0.1)}
          {...revealOnView(reduceMotion, 0.2)}
          className={cn(headerGap, "grid gap-x-2.5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4")}
        >
          {howItWorksSteps.map((step, index) => (
            <StepCard key={step.id} step={step} index={index} />
          ))}
        </motion.ol>
      </div>
    </section>
  )
}

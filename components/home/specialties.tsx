"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, LayoutGroup, MotionConfig, animate, motion, useInView, useMotionValue, useTransform, type MotionValue } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Calendar03Icon,
  PauseIcon,
  PlayIcon,
  Tick02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE, useReducedMotion } from "@/lib/motion"
import { focusRing, glass, headerGap, sectionY } from "@/lib/styles"
import {
  specialties,
  specialtiesCopy,
  specialtiesHeading,
  specialtiesIntro,
  specialtiesLabel,
  type Specialty,
} from "@/lib/data/specialties"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionHeader } from "@/components/site/section-header"

const pad = (n: number) => String(n).padStart(2, "0")

/** Time each specialty stays up while autoplaying. */
const SLIDE_MS = 6000
const RING_R = 13
const RING_C = 2 * Math.PI * RING_R

/** Thin ring around the active tab's number that fills as the slide's time runs. */
function ProgressRing({ progress }: { progress: MotionValue<number> }) {
  const offset = useTransform(progress, (v) => RING_C * (1 - v))
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="absolute inset-0 size-7 -rotate-90">
      <motion.circle
        cx="14"
        cy="14"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={RING_C}
        style={{ strokeDashoffset: offset }}
        className="text-white md:text-neutral-950"
      />
    </svg>
  )
}

/** Full-bleed photo (or placeholder) for the active specialty. Crossfades on change. */
function Backdrop({ specialty }: { specialty: Specialty }) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={specialty.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="absolute inset-0"
        style={specialty.image ? undefined : { backgroundImage: specialty.placeholder }}
      >
        {specialty.image && (
          <Image src={specialty.image} alt="" fill sizes="calc(100vw - 32px)" className="object-cover object-[60%_top]" />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Phones: the same light card layout as patient stories — a short photo with a glass chip,
 * then the name, summary, common visits and actions on white.
 */
function SpecialtyCard({ specialty }: { specialty: Specialty }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col md:hidden"
    >
      <div
        className="relative aspect-video overflow-hidden rounded-[20px] bg-neutral-200"
        style={specialty.image ? undefined : { backgroundImage: specialty.placeholder }}
      >
        {specialty.image && <Image src={specialty.image} alt="" fill sizes="calc(100vw - 48px)" className="object-cover object-[60%_25%]" />}
        <div className={cn(glass, "absolute bottom-3 left-3 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-caption")}>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
            <HugeiconsIcon aria-hidden="true" icon={Calendar03Icon} strokeWidth={1.8} className="size-3.5" />
          </span>
          <span className="truncate">
            {specialtiesCopy.nextAvailable} {specialty.nextAvailable}
            <span className="text-white/65"> · {specialtiesCopy.doctorCount(specialty.doctorCount)}</span>
          </span>
        </div>
      </div>

      <h3 className="mt-6 text-neutral-950 text-title">{specialty.name}</h3>
      <p className="mt-2 text-pretty text-neutral-500 text-body">{specialty.summary}</p>

      <p className="mt-6 text-neutral-400 text-caption">{specialtiesCopy.commonVisits}</p>
      <ul className="mt-2 divide-y divide-neutral-100 border-y border-neutral-100">
        {specialty.commonVisits.map((visit) => (
          <li key={visit} className="flex items-center justify-between gap-3 py-3 text-neutral-800 text-body">
            {visit}
            <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4 shrink-0 text-emerald-600" />
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-2">
        <Button size="lg" nativeButton={false} render={<Link href={specialtiesCopy.bookHref(specialty.id)} />} className="flex-1 rounded-full text-caption">
          {specialtiesCopy.book}
        </Button>
        <Button variant="outline" size="lg" nativeButton={false} render={<Link href={specialty.href} />} className="rounded-full text-caption">
          {specialtiesCopy.learnMore}
          <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

/** Tablet and up: copy, common visits and booking card over the full-bleed photo. */
function SpecialtyPanel({ specialty }: { specialty: Specialty }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="hidden flex-1 flex-col justify-between gap-12 md:flex"
    >
      <div className="max-w-md">
        <h3 className="text-white text-heading">{specialty.name}</h3>
        <p className="mt-4 text-white/85 text-lead">{specialty.summary}</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Common visits */}
        <div className="w-full lg:max-w-md">
          <p className="mb-2 text-white/70 text-caption">{specialtiesCopy.commonVisits}</p>
          <ul className="flex flex-col gap-2">
            {specialty.commonVisits.map((visit) => (
              <li
                key={visit}
                className={cn(glass, "flex h-14 items-center justify-between rounded-xl px-5 text-body")}
              >
                {visit}
                <span className="grid size-8 place-items-center rounded-md bg-white/10">
                  <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4" />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Booking card */}
        <div className={cn(glass, "flex w-full flex-col gap-4 rounded-2xl p-4 lg:max-w-sm")}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <HugeiconsIcon aria-hidden="true" icon={Calendar03Icon} strokeWidth={1.8} className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-white/65 text-micro">{specialtiesCopy.nextAvailable}</span>
              <span className="text-caption">{specialty.nextAvailable}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-micro">
              <HugeiconsIcon aria-hidden="true" icon={UserMultipleIcon} strokeWidth={1.8} className="size-3.5" />
              {specialtiesCopy.doctorCount(specialty.doctorCount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="inverse"
              size="lg"
              nativeButton={false}
              render={<Link href={specialtiesCopy.bookHref(specialty.id)} />}
              className="flex-1 rounded-full text-caption"
            >
              {specialtiesCopy.book}
            </Button>
            <Button
              variant="glass"
              size="lg"
              nativeButton={false}
              render={<Link href={specialty.href} />}
              className="rounded-full text-caption"
            >
              {specialtiesCopy.learnMore}
              <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function Specialties() {
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = React.useState(specialties[0].id)
  const active = specialties.find((s) => s.id === activeId) ?? specialties[0]

  // Autoplay: pauses on hover, keyboard focus, off-screen, user pause, or reduced motion.
  const panelRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(panelRef, { amount: 0.4 })
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [userPaused, setUserPaused] = React.useState(false)
  const autoplay = !reduceMotion && !userPaused
  const running = autoplay && inView && !hovered && !focused
  const progress = useMotionValue(0)

  const select = React.useCallback(
    (id: string) => {
      progress.set(0)
      setActiveId(id)
    },
    [progress]
  )

  React.useEffect(() => {
    if (!running) return
    const controls = animate(progress, 1, {
      duration: (SLIDE_MS / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        const i = specialties.findIndex((s) => s.id === activeId)
        select(specialties[(i + 1) % specialties.length].id)
      },
    })
    return () => controls.stop()
  }, [running, activeId, progress, select])

  return (
    <MotionConfig transition={reduceMotion ? { duration: 0 } : undefined}>
      <section aria-labelledby="specialties-heading" className={sectionY}>
        <div className="px-6">
          <SectionHeader
            id="specialties-heading"
            label={specialtiesLabel}
            heading={specialtiesHeading}
            intro={specialtiesIntro}
          />
        </div>

        <Tabs
          ref={panelRef}
          value={activeId}
          onValueChange={(value: string) => select(value)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={(e) => e.target.matches(":focus-visible") && setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
          }}
          className={cn(
            headerGap,
            "relative gap-0 px-6",
            // From md up: the rounded dark panel with the photo filling it.
            "md:mx-4 md:min-h-[min(860px,calc(100svh-32px))] md:overflow-hidden md:rounded-[32px] md:bg-neutral-800 md:px-0"
          )}
        >
          <div aria-hidden="true" className="hidden md:block">
            <Backdrop specialty={active} />
          </div>
          {/* Black gradients so the white copy stays legible on any photo */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 hidden bg-linear-to-r from-black/60 from-0% via-black/25 via-40% to-transparent to-70% lg:block" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 from-0% via-black/20 via-40% to-transparent to-70%" />
          </div>

          <div className="relative flex flex-1 flex-col gap-6 md:gap-8 md:px-10 md:pt-28 md:pb-10 lg:px-14 lg:pb-14">
            <div className="flex items-center gap-3">
              <LayoutGroup>
                <TabsList
                  activateOnFocus
                  aria-label={specialtiesCopy.tabsLabel}
                  className="-ml-6 w-auto min-w-0 justify-start gap-2 overflow-x-auto overflow-y-hidden rounded-none bg-transparent pl-6 scrollbar-none group-data-horizontal/tabs:h-auto md:ml-0 md:pl-0"
                >
                  {specialties.map((specialty, index) => {
                    const isActive = specialty.id === activeId
                    return (
                      <TabsTrigger
                        key={specialty.id}
                        value={specialty.id}
                        aria-label={specialty.name}
                        render={<motion.button layout />}
                        className={cn(
                          "h-10 flex-none gap-2 rounded-full border-0 px-1.5 py-0 text-neutral-600 hover:text-neutral-950 md:text-white/80 md:hover:text-white",
                          "data-active:bg-neutral-950 data-active:pr-4 data-active:text-white data-active:hover:text-white",
                          "md:data-active:bg-white/85 md:data-active:text-neutral-950 md:data-active:hover:text-neutral-950 md:data-active:backdrop-blur-md text-caption"
                        )}
                      >
                        <motion.span
                          layout="position"
                          className={cn(
                            "relative grid size-7 place-items-center rounded-full ring-1 tabular-nums",
                            isActive ? "ring-white/25 md:ring-neutral-950/15" : "ring-neutral-300 md:ring-white/40",
                            "text-micro"
                          )}
                        >
                          {isActive && autoplay && <ProgressRing progress={progress} />}
                          {pad(index + 1)}
                        </motion.span>
                        {isActive && (
                          <motion.span layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {specialty.name}
                          </motion.span>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </LayoutGroup>

              {!reduceMotion && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? specialtiesCopy.play : specialtiesCopy.pause}
                  className={cn(
                    "ml-auto shrink-0 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950",
                    "md:border-white/10 md:bg-neutral-900/55 md:text-white md:backdrop-blur-xl md:hover:bg-neutral-900/70 md:hover:text-white",
                    focusRing.current
                  )}
                >
                  <HugeiconsIcon aria-hidden="true" icon={userPaused ? PlayIcon : PauseIcon} strokeWidth={1.8} />
                </Button>
              )}
            </div>

            {specialties.map((specialty) => (
              <TabsContent key={specialty.id} value={specialty.id} className="flex flex-col">
                <SpecialtyCard specialty={specialty} />
                <SpecialtyPanel specialty={specialty} />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </section>
    </MotionConfig>
  )
}

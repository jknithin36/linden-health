"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Apple01Icon,
  ArrowRight01Icon,
  BabyBottleIcon,
  Bone01Icon,
  Brain01Icon,
  Calendar03Icon,
  FaceIdIcon,
  HeartCheckIcon,
  InjectionIcon,
  Search01Icon,
  Stethoscope02Icon,
  TestTube01Icon,
  UserMultipleIcon,
  Video01Icon,
  WomanIcon,
  WorkoutRunIcon,
  XRayIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE, fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { chip, container, focusRing, glass, pageTop, sectionY } from "@/lib/styles"
import { specialties, type Specialty } from "@/lib/data/specialties"
import {
  extraServices,
  serviceCategories,
  servicesCopy as copy,
  specialtyMeta,
  type ExtraService,
  type ServiceCategory,
} from "@/lib/data/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Media } from "@/components/site/media"

type IconType = typeof Stethoscope02Icon

const SPECIALTY_ICONS: Record<string, IconType> = {
  "family-medicine": Stethoscope02Icon,
  pediatrics: BabyBottleIcon,
  "womens-health": WomanIcon,
  dermatology: FaceIdIcon,
  cardiology: HeartCheckIcon,
  orthopedics: Bone01Icon,
}

const SERVICE_ICONS: Record<ExtraService["id"], IconType> = {
  labs: TestTube01Icon,
  imaging: XRayIcon,
  vaccines: InjectionIcon,
  "physical-therapy": WorkoutRunIcon,
  "mental-health": Brain01Icon,
  nutrition: Apple01Icon,
  video: Video01Icon,
}

const ALL = "all"
const pad = (n: number) => String(n).padStart(2, "0")
const matches = (q: string, words: string[]) => !q || words.some((w) => w.toLowerCase().includes(q))

const listItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.35, ease: EASE },
}

/* ----------------------------------------------------------------------------
 * Hero collage: the six specialty photos, staggered in three columns
 * ------------------------------------------------------------------------- */

function Collage() {
  const reduceMotion = useReducedMotion()
  const withImages = specialties.filter((s): s is Specialty & { image: string } => !!s.image)
  const columns = [withImages.slice(0, 2), withImages.slice(2, 4), withImages.slice(4, 6)]
  const offsets = ["lg:translate-y-10", "lg:-translate-y-4", "lg:translate-y-16"]

  return (
    <motion.div
      aria-hidden="true"
      variants={stagger(0.08, 0.15)}
      {...revealOnView(reduceMotion, 0.2)}
      className="relative hidden grid-cols-3 gap-3 lg:grid"
    >
      {columns.map((col, ci) => (
        <div key={ci} className={cn("flex flex-col gap-3", offsets[ci])}>
          {col.map((s, i) => (
            <motion.div
              key={s.id}
              variants={fadeUp}
              className={cn(
                "relative overflow-hidden rounded-[22px] bg-neutral-200",
                (ci + i) % 2 === 0 ? "aspect-[3/4]" : "aspect-square"
              )}
            >
              <Image src={s.image} alt="" fill sizes="220px" loading="eager" className="object-cover object-[60%_30%]" />
            </motion.div>
          ))}
        </div>
      ))}
      <motion.p
        variants={fadeUp}
        className={cn(
          glass,
          "absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 whitespace-nowrap text-caption"
        )}
      >
        {copy.collageNote}
      </motion.p>
    </motion.div>
  )
}

/* ----------------------------------------------------------------------------
 * Specialty row (editorial list)
 * ------------------------------------------------------------------------- */

function SpecialtyRow({ specialty, index }: { specialty: Specialty; index: number }) {
  const icon = SPECIALTY_ICONS[specialty.id] ?? Stethoscope02Icon
  return (
    <Link
      href={copy.learnMoreHref(specialty.id)}
      className={cn(
        "group grid gap-5 rounded-[28px] p-4 transition-colors hover:bg-neutral-50 sm:p-6",
        "md:grid-cols-[minmax(0,1fr)_240px] md:items-center lg:grid-cols-[48px_minmax(0,1fr)_minmax(0,0.9fr)_260px] lg:gap-8",
        focusRing.dark
      )}
    >
      <span className="hidden text-neutral-400 tabular-nums lg:block text-caption">{pad(index + 1)}</span>

      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-950">
            <HugeiconsIcon aria-hidden="true" icon={icon} strokeWidth={1.6} className="size-[18px]" />
          </span>
          <h3 className="text-neutral-950 text-heading">{specialty.name}</h3>
        </div>
        <p className="mt-3 max-w-md text-pretty text-neutral-500 text-body">{specialty.summary}</p>
      </div>

      <div className="flex flex-col gap-4">
        <ul className="flex flex-wrap gap-1.5">
          {specialty.commonVisits.map((v) => (
            <li key={v} className="rounded-full border border-neutral-200 px-2.5 py-1 text-neutral-700 text-caption">
              {v}
            </li>
          ))}
        </ul>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-500 text-caption">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon aria-hidden="true" icon={UserMultipleIcon} strokeWidth={1.8} className="size-3.5" />
            {copy.doctors(specialty.doctorCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon aria-hidden="true" icon={Calendar03Icon} strokeWidth={1.8} className="size-3.5" />
            {copy.nextAvailable(specialty.nextAvailable)}
          </span>
        </p>
      </div>

      <div className="relative md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-4 lg:row-span-1">
        <Media
          image={specialty.image}
          alt={specialty.imageAlt}
          placeholder={specialty.placeholder}
          sizes="(min-width: 1024px) 260px, (min-width: 768px) 240px, 100vw"
          className="aspect-[16/10] rounded-[20px]"
          imageClassName="object-[60%_30%] transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white text-neutral-950 shadow-sm transition-transform duration-300 group-hover:translate-x-0.5"
        >
          <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} className="size-4" />
        </span>
      </div>
      <span className="sr-only">{copy.learnMore}</span>
    </Link>
  )
}

/* ----------------------------------------------------------------------------
 * Service row (menu-style price list)
 * ------------------------------------------------------------------------- */

function ServiceRow({ service }: { service: ExtraService }) {
  return (
    <Link href={service.href} className={cn("group flex items-start gap-4 border-b border-neutral-200 py-5", focusRing.dark)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-neutral-950 ring-1 ring-neutral-950/[0.06]">
        <HugeiconsIcon aria-hidden="true" icon={SERVICE_ICONS[service.id]} strokeWidth={1.6} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-3">
          <span className="text-neutral-950 text-lead">{service.name}</span>
          <span aria-hidden="true" className="hidden flex-1 -translate-y-1 border-b border-dotted border-neutral-300 sm:block" />
          <span className="ml-auto shrink-0 text-neutral-950 tabular-nums sm:ml-0 text-body">
            {copy.priceFrom(service.priceFrom)}
          </span>
        </span>
        <span className="mt-1 block text-pretty text-neutral-500 text-body">{service.summary}</span>
      </span>
      <HugeiconsIcon aria-hidden="true"
        icon={ArrowRight01Icon}
        strokeWidth={1.8}
        className="mt-2 size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-950"
      />
    </Link>
  )
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function ServicesPage() {
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState<ServiceCategory | typeof ALL>(ALL)
  const searchId = React.useId()

  const q = query.trim().toLowerCase()
  const inCategory = (c: ServiceCategory) => category === ALL || category === c

  const shownSpecialties = specialties.filter((s) => {
    const meta = specialtyMeta[s.id]
    return (
      inCategory(meta?.category ?? "specialists") &&
      matches(q, [s.name, s.summary, ...s.commonVisits, ...(meta?.keywords ?? [])])
    )
  })
  const shownServices = extraServices.filter((s) => inCategory(s.category) && matches(q, [s.name, s.summary, ...s.keywords]))
  const total = shownSpecialties.length + shownServices.length
  const filtering = !!q || category !== ALL

  const reset = () => {
    setQuery("")
    setCategory(ALL)
  }

  return (
    <MotionConfig transition={reduceMotion ? { duration: 0 } : undefined}>
      <main className="flex flex-col pb-4">
        {/* Hero */}
        <section aria-labelledby="services-heading" className={cn(pageTop, "pb-16 md:pb-24")}>
          <div className={cn(container, "grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16")}>
            <motion.div variants={stagger(0.08)} {...revealOnView(reduceMotion, 0.3)} className="min-w-0">
              <motion.p variants={fadeUp} className="text-neutral-500 text-caption">
                {copy.label}
              </motion.p>
              <motion.h1
                variants={fadeUp}
                id="services-heading"
                className="mt-3 max-w-[12em] text-balance text-neutral-950 text-display"
              >
                {copy.heading}
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-5 max-w-lg text-pretty text-neutral-500 text-lead">
                {copy.intro}
              </motion.p>

              <motion.div variants={fadeUp} className="relative mt-8 max-w-xl">
                <label htmlFor={searchId} className="sr-only">
                  {copy.searchLabel}
                </label>
                <HugeiconsIcon aria-hidden="true"
                  icon={Search01Icon}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-neutral-400"
                />
                <Input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className={cn(
                    "h-14 rounded-full border-neutral-200 bg-white pr-5 pl-13 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]",
                    "hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 text-body"
                  )}
                />
              </motion.div>

              <motion.div variants={fadeUp} className="mt-4">
                <ToggleGroup
                  aria-label={copy.label}
                  value={[category]}
                  onValueChange={(value: string[]) => {
                    const next = value[value.length - 1] as ServiceCategory | typeof ALL | undefined
                    if (next) setCategory(next)
                  }}
                  className="-mx-6 w-auto flex-nowrap overflow-x-auto overflow-y-hidden px-6 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0"
                >
                  <ToggleGroupItem value={ALL} className={cn(chip, "text-caption")}>
                    {copy.allFilter}
                  </ToggleGroupItem>
                  {serviceCategories.map((c) => (
                    <ToggleGroupItem key={c.id} value={c.id} className={cn(chip, "text-caption")}>
                      {c.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </motion.div>
            </motion.div>

            <Collage />
          </div>
        </section>

        {/* Start here (hidden while searching, so results come first) */}
        {!filtering && (
          <section aria-labelledby="guide-heading" className="mx-4 rounded-[32px] bg-neutral-950 py-12 text-white md:py-16">
            <motion.div variants={stagger(0.08)} {...revealOnView(reduceMotion, 0.3)} className={container}>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <motion.h2 variants={fadeUp} id="guide-heading" className="text-heading">
                  {copy.guide.heading}
                </motion.h2>
                <motion.p variants={fadeUp} className="text-white/60 text-body">
                  {copy.guide.intro}
                </motion.p>
              </div>
              <ul className="mt-8 grid gap-3 md:grid-cols-3">
                {copy.guide.picks.map((pick, i) => (
                  <motion.li key={pick.id} variants={fadeUp}>
                    <Link
                      href={pick.href}
                      className={cn(
                        "group flex h-full flex-col justify-between gap-10 rounded-[22px] bg-white/[0.07] p-6 transition-colors hover:bg-white/[0.13]",
                        focusRing.light
                      )}
                    >
                      <span className="text-white/40 tabular-nums text-caption">{pad(i + 1)}</span>
                      <span>
                        <span className="block text-pretty text-title">“{pick.label}”</span>
                        <span className="mt-4 flex items-center justify-between text-white/70 text-caption">
                          {pick.to}
                          <span className="grid size-9 place-items-center rounded-full bg-white text-neutral-950 transition-transform group-hover:translate-x-0.5">
                            <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} className="size-4" />
                          </span>
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <motion.p variants={fadeUp} className="mt-6 text-white/50 text-caption">
                {copy.guide.note}
              </motion.p>
            </motion.div>
          </section>
        )}

        <p aria-live="polite" className="sr-only">
          {copy.results(total)}
        </p>

        {/* Specialties */}
        {shownSpecialties.length > 0 && (
          <section aria-labelledby="specialties-list-heading" className={sectionY}>
            <div className={container}>
              <div className="flex flex-col gap-2 border-b border-neutral-200 pb-6 md:flex-row md:items-end md:justify-between">
                <h2 id="specialties-list-heading" className="text-neutral-950 text-heading">
                  {copy.specialtiesTitle}
                </h2>
                <p className="max-w-sm text-neutral-500 text-body">{copy.specialtiesIntro}</p>
              </div>
              <ul className="mt-2 flex flex-col divide-y divide-neutral-200">
                <AnimatePresence mode="popLayout" initial={false}>
                  {shownSpecialties.map((s) => (
                    <motion.li key={s.id} id={s.id} layout="position" {...listItem} className="scroll-mt-24 py-2">
                      <SpecialtyRow specialty={s} index={specialties.indexOf(s)} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </section>
        )}

        {/* More services */}
        {shownServices.length > 0 && (
          <section aria-labelledby="more-services-heading" className={cn("mx-4 rounded-[32px] bg-neutral-50", sectionY)}>
            <div className={cn(container, "grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16")}>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <h2 id="more-services-heading" className="text-neutral-950 text-heading">
                  {copy.moreTitle}
                </h2>
                <p className="mt-3 max-w-sm text-neutral-500 text-body">{copy.moreIntro}</p>
              </div>
              <ul className="grid gap-x-10 border-t border-neutral-200 md:grid-cols-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {shownServices.map((s) => (
                    <motion.li key={s.id} id={s.id} layout="position" {...listItem} className="scroll-mt-24">
                      <ServiceRow service={s} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </section>
        )}

        {total === 0 && (
          <div className={cn(container, "py-16")}>
            <div className="flex flex-col items-center rounded-[28px] border border-dashed border-neutral-300 px-6 py-16 text-center">
              <p className="text-neutral-950 text-title">{copy.empty}</p>
              <p className="mt-2 max-w-md text-neutral-500 text-body">{copy.emptyHint}</p>
              <Button variant="outline" size="lg" onClick={reset} className="mt-6 rounded-full text-caption">
                {copy.clear}
              </Button>
            </div>
          </div>
        )}
      </main>
    </MotionConfig>
  )
}

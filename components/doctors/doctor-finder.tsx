"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Call02Icon,
  Cancel01Icon,
  Location01Icon,
  Search01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE, fadeUp, revealOnView, useReducedMotion } from "@/lib/motion"
import { chip, container, focusRing, panel, portraitBackdrop } from "@/lib/styles"
import { locationName, site } from "@/lib/data/site"
import { doctors, doctorsCopy, doctorsDirectory as copy, type Doctor } from "@/lib/data/doctors"
import { specialties } from "@/lib/data/specialties"
import { networkPlanTypes, planByName, type PlanType } from "@/lib/data/insurance"
import { shortName } from "@/lib/data/doctor-profiles"
import { institutionByName } from "@/lib/data/trust"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FilterSelect } from "@/components/site/filter-select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Media } from "@/components/site/media"
import { StarGlyph } from "@/components/site/icons"

type SortId = (typeof copy.sorts)[number]["id"]
const ALL = "all"

const specialtyById = new Map(specialties.map((s) => [s.id, s]))
const languages = [...new Set(doctors.flatMap((d) => d.languages))].sort((a, b) =>
  a === "English" ? -1 : b === "English" ? 1 : a.localeCompare(b)
)

/** Earliest slot first: Today < Tomorrow < Thu < Fri. */
const DAY_ORDER = ["Today", "Tomorrow", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const dayRank = (d: Doctor) => {
  const i = DAY_ORDER.indexOf(d.slots[0]?.label.split(" ")[0] ?? "")
  return i === -1 ? DAY_ORDER.length : i
}
const isToday = (d: Doctor) => d.slots.some((s) => s.label.startsWith("Today"))

const locationOptions = [
  { value: ALL, label: copy.allLocations },
  ...site.locations.map((l) => ({ value: l, label: locationName(l) })),
]
const languageOptions = [{ value: ALL, label: copy.allLanguages }, ...languages.map((l) => ({ value: l, label: l }))]
const sortOptions = copy.sorts.map((s) => ({ value: s.id, label: s.label }))

/* ----------------------------------------------------------------------------
 * Doctor row
 * ------------------------------------------------------------------------- */

function DoctorRow({ doctor, eager = false }: { doctor: Doctor; eager?: boolean }) {
  const specialty = specialtyById.get(doctor.specialtyId)
  const school = institutionByName(doctor.trainedAt)

  return (
    <article
      id={doctor.id}
      className="grid scroll-mt-28 gap-6 rounded-[28px] border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] sm:p-5 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_300px] lg:gap-8"
    >
      {/* Portrait */}
      <Media
        image={doctor.image}
        alt={doctorsCopy.portraitAlt(doctor.name)}
        placeholder={doctor.placeholder}
        sizes="(min-width: 1024px) 200px, (min-width: 768px) 180px, 100vw"
        loading={eager ? "eager" : undefined}
        className={cn("aspect-5/6 rounded-[20px] max-md:aspect-[4/3]", portraitBackdrop)}
        imageClassName="mix-blend-multiply max-md:object-[50%_20%]"
      />

      {/* Details */}
      <div className="flex min-w-0 flex-col py-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {doctor.acceptingNewPatients && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 text-caption">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
              {doctorsCopy.acceptingNew}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-neutral-950 text-caption">
            <StarGlyph className="size-3.5" />
            {doctor.rating.toFixed(1)}
            <span className="text-neutral-500">{doctorsCopy.reviews(doctor.reviewCount)}</span>
          </span>
        </div>

        <h2 className="mt-3 text-neutral-950 text-title">
          <Link href={doctor.href} className={cn("rounded-sm underline-offset-4 hover:underline", focusRing.dark)}>
            {doctor.name}, {doctor.credentials}
          </Link>
        </h2>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-neutral-500 text-body">
          {doctor.specialty}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon aria-hidden="true" icon={Location01Icon} strokeWidth={1.8} className="size-3.5" />
            {locationName(doctor.location)}
          </span>
        </p>

        <blockquote className="mt-4 max-w-xl border-l-2 border-neutral-200 pl-3 text-pretty text-neutral-700 text-body">
          “{doctor.quote}”
        </blockquote>

        {specialty && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-neutral-500 text-caption">{copy.treats}</span>
            {specialty.commonVisits.map((visit) => (
              <span key={visit} className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700 text-caption">
                {visit}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-neutral-500 text-caption">
          <span>
            {copy.trainedAt} {school?.name ?? doctor.trainedAt}
          </span>
          <span>{copy.experience(doctor.yearsExperience)}</span>
          <span>{copy.speaks(doctor.languages)}</span>
        </div>
      </div>

      {/* Availability */}
      <div className="flex flex-col rounded-[20px] bg-neutral-50 p-5 md:col-span-2 lg:col-span-1">
        <p className="text-neutral-500 text-caption">{copy.nextAvailable}</p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {doctor.slots.map((slot) => (
            <li key={slot.value}>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href={doctorsCopy.slotHref(doctor.id, slot.value)} />}
                aria-label={doctorsCopy.bookSlotLabel(doctor.name, slot.label)}
                className="w-full justify-between rounded-xl bg-white px-3.5 hover:border-neutral-950 hover:bg-white text-caption"
              >
                {slot.label}
                <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" className="text-neutral-400" />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          size="xl"
          nativeButton={false}
          render={<Link href={doctorsCopy.slotHref(doctor.id, doctor.slots[0].value)} />}
          className="mt-3 w-full"
        >
          {copy.bookShort(shortName(doctor))}
        </Button>
        <p className="mt-4 flex items-center gap-1.5 text-neutral-500 text-caption">
          <HugeiconsIcon aria-hidden="true" icon={Shield01Icon} strokeWidth={1.8} className="size-3.5" />
          {copy.insuranceNote} ·{" "}
          <Link href={copy.checkInsurance.href} className={cn("rounded-sm text-neutral-950 underline underline-offset-4", focusRing.dark)}>
            {copy.checkInsurance.label}
          </Link>
        </p>
      </div>
    </article>
  )
}

/* ----------------------------------------------------------------------------
 * Finder
 * ------------------------------------------------------------------------- */

type DoctorFinderProps = {
  insurance?: string | null
  plan?: string | null
  specialty?: string | null
  clinic?: string | null
}

export function DoctorFinder({
  insurance = null,
  plan = null,
  specialty: initialSpecialty = null,
  clinic = null,
}: DoctorFinderProps) {
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = React.useState("")
  const [specialty, setSpecialty] = React.useState(
    initialSpecialty && specialtyById.has(initialSpecialty) ? initialSpecialty : ALL
  )
  const [location, setLocation] = React.useState<string>(
    clinic && (site.locations as readonly string[]).includes(clinic) ? clinic : ALL
  )
  const [language, setLanguage] = React.useState(ALL)
  const [today, setToday] = React.useState(false)
  const [sort, setSort] = React.useState<SortId>("recommended")
  const [insuranceOn, setInsuranceOn] = React.useState(true)
  const ids = { search: React.useId(), today: React.useId() }

  // Arriving from the coverage checker: limit to the clinics that take that plan.
  const insurancePlan = insurance ? planByName(insurance) : undefined
  const planClinics = insuranceOn && insurancePlan && insurancePlan.locations !== "all" ? insurancePlan.locations : null
  const planLabel = insurance ? [insurance, plan && networkPlanTypes.includes(plan as PlanType) ? plan : null].filter(Boolean).join(" ") : null

  const q = query.trim().toLowerCase()
  const results = doctors
    .filter((d) => specialty === ALL || d.specialtyId === specialty)
    .filter((d) => location === ALL || d.location === location)
    .filter((d) => !planClinics || (planClinics as readonly string[]).includes(d.location))
    .filter((d) => language === ALL || d.languages.includes(language))
    .filter((d) => !today || isToday(d))
    .filter((d) => {
      if (!q) return true
      const visits = specialtyById.get(d.specialtyId)?.commonVisits ?? []
      return [d.name, d.specialty, d.location, ...d.languages, ...visits].some((t) => t.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (sort === "soonest") return dayRank(a) - dayRank(b)
      if (sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount
      if (sort === "experience") return b.yearsExperience - a.yearsExperience
      return Number(!!b.featured) - Number(!!a.featured) || dayRank(a) - dayRank(b)
    })

  const filtered = !!q || specialty !== ALL || location !== ALL || language !== ALL || today
  const clear = () => {
    setQuery("")
    setSpecialty(ALL)
    setLocation(ALL)
    setLanguage(ALL)
    setToday(false)
  }

  return (
    <MotionConfig transition={reduceMotion ? { duration: 0 } : undefined}>
      <main className="flex flex-col gap-4 pb-4">
        {/* Header with search */}
        <section aria-labelledby="find-heading" className={cn(panel, "bg-neutral-50 py-14 md:py-20")}>
          <motion.div variants={fadeUp} {...revealOnView(reduceMotion, 0.3)} className={cn(container, "flex flex-col")}>
            <p className="text-neutral-500 text-caption">{copy.label}</p>
            <h1 id="find-heading" className="mt-3 max-w-[14em] text-neutral-950 text-display">
              {copy.heading}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-neutral-500 text-lead">{copy.intro}</p>

            <div className="relative mt-8 max-w-2xl">
              <label htmlFor={ids.search} className="sr-only">
                {copy.searchLabel}
              </label>
              <HugeiconsIcon aria-hidden="true"
                icon={Search01Icon}
                strokeWidth={1.8}
                className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-neutral-400"
              />
              <Input
                id={ids.search}
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className={cn(
                  "h-14 rounded-full border-neutral-200 bg-white pr-5 pl-13 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]",
                  "hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 text-body"
                )}
              />
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-neutral-500 text-caption">
              {copy.stats(doctors.length, specialties.length, site.locations.length).map((s, i) => (
                <li key={s} className="flex items-center gap-5">
                  {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-neutral-300" />}
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* Filters + results */}
        <section aria-label={copy.filtersLabel} className="py-10 md:py-14">
          <div className={container}>
            {planLabel && insuranceOn && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-900 text-body">
                <span className="flex flex-wrap items-center gap-x-2">
                  <HugeiconsIcon aria-hidden="true" icon={Shield01Icon} strokeWidth={1.8} className="size-4" />
                  {copy.insuranceBanner(planLabel)}
                  {planClinics && <span className="text-emerald-800/80">{copy.insuranceLimited(planClinics.join(" and "))}</span>}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setInsuranceOn(false)} className="rounded-full text-emerald-900 hover:bg-emerald-100 text-caption">
                  <HugeiconsIcon aria-hidden="true" icon={Cancel01Icon} strokeWidth={1.8} data-icon="inline-start" />
                  {copy.insuranceClear}
                </Button>
              </div>
            )}

            <ToggleGroup
              aria-label={copy.filtersLabel}
              value={[specialty]}
              onValueChange={(value: string[]) => {
                const next = value[value.length - 1]
                if (next) setSpecialty(next)
              }}
              className="-mx-6 w-auto flex-nowrap overflow-x-auto overflow-y-hidden px-6 scrollbar-none lg:mx-0 lg:flex-wrap lg:px-0"
            >
              <ToggleGroupItem value={ALL} className={cn(chip, "text-caption")}>
                {copy.allSpecialties}
              </ToggleGroupItem>
              {specialties.map((s) => (
                <ToggleGroupItem key={s.id} value={s.id} className={cn(chip, "text-caption")}>
                  {s.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="mt-4 flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:flex-wrap sm:items-center">
              <FilterSelect ariaLabel={copy.locationLabel} value={location} onValueChange={setLocation} options={locationOptions} />
              <FilterSelect ariaLabel={copy.languageLabel} value={language} onValueChange={setLanguage} options={languageOptions} />

              <label htmlFor={ids.today} className="flex h-11 cursor-pointer items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 text-neutral-800 text-caption">
                <Switch id={ids.today} checked={today} onCheckedChange={(v: boolean) => setToday(v)} />
                {copy.todayOnly}
              </label>

              <div className="flex items-center gap-2 sm:ml-auto">
                <span aria-hidden="true" className="shrink-0 text-neutral-500 text-caption">
                  {copy.sortLabel}
                </span>
                <FilterSelect
                  ariaLabel={copy.sortLabel}
                  value={sort}
                  onValueChange={(v) => setSort(v as SortId)}
                  options={sortOptions}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p aria-live="polite" className="text-neutral-950 text-body">
                {copy.results(results.length)}
              </p>
              {filtered && (
                <Button variant="link" onClick={clear} className="h-auto px-0 text-neutral-500 text-caption">
                  {copy.clear}
                </Button>
              )}
            </div>

            <ul className="mt-5 flex flex-col gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((d, i) => (
                  <motion.li
                    key={d.id}
                    layout="position"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    {/* The first rows are above the fold on most screens. */}
                    <DoctorRow doctor={d} eager={i < 2} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {results.length === 0 && (
              <div className="flex flex-col items-center rounded-[28px] border border-dashed border-neutral-300 px-6 py-16 text-center">
                <p className="text-neutral-950 text-title">{copy.empty}</p>
                <p className="mt-2 text-neutral-500 text-body">{copy.emptyHint}</p>
                <Button variant="outline" size="lg" onClick={clear} className="mt-6 rounded-full text-caption">
                  {copy.clear}
                </Button>
              </div>
            )}

            {/* Help */}
            <div className="mt-10 flex flex-col gap-5 rounded-[28px] bg-neutral-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-title">{copy.helpTitle}</p>
                <p className="mt-1 text-white/70 text-body">{copy.helpBody}</p>
              </div>
              <Button variant="inverse" size="xl" nativeButton={false} render={<a href={`tel:${site.phone.tel}`} />} className="shrink-0">
                <HugeiconsIcon aria-hidden="true" icon={Call02Icon} strokeWidth={1.8} data-icon="inline-start" />
                {copy.call(site.phone.display)}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </MotionConfig>
  )
}

/** Reads ?insurance=&plan= (coverage checker), ?specialty= (services) and ?clinic= (doctor profiles). Wrap in <Suspense>. */
export function DoctorFinderWithParams() {
  const params = useSearchParams()
  // Keyed by the query so following a new filter link (e.g. from a profile) resets the filters.
  return (
    <DoctorFinder
      key={params.toString()}
      insurance={params.get("insurance")}
      plan={params.get("plan")}
      specialty={params.get("specialty")}
      clinic={params.get("clinic")}
    />
  )
}

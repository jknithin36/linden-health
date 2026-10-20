"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  Mail01Icon,
  Shield01Icon,
  Tick02Icon,
  UserMultipleIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { chip, container, focusRing, pageTop, portraitBackdrop } from "@/lib/styles"
import { locationName } from "@/lib/data/site"
import { doctors, doctorsCopy, type Doctor } from "@/lib/data/doctors"
import { specialties } from "@/lib/data/specialties"
import { insurancePlans } from "@/lib/data/insurance"
import { clinicFor, directionsHref } from "@/lib/data/clinics"
import { availabilityFor } from "@/lib/data/availability"
import {
  doctorProfiles,
  educationFor,
  faqsFor,
  profileCopy as copy,
  reviewsFor,
  shortName,
  specialtyProfiles,
} from "@/lib/data/doctor-profiles"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FaqAccordion } from "@/components/site/faq-accordion"
import { Media } from "@/components/site/media"
import { StarGlyph } from "@/components/site/icons"
import { SlotPicker } from "@/components/doctors/slot-picker"

const INSURANCE_SHOWN = [1, 2, 3, 4, 5, 21, 27]

/* ----------------------------------------------------------------------------
 * Small pieces
 * ------------------------------------------------------------------------- */

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarGlyph key={i} className={cn("size-3.5", i <= Math.round(rating) ? "text-neutral-950" : "text-neutral-300")} />
      ))}
    </span>
  )
}

function Section({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      aria-labelledby={id}
      variants={fadeUp}
      {...revealOnView(reduceMotion, 0.15)}
      className={cn("border-t border-neutral-200 pt-10", className)}
    >
      <h2 id={id} className="text-neutral-950 text-title">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </motion.section>
  )
}

/* ----------------------------------------------------------------------------
 * Booking panel
 * ------------------------------------------------------------------------- */

function BookingPanel({ doctor, videoVisits }: { doctor: Doctor; videoVisits: boolean }) {
  const days = React.useMemo(() => availabilityFor(doctor), [doctor])
  const [format, setFormat] = React.useState("in-person")
  const [reason, setReason] = React.useState<string>(copy.panel.reasons[0])
  const [slot, setSlot] = React.useState<string | null>(doctor.slots[0]?.value ?? null)
  const ids = { format: React.useId(), reason: React.useId() }
  const formats = videoVisits ? copy.panel.formats : copy.panel.formats.filter((f) => f.id !== "video")

  const href = slot
    ? `/book?doctor=${doctor.id}&slot=${slot}&format=${format}&reason=${encodeURIComponent(reason)}`
    : null

  return (
    <div id="book" className="scroll-mt-28 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.3)] sm:p-6">
      <h2 className="text-neutral-950 text-title">{copy.panel.heading(shortName(doctor))}</h2>

      <div className="mt-5 flex flex-col gap-5">
        <div>
          <p id={ids.format} className="mb-2 text-neutral-600 text-caption">
            {copy.panel.visitType}
          </p>
          <ToggleGroup
            aria-labelledby={ids.format}
            value={[format]}
            onValueChange={(v: string[]) => {
              const next = v[v.length - 1]
              if (next) setFormat(next)
            }}
            className="grid w-full grid-cols-2 gap-1.5"
          >
            {formats.map((f) => (
              <ToggleGroupItem key={f.id} value={f.id} className={cn(chip, "w-full text-caption")}>
                {f.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div>
          <p id={ids.reason} className="mb-2 text-neutral-600 text-caption">
            {copy.panel.reason}
          </p>
          <ToggleGroup
            aria-labelledby={ids.reason}
            value={[reason]}
            onValueChange={(v: string[]) => {
              const next = v[v.length - 1]
              if (next) setReason(next)
            }}
            className="flex-wrap gap-1.5"
          >
            {copy.panel.reasons.map((r) => (
              <ToggleGroupItem key={r} value={r} className={cn(chip, "h-9 px-3.5 text-caption")}>
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <SlotPicker
          compact
          days={days}
          value={slot}
          onValueChange={setSlot}
          dayLabel={copy.panel.day}
          timeLabel={copy.panel.time}
          openLabel={copy.panel.open}
        />
      </div>

      <p className="mt-5 text-neutral-500 text-caption">
        <HugeiconsIcon aria-hidden="true" icon={Shield01Icon} strokeWidth={1.8} className="mr-1.5 inline size-3.5 -translate-y-px" />
        {copy.panel.insurance} ·{" "}
        <Link href={copy.panel.checkPlan.href} className={cn("rounded-sm text-neutral-950 underline underline-offset-4", focusRing.dark)}>
          {copy.panel.checkPlan.label}
        </Link>
      </p>

      {href ? (
        <Button size="xl" nativeButton={false} render={<Link href={href} />} className="mt-4 w-full">
          {copy.panel.continue}
        </Button>
      ) : (
        <Button size="xl" disabled className="mt-4 w-full">
          {copy.panel.pickTime}
        </Button>
      )}
      <p className="mt-3 text-center text-neutral-500 text-micro">{copy.panel.cancellation}</p>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function DoctorProfile({ doctorId }: { doctorId: string }) {
  const reduceMotion = useReducedMotion()
  const doctor = doctors.find((d) => d.id === doctorId)!
  const profile = doctorProfiles[doctor.id]
  const sp = specialtyProfiles[doctor.specialtyId]
  const specialty = specialties.find((s) => s.id === doctor.specialtyId)
  const clinic = clinicFor(doctor.location)
  const name = shortName(doctor)
  const reviews = reviewsFor(doctor)
  const plans = INSURANCE_SHOWN.flatMap((n) => insurancePlans.find((p) => p.number === n)?.name ?? [])
  const similar = [
    ...doctors.filter((d) => d.id !== doctor.id && d.specialtyId === doctor.specialtyId),
    ...doctors.filter((d) => d.id !== doctor.id && d.specialtyId !== doctor.specialtyId && d.location === doctor.location),
  ].slice(0, 3)

  const facts = [
    { icon: Calendar03Icon, label: copy.facts.experience, value: copy.factValues.years(doctor.yearsExperience) },
    { icon: UserMultipleIcon, label: copy.facts.patients, value: copy.factValues.patients(profile.patients) },
    { icon: Clock01Icon, label: copy.facts.visit, value: sp.visitLength },
    { icon: Mail01Icon, label: copy.facts.response, value: copy.factValues.response },
  ]

  const badges = [
    doctor.acceptingNewPatients && { icon: Tick02Icon, label: copy.badges.accepting, tone: "bg-emerald-50 text-emerald-800" },
    profile.videoVisits && { icon: Video01Icon, label: copy.badges.video, tone: "bg-neutral-100 text-neutral-700" },
    { icon: UserMultipleIcon, label: sp.ages, tone: "bg-neutral-100 text-neutral-700" },
  ].filter((b): b is { icon: typeof Tick02Icon; label: string; tone: string } => !!b)

  return (
    <main className="lg:pb-16">
      <div className={cn(container, pageTop)}>
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList className="text-neutral-500 text-caption">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={copy.breadcrumbRoot.href} />}>{copy.breadcrumbRoot.label}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={copy.specialtyHref(doctor.specialtyId)} />}>{doctor.specialty}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-neutral-950">{doctor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/*
          One booking panel for every screen size: on phones and tablets it follows the hero; on
          desktop it sits in the right column, spanning every main-column row, and stays in view.
        */}
        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-14">
          {/* Hero */}
          <motion.div
            variants={stagger(0.08)}
            {...revealOnView(reduceMotion, 0.2)}
            className="grid gap-8 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:items-end lg:col-start-1"
          >
            <motion.div variants={fadeUp}>
              <Media
                image={doctor.image}
                alt={doctorsCopy.portraitAlt(doctor.name)}
                placeholder={doctor.placeholder}
                sizes="(min-width: 640px) 260px, 100vw"
                preload
                className={cn("aspect-4/5 rounded-[28px]", portraitBackdrop)}
                imageClassName="mix-blend-multiply object-[50%_20%]"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="flex min-w-0 flex-col">
              <ul className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <li key={b.label} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1", b.tone, "text-caption")}>
                    <HugeiconsIcon aria-hidden="true" icon={b.icon} strokeWidth={1.8} className="size-3.5" />
                    {b.label}
                  </li>
                ))}
              </ul>
              <h1 className="mt-4 text-balance text-neutral-950 text-display">
                {doctor.name}, {doctor.credentials}
              </h1>
              <p className="mt-3 text-neutral-500 text-lead">{copy.title(doctor.specialty, doctor.yearsExperience)}</p>

              <ul className="mt-5 flex flex-col gap-1.5 text-neutral-700 text-body">
                <li className="flex items-center gap-2">
                  <Stars rating={doctor.rating} />
                  <span className="text-neutral-950">{doctor.rating.toFixed(1)}</span>
                  <span className="text-neutral-500">· {copy.reviewsCount(doctor.reviewCount)}</span>
                </li>
                <li className="flex items-center gap-2">
                  <HugeiconsIcon aria-hidden="true" icon={Location01Icon} strokeWidth={1.8} className="size-4 text-neutral-400" />
                  {locationName(doctor.location)}
                </li>
                <li className="flex items-center gap-2">
                  <HugeiconsIcon aria-hidden="true" icon={UserMultipleIcon} strokeWidth={1.8} className="size-4 text-neutral-400" />
                  {doctor.languages.join(", ")}
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button size="xl" nativeButton={false} render={<a href="#book" />}>
                  {copy.book}
                </Button>
                <Button variant="outline" size="xl" nativeButton={false} render={<a href={`mailto:${clinic.email}`} />}>
                  <HugeiconsIcon aria-hidden="true" icon={Mail01Icon} strokeWidth={1.8} data-icon="inline-start" />
                  {copy.message}
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <aside aria-label={copy.panel.heading(name)} className="lg:col-start-2 lg:row-span-8 lg:row-start-1">
            <div className="lg:sticky lg:top-28">
              <BookingPanel doctor={doctor} videoVisits={profile.videoVisits} />
            </div>
          </aside>

          <Section id="about" className="lg:col-start-1" title={copy.about(name)}>
            <blockquote className="max-w-2xl text-pretty text-neutral-950 text-heading">“{doctor.quote}”</blockquote>
            <p className="mt-6 max-w-2xl text-pretty text-neutral-600 text-body">{profile.bio}</p>
            <ul className="mt-8 grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {facts.map((f) => (
                <li key={f.label} className="flex flex-col gap-3 rounded-[20px] bg-neutral-50 p-4">
                  <HugeiconsIcon aria-hidden="true" icon={f.icon} strokeWidth={1.6} className="size-[18px] text-neutral-500" />
                  <span>
                    <span className="block text-neutral-500 text-caption">{f.label}</span>
                    <span className="block text-neutral-950 text-body">{f.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="focus" className="lg:col-start-1" title={copy.focusTitle}>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {profile.focus.map((f) => (
                <li key={f} className="flex items-start gap-3 text-neutral-800 text-body">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-neutral-950 text-white">
                    <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2.2} className="size-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="education" className="lg:col-start-1" title={copy.educationTitle}>
            <dl className="divide-y divide-neutral-200 border-y border-neutral-200">
              {educationFor(doctor, profile).map((row) => (
                <div key={row.type} className="grid gap-1 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6 text-body">
                  <dt className="text-neutral-500">{row.type}</dt>
                  <dd className="text-neutral-950">{row.details}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-neutral-400 text-caption">{copy.educationNote}</p>
          </Section>

          <Section id="insurance" className="lg:col-start-1" title={copy.insuranceTitle}>
            <ul className="flex flex-wrap gap-1.5">
              {plans.map((p) => (
                <li key={p} className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-800 text-caption">
                  {p}
                </li>
              ))}
              <li className="px-1 py-1.5 text-neutral-500 text-caption">{copy.insuranceMore}</li>
            </ul>
            <Link
              href={copy.panel.checkPlan.href}
              className={cn("mt-5 inline-flex items-center gap-1 rounded-sm text-neutral-950 underline underline-offset-4 text-body", focusRing.dark)}
            >
              {copy.panel.checkPlan.label}
              <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} className="size-4" />
            </Link>
          </Section>

          <Section id="where" className="lg:col-start-1" title={copy.whereTitle(name)}>
            <div className="grid gap-6 rounded-[24px] bg-neutral-50 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-6">
              <div>
                <p className="text-neutral-950 text-lead">{locationName(doctor.location)}</p>
                <p className="mt-1 text-neutral-500 text-body">{clinic.address}</p>
                <dl className="mt-4 flex flex-col gap-1 text-body">
                  {clinic.hours.map((h) => (
                    <div key={h.days} className="flex gap-3">
                      <dt className="w-28 shrink-0 text-neutral-500">{h.days}</dt>
                      <dd className="text-neutral-950">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<a href={directionsHref(clinic)} target="_blank" rel="noopener noreferrer" />}
                  className="rounded-full text-caption"
                >
                  {copy.directions}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={<Link href={copy.clinicHref(doctor.location)} />}
                  className="rounded-full bg-white text-caption"
                >
                  {copy.viewClinic}
                </Button>
              </div>
            </div>
          </Section>

          <Section id="reviews" className="lg:col-start-1" title={copy.reviewsTitle}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-3">
                <span className="text-neutral-950 text-display">{doctor.rating.toFixed(1)}</span>
                <span>
                  <Stars rating={doctor.rating} />
                  <span className="mt-1 block text-neutral-500 text-caption">
                    {copy.reviewsSummary(doctor.rating.toFixed(1), doctor.reviewCount)}
                  </span>
                </span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {sp.highlights.map((h) => (
                  <li key={h} className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700 text-caption">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <ul className="mt-6 grid gap-2.5 md:grid-cols-2">
              {reviews.map((r) => (
                <li key={r.name} className="flex flex-col gap-4 rounded-[20px] border border-neutral-200 p-5">
                  <Stars rating={r.rating} />
                  <p className="text-pretty text-neutral-950 text-body">“{r.text}”</p>
                  <p className="mt-auto text-neutral-500 text-caption">
                    {r.name}, {r.location} · {r.date}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-neutral-500 text-caption">{copy.reviewsShowing(reviews.length, doctor.reviewCount)}</p>
          </Section>

          <Section id="faq" className="lg:col-start-1" title={copy.faqTitle(name)}>
            <FaqAccordion items={faqsFor(doctor, profile)} idPrefix="q" size="compact" />
          </Section>
        </div>

        {/* Similar doctors */}
        <Section id="similar" title={copy.similarTitle} className="mt-16">
          <ul className="grid gap-2.5 sm:grid-cols-3">
            {similar.map((d) => (
              <li key={d.id}>
                <Link
                  href={d.href}
                  className={cn("group flex items-center gap-4 rounded-[24px] border border-neutral-200 p-3 transition-colors hover:bg-neutral-50", focusRing.dark)}
                >
                  <Media
                    image={d.image}
                    alt=""
                    placeholder={d.placeholder}
                    sizes="80px"
                    className={cn("size-20 shrink-0 rounded-2xl", portraitBackdrop)}
                    imageClassName="mix-blend-multiply object-[50%_18%]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-neutral-950 text-body">
                      {d.name}, {d.credentials}
                    </span>
                    <span className="block text-neutral-500 text-caption">
                      {d.specialty} · {d.location}
                    </span>
                    <span className="mt-1 block text-emerald-700 text-caption">{copy.next(d.slots[0].label)}</span>
                  </span>
                  <HugeiconsIcon aria-hidden="true"
                    icon={ArrowRight01Icon}
                    strokeWidth={1.8}
                    className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
          {specialty && (
            <Link
              href={copy.specialtyHref(specialty.id)}
              className={cn("mt-5 inline-flex items-center gap-1 rounded-sm text-neutral-950 underline underline-offset-4 text-body", focusRing.dark)}
            >
              {copy.allInSpecialty(specialty.name)}
              <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} className="size-4" />
            </Link>
          )}
        </Section>
      </div>

      {/* Phones and tablets: book bar pinned to the bottom while the profile is on screen (sticky, so it stops before the footer). */}
      <div className="sticky bottom-0 z-40 mt-6 border-t border-neutral-200 bg-white/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <Button size="xl" nativeButton={false} render={<a href="#book" />} className="w-full">
          {copy.panel.heading(name)}
        </Button>
      </div>
    </main>
  )
}

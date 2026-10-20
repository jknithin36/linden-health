"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CalendarCheckIn01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Facebook01Icon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  Video01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { fadeUp, revealOnView, useReducedMotion } from "@/lib/motion"
import { container, focusRing } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AppStoreLogo, GooglePlayLogo } from "@/components/site/icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  cta,
  ctaPhoto,
  ctaPlaceholder,
  footerColumns,
  footerCopy,
  connectUnderColumn,
  legalLinks,
  socialLinks,
  type FooterColumn,
  type SocialIcon,
} from "@/lib/data/footer"
import { prefetchFor } from "@/lib/data/preview"

const CHECK_ICONS = {
  "no-referral": CheckmarkCircle02Icon,
  video: Video01Icon,
  results: CalendarCheckIn01Icon,
} as const

const SOCIAL_ICONS: Record<SocialIcon, typeof NewTwitterIcon> = {
  x: NewTwitterIcon,
  instagram: InstagramIcon,
  linkedin: Linkedin01Icon,
  facebook: Facebook01Icon,
}

const emailSchema = z.object({ email: z.email(footerCopy.emailError) })

/* ----------------------------------------------------------------------------
 * CTA on the full-screen photo
 * ------------------------------------------------------------------------- */

function CtaPhoto() {
  if (!ctaPhoto) {
    return <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: ctaPlaceholder }} />
  }
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={ctaPhoto.desktop} />
      <source media="(min-width: 640px)" srcSet={ctaPhoto.tablet} />
      <img src={ctaPhoto.mobile} alt={ctaPhoto.alt} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
    </picture>
  )
}

function Cta({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="sticky top-0 z-0 h-svh overflow-hidden bg-neutral-900">
      <CtaPhoto />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-black/55 via-black/20 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 from-0% via-black/50 via-40% to-transparent to-65% sm:hidden" />

      <motion.div
        variants={fadeUp}
        {...revealOnView(reduceMotion, 0.5)}
        className={cn(container, "relative flex h-full flex-col justify-end pb-12 sm:justify-center sm:pb-0")}
      >
        <p className="flex items-center gap-1.5 text-white/90 text-caption">
          <HugeiconsIcon aria-hidden="true" icon={Clock01Icon} strokeWidth={1.8} className="size-4" />
          {cta.eyebrow}
        </p>

        <h2 className="mt-6 max-w-[11em] text-white text-display">
          {cta.heading}
        </h2>

        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-white/90 text-caption">
          {cta.checks.map((check) => (
            <li key={check.id} className="flex items-center gap-2">
              <HugeiconsIcon aria-hidden="true" icon={CHECK_ICONS[check.id]} strokeWidth={1.8} className="size-[18px]" />
              {check.label}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button variant="inverse" size="2xl" nativeButton={false} render={<Link href={cta.primary.href} />}>
            {cta.primary.label}
          </Button>
          <Button variant="glass" size="2xl" nativeButton={false} render={<Link href={cta.secondary.href} />}>
            {cta.secondary.label}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Footer pieces
 * ------------------------------------------------------------------------- */

function NewsletterForm() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const inputId = React.useId()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = emailSchema.safeParse({ email: email.trim() })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? footerCopy.emailError)
      return
    }
    // Demo: nothing is sent. Replace with a POST to your newsletter provider (e.g. /api/newsletter).
    setError(null)
    setDone(true)
  }

  return (
    <div className="mt-6" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p
            key="done"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-14 items-center gap-3 rounded-full bg-emerald-50 px-5 text-neutral-950 text-body"
          >
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-emerald-600 text-white">
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2.2} className="size-3.5" />
            </span>
            {footerCopy.success}
          </motion.p>
        ) : (
          <motion.form key="form" exit={{ opacity: 0 }} onSubmit={submit} noValidate className="max-w-md">
            <Field data-invalid={error ? true : undefined} className="gap-2">
              <FieldLabel htmlFor={inputId} className="sr-only">
                {footerCopy.emailLabel}
              </FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={inputId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={footerCopy.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  aria-invalid={error ? true : undefined}
                  className="h-14 border-transparent bg-neutral-100 px-6 text-body sm:flex-1"
                />
                <Button type="submit" size="2xl" className="shrink-0 px-7">
                  {footerCopy.signUp}
                </Button>
              </div>
              {error && <FieldError className="pl-6 text-caption">{error}</FieldError>}
            </Field>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Decorative placeholder QR: a fixed pattern with three finder squares. Not a real code. */
const QR_SIZE = 21

const QR_CELLS = (() => {
  const finder = (x: number, y: number) => x < 7 && y < 7
  const inFinder = (x: number, y: number) =>
    finder(x, y) || finder(QR_SIZE - 1 - x, y) || finder(x, QR_SIZE - 1 - y)
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      // Deterministic fill so server and client render the same pattern.
      if (!inFinder(x, y) && (x * 7 + y * 13 + x * y * 3) % 5 < 2) cells.push({ x, y })
    }
  }
  return cells
})()

function QrFinder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={7} height={7} rx={1.6} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.1} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.7} fill="currentColor" />
    </g>
  )
}

function PlaceholderQr() {
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} aria-hidden="true" className="hidden size-24 shrink-0 text-neutral-950 sm:block">
      {QR_CELLS.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x + 0.1} y={c.y + 0.1} width={0.8} height={0.8} rx={0.2} fill="currentColor" />
      ))}
      <QrFinder x={0} y={0} />
      <QrFinder x={QR_SIZE - 7} y={0} />
      <QrFinder x={0} y={QR_SIZE - 7} />
    </svg>
  )
}

type StoreBadgeProps = { logo: React.ReactNode; top: string; bottom: string; href: string }

function StoreBadge({ logo, top, bottom, href }: StoreBadgeProps) {
  return (
    <Button size="xl" nativeButton={false} render={<a href={href} />} className="gap-2.5 rounded-xl px-4">
      {logo}
      <span className="flex flex-col text-left">
        <span className="text-white/70 text-micro">{top}</span>
        <span className="text-caption">{bottom}</span>
      </span>
    </Button>
  )
}

function AppBlock() {
  return (
    <div className="mt-10 flex max-w-md items-center gap-5 rounded-2xl border border-neutral-200 p-4">
      <PlaceholderQr />
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <p className="text-neutral-950 text-body">{footerCopy.appTitle}</p>
          <p className="text-neutral-500 text-caption">{footerCopy.appBody}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StoreBadge logo={<AppStoreLogo className="size-6" />} {...footerCopy.stores.apple} />
          <StoreBadge logo={<GooglePlayLogo className="h-6 w-auto" />} {...footerCopy.stores.google} />
        </div>
      </div>
    </div>
  )
}

const linkClass = cn(
  "rounded-sm text-neutral-900 underline-offset-4 hover:underline text-body",
  focusRing.dark
)

function LinkList({ column }: { column: FooterColumn }) {
  return (
    <ul className="space-y-3.5">
      {column.links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} prefetch={prefetchFor(link.href)} className={linkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SocialList() {
  return (
    <ul className="space-y-3.5">
      {socialLinks.map((social) => (
        <li key={social.label}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={footerCopy.opensInNewTab(social.label)}
            className={cn("inline-flex items-center gap-2", linkClass)}
          >
            <HugeiconsIcon aria-hidden="true" icon={SOCIAL_ICONS[social.icon]} strokeWidth={1.6} className="size-4" />
            {social.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

const columnTitle = cn("mb-5 text-neutral-400 text-caption")

function LinkColumns() {
  return (
    <>
      {/* Tablet & desktop: columns */}
      <div className="hidden gap-x-8 gap-y-12 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className={columnTitle}>{column.title}</h3>
            <LinkList column={column} />
            {column.title === connectUnderColumn && (
              <div className="mt-10">
                <h3 className={columnTitle}>{footerCopy.connectTitle}</h3>
                <SocialList />
              </div>
            )}
          </nav>
        ))}
      </div>

      {/* Mobile: accordion sections */}
      <Accordion className="sm:hidden">
        {footerColumns.map((column) => (
          <AccordionItem key={column.title} value={column.title} className="border-neutral-200 data-open:bg-transparent">
            <AccordionTrigger className="py-4 text-neutral-950 hover:no-underline text-body">
              {column.title}
            </AccordionTrigger>
            <AccordionContent className="[&_a]:no-underline [&_a]:hover:underline">
              <nav aria-label={column.title} className="pb-4">
                <LinkList column={column} />
              </nav>
            </AccordionContent>
          </AccordionItem>
        ))}
        <AccordionItem value="connect" className="border-neutral-200 data-open:bg-transparent">
          <AccordionTrigger className="py-4 text-neutral-950 hover:no-underline text-body">
            {footerCopy.connectTitle}
          </AccordionTrigger>
          <AccordionContent className="[&_a]:no-underline [&_a]:hover:underline">
            <div className="pb-4">
              <SocialList />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  )
}

function FooterCard({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = React.useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.97, 1])

  return (
    <motion.footer
      ref={ref}
      style={reduceMotion ? undefined : { scale }}
      className="relative z-10 mx-4 mb-4 origin-top rounded-[32px] bg-white p-8 md:mx-6 md:mb-6 md:p-16"
    >
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" aria-label={footerCopy.homeLabel} className={cn("inline-block rounded-sm", focusRing.dark)}>
            <Image
              src={site.logo.dark}
              alt=""
              width={site.logo.width}
              height={site.logo.height}
              className="h-8 w-auto"
            />
          </Link>
          <p className="mt-8 max-w-md text-body">
            <span className="text-neutral-900">{footerCopy.guideLead}</span>
            <span className="text-neutral-500">{footerCopy.guideRest}</span>
          </p>
          <NewsletterForm />
          <AppBlock />
        </div>

        <div className="lg:col-span-7">
          <LinkColumns />
        </div>
      </div>

      <div className="mt-16 border-t border-neutral-200 pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-neutral-400 text-caption">{footerCopy.copyright}</p>
          <nav aria-label={footerCopy.legalLabel}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-neutral-500 text-caption">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} prefetch={prefetchFor(link.href)} className={cn("rounded-sm underline-offset-4 hover:underline", focusRing.dark)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-6 text-neutral-400 text-micro">{footerCopy.disclaimer}</p>
      </div>
    </motion.footer>
  )
}

/** Full-screen CTA photo that stays put while the white footer card scrolls up over it. */
export function CtaFooter() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative mt-4">
      <Cta reduceMotion={reduceMotion} />
      <FooterCard reduceMotion={reduceMotion} />
    </div>
  )
}

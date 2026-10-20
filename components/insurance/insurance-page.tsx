"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Call02Icon, Message01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE, fadeUp, revealOnView, stagger, useReducedMotion } from "@/lib/motion"
import { chip, container, headerGap, panel, sectionY } from "@/lib/styles"
import { site } from "@/lib/data/site"
import {
  billingContact,
  coverageSteps,
  estimateCost,
  estimateVisits,
  formatPrice,
  insuranceCopy,
  insuranceFaqs,
  insuranceHeading,
  insuranceIntro,
  insuranceLabel,
  insurancePlans,
  insuranceTrust,
  planByName,
  planCategories,
  selfPayPrices,
  type PlanCategory,
  type VisitType,
} from "@/lib/data/insurance"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PlanCombobox } from "@/components/insurance/plan-combobox"
import { FaqAccordion } from "@/components/site/faq-accordion"
import { SectionHeader } from "@/components/site/section-header"
import { CoverageTool } from "@/components/insurance/coverage-tool"
import { HelpPoints } from "@/components/insurance/help-points"
import { PriceList } from "@/components/insurance/price-list"

const HERO_IMAGE = { src: "/images/insurance/hero.webp", alt: "A family walking hand in hand through a green field" }

/* ----------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------- */

function Hero() {
  return (
    <section
      aria-labelledby="insurance-page-heading"
      className={cn(panel, "relative flex min-h-[min(720px,calc(100svh-88px-16px))] overflow-hidden bg-neutral-800")}
    >
      <Image src={HERO_IMAGE.src} alt={HERO_IMAGE.alt} fill preload sizes="calc(100vw - 32px)" className="object-cover object-[50%_35%]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 hidden bg-linear-to-r from-black/65 from-0% via-black/30 via-40% to-transparent to-70% sm:block" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 from-0% via-black/35 via-45% to-transparent to-75% sm:from-black/40 sm:via-transparent sm:via-40%" />
      </div>

      <div className={cn(container, "relative flex flex-col justify-end gap-6 pt-24 pb-10 sm:justify-center sm:pb-16")}>
        <p className="text-white/80 text-caption">{insuranceLabel}</p>
        <h1 id="insurance-page-heading" className="max-w-[12em] text-white text-display">
          {insuranceHeading}
        </h1>
        <p className="max-w-md text-white/90 text-body">{insuranceIntro}</p>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-white/90 text-caption">
          {insuranceTrust.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * All 40 plans: filter + search + grouped tables
 * ------------------------------------------------------------------------- */

const ALL = "all"

function PlansDirectory() {
  const [category, setCategory] = React.useState<PlanCategory | typeof ALL>(ALL)
  const [query, setQuery] = React.useState("")
  const searchId = React.useId()

  const q = query.trim().toLowerCase()
  const groups = planCategories
    .filter((c) => category === ALL || c.id === category)
    .map((c) => ({
      ...c,
      plans: insurancePlans.filter(
        (p) =>
          p.category === c.id &&
          (!q || p.name.toLowerCase().includes(q) || p.types.some((t) => t.toLowerCase().includes(q)))
      ),
    }))
    .filter((g) => g.plans.length > 0)
  const shown = groups.reduce((n, g) => n + g.plans.length, 0)

  const head = "h-auto px-0 py-2.5 text-neutral-500 text-caption"
  const cell = "px-0 py-3.5 align-top whitespace-normal text-neutral-950 text-body"

  return (
    <section id="plans" aria-labelledby="plans-heading" className={cn("scroll-mt-24", sectionY)}>
      <div className={container}>
        <SectionHeader id="plans-heading" align="start" heading={insuranceCopy.plansTitle} />

        <div className={cn(headerGap, "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between")}>
          <ToggleGroup
            aria-label={insuranceCopy.plansTitle}
            value={[category]}
            onValueChange={(value: string[]) => {
              const next = value[value.length - 1] as PlanCategory | typeof ALL | undefined
              if (next) setCategory(next)
            }}
            className="-mx-6 w-auto flex-nowrap overflow-x-auto overflow-y-hidden px-6 scrollbar-none lg:mx-0 lg:flex-wrap lg:px-0"
          >
            <ToggleGroupItem value={ALL} className={cn(chip, "text-caption")}>
              {insuranceCopy.plansAll}
            </ToggleGroupItem>
            {planCategories.map((c) => (
              <ToggleGroupItem key={c.id} value={c.id} className={cn(chip, "text-caption")}>
                {c.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="relative w-full lg:w-72">
            <label htmlFor={searchId} className="sr-only">
              {insuranceCopy.plansSearch}
            </label>
            <HugeiconsIcon aria-hidden="true"
              icon={Search01Icon}
              strokeWidth={1.8}
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-400"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={insuranceCopy.plansSearchPlaceholder}
              autoComplete="off"
              className="h-11 rounded-full border-transparent bg-neutral-100 pr-4 pl-10 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-neutral-950/15 text-body"
            />
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {insuranceCopy.plansShown(shown)}
        </p>

        <div className="mt-10 flex flex-col gap-12">
          {groups.length === 0 && <p className="text-neutral-500 text-body">{insuranceCopy.plansEmpty}</p>}
          {groups.map((g) => (
            <div key={g.id}>
              <h3 className="text-neutral-500 text-caption">{g.title}</h3>
              <Table className="mt-3 table-fixed">
                <TableHeader>
                  <TableRow className="border-neutral-200 hover:bg-transparent">
                    <TableHead className={cn(head, "w-10")}>{insuranceCopy.plansColumns.number}</TableHead>
                    <TableHead className={head}>{insuranceCopy.plansColumns.insurer}</TableHead>
                    <TableHead className={cn(head, "hidden sm:table-cell")}>{insuranceCopy.plansColumns.types}</TableHead>
                    <TableHead className={cn(head, "w-36 text-right sm:w-48")}>{insuranceCopy.plansColumns.coverage}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.plans.map((p) => (
                    <TableRow key={p.number} className="border-neutral-200 hover:bg-neutral-50">
                      <TableCell className={cn(cell, "text-neutral-400 tabular-nums")}>{p.number}</TableCell>
                      <TableCell className={cell}>
                        {p.name}
                        {/* Phones: plan types under the name */}
                        <span className="mt-0.5 block text-neutral-500 sm:hidden text-caption">{p.types.join(", ")}</span>
                      </TableCell>
                      <TableCell className={cn(cell, "hidden text-neutral-600 sm:table-cell")}>{p.types.join(", ")}</TableCell>
                      <TableCell className={cn(cell, "text-right")}>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1",
                            p.locations === "all" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
                            "text-caption"
                          )}
                        >
                          {p.locations === "all" ? insuranceCopy.allLocations : p.locations.join(", ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>

        <p className="mt-10 text-neutral-500 text-body">
          {insuranceCopy.notListed(billingContact.phone.display)}
        </p>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * How coverage works
 * ------------------------------------------------------------------------- */

function CoverageSteps() {
  const reduceMotion = useReducedMotion()
  return (
    <section aria-labelledby="steps-heading" className={cn(panel, "bg-neutral-50", sectionY)}>
      <div className={container}>
        <SectionHeader id="steps-heading" align="start" heading={insuranceCopy.stepsTitle} />
        <motion.ol
          variants={stagger(0.1)}
          {...revealOnView(reduceMotion, 0.3)}
          className={cn(headerGap, "grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6")}
        >
          {coverageSteps.map((step, i) => (
            <motion.li key={step.title} variants={fadeUp} className="flex flex-col border-t border-neutral-300 pt-5">
              <span className="text-neutral-400 tabular-nums text-caption">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-neutral-950 text-title">{step.title}</h3>
              <p className="mt-2 text-neutral-500 text-body">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Cost estimator + self-pay prices
 * ------------------------------------------------------------------------- */

const planOptions = insurancePlans.map((p) => p.name)

function CostEstimator() {
  const [visit, setVisit] = React.useState<VisitType>("sick")
  const [planName, setPlanName] = React.useState<string | null>(insurancePlans[0].name)
  const planLabelId = React.useId()
  const visitLabelId = React.useId()

  const p = planName ? planByName(planName) : undefined
  const estimate = p ? estimateCost(visit, p) : null
  const selfPay = selfPayPrices.find((s) => s.id === visit)?.price ?? 0

  return (
    <div className="flex flex-col">
      <h3 className="text-neutral-950 text-title">{insuranceCopy.estimateTitle}</h3>

      <Field className="mt-6">
        <FieldTitle id={visitLabelId} className="text-neutral-600 text-caption">
          {insuranceCopy.estimateVisitLabel}
        </FieldTitle>
        <ToggleGroup
          aria-labelledby={visitLabelId}
          value={[visit]}
          onValueChange={(value: string[]) => {
            const next = value[value.length - 1] as VisitType | undefined
            if (next) setVisit(next)
          }}
          className="flex-wrap"
        >
          {estimateVisits.map((v) => (
            <ToggleGroupItem key={v.id} value={v.id} className={cn(chip, "bg-white text-caption")}>
              {v.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field className="mt-5">
        <FieldLabel htmlFor={planLabelId} className="text-neutral-600 text-caption">
          {insuranceCopy.estimatePlanLabel}
        </FieldLabel>
        <PlanCombobox
          id={planLabelId}
          items={planOptions}
          value={planName}
          onValueChange={setPlanName}
          placeholder={insuranceCopy.plansSearchPlaceholder}
          emptyText={insuranceCopy.plansEmpty}
        />
      </Field>

      <div aria-live="polite" className="mt-6 grid grid-cols-2 gap-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${visit}-${planName ?? "none"}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="col-span-2 grid grid-cols-2 gap-2.5"
          >
            <div className="rounded-2xl bg-neutral-950 p-5 text-white">
              <p className="text-white/60 text-caption">{insuranceCopy.estimateWithPlan}</p>
              <p className="mt-2 whitespace-nowrap tabular-nums text-heading">
                {estimate ? formatPrice(estimate.withPlan) : "—"}
                {estimate && estimate.withPlan > 0 && <span className="ml-1.5 text-white/60 text-body">{insuranceCopy.copay}</span>}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-950/[0.06]">
              <p className="text-neutral-500 text-caption">{insuranceCopy.estimateWithout}</p>
              <p className="mt-2 text-neutral-950 tabular-nums text-heading">{formatPrice(selfPay)}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-3 text-neutral-500 text-caption">{insuranceCopy.estimateNote}</p>
    </div>
  )
}

function CostsAndPrices() {
  return (
    <section aria-labelledby="costs-heading" className={sectionY}>
      <h2 id="costs-heading" className="sr-only">
        {insuranceCopy.costsHeading}
      </h2>
      <div className={cn(container, "grid gap-16 lg:grid-cols-2")}>
        <div className="rounded-[24px] bg-neutral-50 p-6 sm:p-8">
          <CostEstimator />
        </div>
        <div id="self-pay-prices" className="scroll-mt-28">
          <h3 className="text-neutral-950 text-title">{insuranceCopy.pricesTitle}</h3>
          <p className="mt-2 max-w-sm text-neutral-500 text-body">{insuranceCopy.pricesIntro}</p>
          <PriceList className="mt-6" items={selfPayPrices.map((s) => ({ label: s.visit, value: formatPrice(s.price) }))} />
          <p className="mt-4 text-neutral-500 text-caption">{insuranceCopy.paymentPlans}</p>
        </div>
      </div>
      <div className={container}>
        <HelpPoints className="mt-16" />
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * FAQs + contact
 * ------------------------------------------------------------------------- */

function FaqAndContact() {
  return (
    <section aria-labelledby="insurance-faq-heading" className={sectionY}>
      <div className={cn(container, "grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-20")}>
        <div className="min-w-0">
          <SectionHeader id="insurance-faq-heading" align="start" heading={insuranceCopy.faqTitle} />
          <FaqAccordion items={insuranceFaqs} idPrefix="insurance-faq" className={headerGap} />
        </div>

        <aside className="flex flex-col gap-6 self-start rounded-[24px] bg-neutral-950 p-6 text-white sm:p-8 lg:sticky lg:top-28">
          <div>
            <h3 className="text-title">{billingContact.heading}</h3>
            <p className="mt-2 text-white/70 text-body">{billingContact.body}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="inverse" size="xl" nativeButton={false} render={<a href={`tel:${billingContact.phone.tel}`} />} className="justify-start">
              <HugeiconsIcon aria-hidden="true" icon={Call02Icon} strokeWidth={1.8} data-icon="inline-start" />
              {billingContact.call(billingContact.phone.display)}
            </Button>
            <Button variant="glass" size="xl" nativeButton={false} render={<Link href={billingContact.message.href} />} className="justify-start">
              <HugeiconsIcon aria-hidden="true" icon={Message01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {billingContact.message.label}
            </Button>
          </div>
          <p className="text-white/50 text-micro">{insuranceCopy.disclaimer}</p>
        </aside>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function InsurancePage() {
  return (
    <main className="flex flex-col gap-4 pb-4">
      <Hero />
      <section aria-labelledby="checker-heading" className={cn(panel, "bg-neutral-50", sectionY)}>
        <div className={container}>
          <CoverageTool
            withMemberId
            header={
              <SectionHeader
                id="checker-heading"
                align="start"
                heading={insuranceCopy.checkerTitle}
                intro={insuranceCopy.checkerIntro(insurancePlans.length, site.name)}
              />
            }
          />
        </div>
      </section>
      <PlansDirectory />
      <CoverageSteps />
      <CostsAndPrices />
      <FaqAndContact />
    </main>
  )
}

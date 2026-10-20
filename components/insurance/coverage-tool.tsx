"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  MultiplicationSignIcon,
  Tick02Icon,
  ContrastIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE } from "@/lib/motion"
import { chip, glass } from "@/lib/styles"
import {
  billingContact,
  checkCoverage,
  checkerPlanNames,
  coverageMessages,
  insuranceCopy,
  insurancePlans,
  planTypes,
  type CoverageResult,
  type CoverageStatus,
  type PlanType,
} from "@/lib/data/insurance"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PlanCombobox } from "@/components/insurance/plan-combobox"

const STATUS_STYLES: Record<CoverageStatus, { badge: string; icon: typeof Tick02Icon; label: string }> = {
  covered: { badge: "bg-emerald-500/90 text-white", icon: Tick02Icon, label: insuranceCopy.card.covered },
  partial: { badge: "bg-amber-300/95 text-neutral-950", icon: ContrastIcon, label: insuranceCopy.card.partial },
  "not-covered": { badge: "bg-white/85 text-neutral-900", icon: MultiplicationSignIcon, label: insuranceCopy.card.notCovered },
}

/* ----------------------------------------------------------------------------
 * Insurance card visual
 * ------------------------------------------------------------------------- */

type CardFaceProps = { provider: string; plan: string; status?: CoverageStatus; memberId?: string }

function CardFace({ provider, plan, status, memberId }: CardFaceProps) {
  const s = status ? STATUS_STYLES[status] : null
  return (
    <div className={cn(glass, "flex aspect-[1.586] w-full flex-col justify-between rounded-[22px] p-4 sm:p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-white/60 text-micro">{insuranceCopy.card.member}</span>
          <span className="truncate text-lead">{provider}</span>
        </div>
        <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-micro">{plan}</span>
      </div>

      <span aria-hidden="true" className="h-7 w-10 rounded-md bg-linear-to-br from-white/50 to-white/15" />

      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col text-white/70 text-caption">
          <span>{insuranceCopy.card.memberName}</span>
          <span className="truncate tabular-nums">{memberId || insuranceCopy.card.memberId}</span>
        </div>
        {s && (
          <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1", s.badge, "text-micro")}>
            <HugeiconsIcon aria-hidden="true" icon={s.icon} strokeWidth={2.2} className="size-3" />
            {s.label}
          </span>
        )}
      </div>
    </div>
  )
}

type CardStackProps = { name: string | null; planType: PlanType | null; memberId: string; result: CoverageResult | null }

function CardStack({ name, planType, memberId, result }: CardStackProps) {
  const front: CardFaceProps = {
    provider: result?.name ?? name ?? insurancePlans[0].name,
    plan: result?.type ?? planType ?? insuranceCopy.card.choosePlan,
    status: result?.status,
    memberId: memberId ? `ID ${memberId}` : undefined,
  }

  return (
    <div
      role="img"
      aria-label={insuranceCopy.card.label}
      className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#d6b08a_0%,#8c5d3f_52%,#2c211b_100%)] px-6 py-14 sm:min-h-[460px] sm:px-14 lg:h-full"
    >
      <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div aria-hidden="true" className="relative w-full max-w-[360px]">
        <div className={cn(glass, "absolute inset-0 translate-x-6 -translate-y-8 rotate-[8deg] rounded-[22px] opacity-60")} />
        <div className={cn(glass, "absolute inset-0 -translate-x-5 -translate-y-4 -rotate-[5deg] rounded-[22px] opacity-80")} />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${front.provider}-${front.plan}-${front.status ?? "none"}`}
            initial={{ opacity: 0, y: 14, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
          >
            <CardFace {...front} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Result message
 * ------------------------------------------------------------------------- */

function ResultMessage({ result }: { result: CoverageResult }) {
  const message =
    result.status === "covered"
      ? coverageMessages.covered(result)
      : result.status === "partial"
        ? coverageMessages.partial(result)
        : coverageMessages.notCovered
  const s = STATUS_STYLES[result.status]
  const action = "rounded-full bg-white text-caption"

  return (
    <motion.div
      key={`${result.name}-${result.type}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex flex-col gap-3"
    >
      <p className="flex gap-3 text-neutral-950 text-body">
        <span aria-hidden="true" className={cn("mt-px grid size-5 shrink-0 place-items-center rounded-full", s.badge)}>
          <HugeiconsIcon aria-hidden="true" icon={s.icon} strokeWidth={2.2} className="size-3" />
        </span>
        <span>
          <strong className="font-emphasis">{message.title}</strong> {message.body}
        </span>
      </p>
      <div className="flex flex-wrap gap-2 pl-8">
        {result.status === "not-covered" ? (
          <>
            <Button variant="outline" size="lg" nativeButton={false} render={<Link href="#self-pay-prices" />} className={action}>
              {insuranceCopy.seeSelfPay}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              nativeButton={false}
              render={<a href={`tel:${billingContact.phone.tel}`} />}
              className="rounded-full text-caption"
            >
              {insuranceCopy.talkToBilling}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href={insuranceCopy.findInNetworkHref(result.name, result.type)} />}
            className={action}
          >
            {result.status === "covered" ? insuranceCopy.findInNetwork : insuranceCopy.seeLocations}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/* ----------------------------------------------------------------------------
 * Coverage tool: form + live insurance card
 * ------------------------------------------------------------------------- */

type CoverageToolProps = {
  /** Shows the optional member ID field (used on /insurance). */
  withMemberId?: boolean
  /** Rendered above the form, e.g. a section header. */
  header?: React.ReactNode
  /** Rendered under the form, e.g. a "see all plans" line. */
  footer?: React.ReactNode
}

export function CoverageTool({ withMemberId = false, header, footer }: CoverageToolProps) {
  const [name, setName] = React.useState<string | null>(null)
  const [planType, setPlanType] = React.useState<PlanType | null>(null)
  const [memberId, setMemberId] = React.useState("")
  const [result, setResult] = React.useState<CoverageResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const ids = { company: React.useId(), plan: React.useId(), member: React.useId() }

  const reset = () => {
    setResult(null)
    setError(null)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name || !planType) {
      setResult(null)
      setError(!name && !planType ? insuranceCopy.errors.both : !name ? insuranceCopy.errors.company : insuranceCopy.errors.plan)
      return
    }
    setError(null)
    // Local lookup against lib/data/insurance. With a backend, call your eligibility check here
    // (e.g. POST /api/coverage with the plan, type and member ID) and show a pending state.
    setResult(checkCoverage(name, planType))
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex min-w-0 flex-col">
        {header}

        <form onSubmit={submit} noValidate className={cn("flex flex-col gap-5", header && "mt-10 md:mt-12")}>
          <Field>
            <FieldLabel htmlFor={ids.company} className="text-neutral-600 text-caption">
              {insuranceCopy.companyLabel}
            </FieldLabel>
            <PlanCombobox
              id={ids.company}
              items={checkerPlanNames}
              value={name}
              onValueChange={(value) => {
                setName(value)
                reset()
              }}
              placeholder={insuranceCopy.companyPlaceholder}
              emptyText={insuranceCopy.companyEmpty}
            />
          </Field>

          <Field>
            <FieldTitle id={ids.plan} className="text-neutral-600 text-caption">
              {insuranceCopy.planLabel}
            </FieldTitle>
            <ToggleGroup
              aria-labelledby={ids.plan}
              value={planType ? [planType] : []}
              onValueChange={(value: string[]) => {
                const next = value[value.length - 1] as PlanType | undefined
                if (next) {
                  setPlanType(next)
                  reset()
                }
              }}
              className="flex-wrap"
            >
              {planTypes.map((p) => (
                <ToggleGroupItem key={p} value={p} className={cn(chip, "bg-white text-caption")}>
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          {withMemberId && (
            <Field>
              <FieldLabel htmlFor={ids.member} className="text-neutral-600 text-caption">
                {insuranceCopy.memberIdLabel}
              </FieldLabel>
              <Input
                id={ids.member}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value.slice(0, 20))}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                className="h-12 rounded-xl bg-white px-4 text-body"
              />
              <FieldDescription className="text-neutral-500 text-caption">{insuranceCopy.memberIdHint}</FieldDescription>
            </Field>
          )}

          <Button type="submit" size="xl" className="self-start">
            {insuranceCopy.checkButton}
            <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" />
          </Button>

          <div aria-live="polite" aria-atomic="true">
            {error && <FieldError className="text-caption">{error}</FieldError>}
            <AnimatePresence mode="wait" initial={false}>
              {result && <ResultMessage result={result} />}
            </AnimatePresence>
          </div>
        </form>

        {footer}
      </div>

      <CardStack name={name} planType={planType} memberId={memberId} result={result} />
    </div>
  )
}

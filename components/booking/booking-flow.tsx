"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, CalendarAdd01Icon, Cancel01Icon, Location01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE, useReducedMotion } from "@/lib/motion"
import { focusRing } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { bookingAccount, bookingCopy as copy } from "@/lib/data/booking"
import type { PersonId } from "@/lib/data/portal"
import { directionsHref } from "@/lib/data/clinics"
import { Button } from "@/components/ui/button"
import { CareStep, DetailsStep, DoctorStep, ReviewStep, TimeStep } from "@/components/booking/booking-steps"
import {
  calendarFile,
  careById,
  clinicLocationFor,
  confirmationFor,
  detailsSchema,
  detailsFor,
  findDoctor,
  slotLabelFor,
  whereFor,
  type BookingState,
  type DetailErrors,
  type Details,
} from "@/components/booking/booking-model"

type BookingProps = { doctor?: string | null; slot?: string | null; visit?: string | null; format?: string | null; reason?: string | null; person?: string | null }

const STEPS = copy.steps
const LAST = STEPS.length - 1

/** Initial state from links around the site (doctor cards, service pages, the portal). */
function initialState(p: BookingProps): { state: BookingState; step: number } {
  const doctor = findDoctor(p.doctor ?? null)
  const care = doctor?.specialtyId ?? (careById(p.visit ?? null) ? p.visit! : null)
  const inPersonOnly = careById(care)?.inPersonOnly
  const format = (p.format === "video" || p.visit === "video") && !inPersonOnly ? "video" : "in-person"
  // Who it's for: ?person=, else the family member whose doctor this is, else the account holder.
  const family = bookingAccount.family
  const person: PersonId = family.find((m) => m.id === p.person)?.id ?? family.find((m) => doctor && m.primaryDoctor.slug === doctor.slug)?.id ?? "sarah"
  const state: BookingState = {
    care,
    format,
    reason: p.reason ?? "",
    person,
    clinic: doctor?.location ?? "all",
    doctorId: doctor?.id ?? null,
    slot: p.slot && slotLabelFor(doctor?.id ?? null, p.slot) ? p.slot : null,
    details: detailsFor(person),
  }
  // Skip what the link already chose.
  const step = state.slot ? 3 : doctor ? 2 : care ? 1 : 0
  return { state, step }
}

/**
 * /book: a focused five-step flow (care → doctor → time → details → review) with a live summary.
 * Every link into it can pre-fill a doctor, slot, service, format or reason.
 */
export function BookingFlow(props: BookingProps) {
  const reduceMotion = useReducedMotion()
  const [{ state, step }, setFlow] = React.useState(() => initialState(props))
  const [errors, setErrors] = React.useState<DetailErrors>({})
  const [done, setDone] = React.useState<string | null>(null)
  const moved = React.useRef(false)
  // Each step's heading takes focus as it mounts (after the exit animation), so keyboard and
  // screen reader users land on the new step. Skipped on first load.
  const headingRef = React.useCallback((el: HTMLHeadingElement | null) => {
    if (el && moved.current) el.focus({ preventScroll: true })
  }, [])

  const set = (patch: Partial<BookingState>) => {
    setFlow((f) => ({ ...f, state: { ...f.state, ...patch } }))
    setErrors((e) => {
      const next = { ...e }
      if (patch.care) delete next.care
      if (patch.slot) delete next.slot
      if (patch.details) for (const k of Object.keys(patch.details) as (keyof Details)[]) if (patch.details[k] !== state.details[k]) delete next[k]
      return next
    })
  }

  const goTo = (n: number) => {
    moved.current = true
    setFlow((f) => ({ ...f, step: Math.max(0, Math.min(LAST, n)) }))
  }

  React.useEffect(() => {
    if (!moved.current) return
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }, [step, done, reduceMotion])

  const validate = (n: number): DetailErrors => {
    if (n === 0 && !state.care) return { care: copy.errors.care }
    if (n === 2 && !state.slot) return { slot: copy.errors.slot }
    if (n === 3) {
      const parsed = detailsSchema.safeParse(state.details)
      if (!parsed.success) {
        const out: DetailErrors = {}
        for (const issue of parsed.error.issues) out[issue.path[0] as keyof Details] ??= issue.message
        return out
      }
    }
    return {}
  }

  const next = () => {
    const e = validate(step)
    setErrors(e)
    if (Object.keys(e).length) {
      // Bring the first problem into view and focus it (or the first control inside its field).
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>("[aria-invalid=true], [data-invalid=true]")
        if (!el) return
        el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" })
        const target = el.matches("input, button, textarea, [tabindex]") ? el : el.querySelector<HTMLElement>("input, button, textarea")
        target?.focus({ preventScroll: true })
      })
      return
    }
    if (step === LAST) {
      // Demo: nothing is sent. With a backend, POST the state (e.g. /api/appointments) and show
      // the confirmation number it returns; keep the button pending while the request runs.
      moved.current = true
      setDone(confirmationFor(state))
      return
    }
    goTo(step + 1)
  }

  const s = STEPS[step]
  const slide = reduceMotion ? {} : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.22, ease: EASE } }

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <FlowHeader step={step} done={!!done} onStep={(n) => n < step && goTo(n)} />

      {done ? (
        <Confirmation
          headingRef={headingRef}
          state={state}
          confirmation={done}
          onAgain={() => {
            setDone(null)
            setFlow(initialState({}))
          }}
        />
      ) : (
        <main id="main" className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 pt-8 pb-36 md:px-8 md:pt-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:pb-16">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
            className="min-w-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.section key={s.id} aria-labelledby="book-step-title" {...slide}>
                <p className="text-neutral-400 tabular-nums text-caption">{copy.progress(step + 1, STEPS.length)}</p>
                <h1 id="book-step-title" ref={headingRef} tabIndex={-1} className="mt-2 text-neutral-950 outline-none text-page">
                  {s.title}
                </h1>
                <p className="mt-1.5 text-pretty text-neutral-500 text-body">{s.intro}</p>
                <div className="mt-8">
                  {step === 0 && <CareStep state={state} set={set} errors={errors} />}
                  {step === 1 && <DoctorStep state={state} set={set} errors={errors} />}
                  {step === 2 && <TimeStep state={state} set={set} errors={errors} />}
                  {step === 3 && <DetailsStep state={state} set={set} errors={errors} goTo={goTo} />}
                  {step === 4 && <ReviewStep state={state} goTo={goTo} />}
                </div>
              </motion.section>
            </AnimatePresence>

            {/* Desktop and tablet: buttons under the step. Phones use the bar fixed to the bottom. */}
            <div className="mt-10 hidden items-center justify-between gap-3 border-t border-neutral-100 pt-6 sm:flex">
              <BackButton step={step} onBack={() => goTo(step - 1)} />
              <Button type="submit" size="xl" className="min-w-40">
                {step === LAST ? copy.review.confirm : copy.next}
                {step !== LAST && <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" />}
              </Button>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200/70 bg-white/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
              <MiniSummary state={state} />
              <div className="mt-3 flex items-center gap-2">
                <BackButton step={step} onBack={() => goTo(step - 1)} compact />
                <Button type="submit" size="xl" className="flex-1">
                  {step === LAST ? copy.review.confirm : copy.next}
                </Button>
              </div>
            </div>
          </form>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <Summary state={state} />
          </aside>
        </main>
      )}
    </div>
  )
}

function BackButton({ step, onBack, compact }: { step: number; onBack: () => void; compact?: boolean }) {
  if (step === 0) return compact ? null : <span />
  return (
    <Button type="button" variant="ghost" size="xl" onClick={onBack} aria-label={compact ? copy.back : undefined} className={cn("text-neutral-600", compact && "w-12 px-0")}>
      <HugeiconsIcon aria-hidden="true" icon={ArrowLeft01Icon} strokeWidth={1.8} data-icon={compact ? undefined : "inline-start"} />
      {!compact && copy.back}
    </Button>
  )
}

/* --------------------------------- Header ---------------------------------- */

function FlowHeader({ step, done, onStep }: { step: number; done: boolean; onStep: (n: number) => void }) {
  const pct = done ? 100 : ((step + 1) / STEPS.length) * 100
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5 md:px-8">
        <Link href="/" aria-label={copy.homeLabel} className={cn("shrink-0 rounded-sm", focusRing.dark)}>
          <Image src={site.logo.dark} alt="" width={site.logo.width} height={site.logo.height} preload className="h-6 w-auto" />
        </Link>
        {!done && (
          <nav aria-label={copy.stepsLabel} className="mx-auto hidden lg:block">
            <ol className="flex items-center gap-1">
              {STEPS.map((x, i) => {
                const state = i < step ? "done" : i === step ? "current" : "todo"
                return (
                  <li key={x.id} className="flex items-center gap-1">
                    {i > 0 && <span aria-hidden="true" className={cn("h-px w-6", i <= step ? "bg-neutral-950" : "bg-neutral-200")} />}
                    <button
                      type="button"
                      onClick={() => onStep(i)}
                      disabled={state !== "done"}
                      aria-current={state === "current" ? "step" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption",
                        state === "current" ? "text-neutral-950" : state === "done" ? "text-neutral-600 hover:text-neutral-950" : "text-neutral-400"
                      )}
                    >
                      <span className={cn("grid size-5 place-items-center rounded-full tabular-nums text-micro", state === "current" ? "bg-neutral-950 text-white" : state === "done" ? "bg-neutral-100 text-neutral-950" : "border border-neutral-200")}>
                        {state === "done" ? <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2.4} className="size-3" /> : i + 1}
                      </span>
                      {x.label}
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={copy.exit.href} />} className="ml-auto h-9 rounded-full px-3 text-neutral-600 text-caption">
          {copy.exit.label}
          <HugeiconsIcon aria-hidden="true" icon={Cancel01Icon} strokeWidth={1.8} data-icon="inline-end" />
        </Button>
      </div>
      <div aria-hidden="true" className="h-0.5 bg-neutral-100 lg:hidden">
        <div className="h-full bg-neutral-950 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </header>
  )
}

/* --------------------------------- Summary --------------------------------- */

function summaryRows(state: BookingState) {
  const doc = findDoctor(state.doctorId)
  const care = careById(state.care)
  const d = state.details
  return [
    { label: copy.review.rows.care, value: care ? `${care.label}${state.format === "video" ? ` · ${copy.videoSuffix}` : ""}` : null },
    { label: copy.review.rows.doctor, value: care ? (doc ? `${doc.name}, ${doc.credentials}` : copy.anyDoctor) : null },
    { label: copy.review.rows.time, value: slotLabelFor(state.doctorId, state.slot) },
    { label: copy.review.rows.where, value: care ? whereFor(state) : null },
    { label: copy.review.rows.patient, value: `${d.firstName} ${d.lastName}`.trim() || null },
  ]
}

function Summary({ state }: { state: BookingState }) {
  const doc = findDoctor(state.doctorId)
  return (
    <section aria-labelledby="book-summary" className="rounded-2xl border border-neutral-200/70 p-5">
      <h2 id="book-summary" className="text-neutral-950 text-body">
        {copy.summary.title}
      </h2>
      {doc?.image && (
        <div className="mt-4 flex items-center gap-3">
          <Image src={doc.image} alt="" width={96} height={96} className="size-11 rounded-full bg-neutral-100 object-cover object-top" />
          <div className="min-w-0">
            <p className="truncate text-neutral-950 text-caption">
              {doc.name}, {doc.credentials}
            </p>
            <p className="truncate text-neutral-500 text-micro">{doc.specialty}</p>
          </div>
        </div>
      )}
      <dl className="mt-4 divide-y divide-neutral-100">
        {summaryRows(state).map((r) => (
          <div key={r.label} className="flex justify-between gap-4 py-2.5">
            <dt className="shrink-0 text-neutral-500 text-caption">{r.label}</dt>
            <dd className={cn("text-right text-pretty text-caption", r.value ? "text-neutral-950" : "text-neutral-400")}>{r.value ?? copy.summary.empty}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-neutral-500 text-micro">
        {copy.summary.insurance}{" "}
        <Link href={copy.summary.checkCoverage.href} className={cn("rounded-sm text-neutral-950 underline underline-offset-4", focusRing.dark)}>
          {copy.summary.checkCoverage.label}
        </Link>
      </p>
    </section>
  )
}

/** One line for the phone bar: what's chosen so far. */
function MiniSummary({ state }: { state: BookingState }) {
  const care = careById(state.care)
  const time = slotLabelFor(state.doctorId, state.slot)
  const doc = findDoctor(state.doctorId)
  const parts = [care?.label, doc ? doc.name : care ? copy.anyDoctor : null, time].filter(Boolean)
  return <p className="truncate text-neutral-600 text-caption">{parts.length ? parts.join(" · ") : copy.summary.empty}</p>
}

/* ------------------------------- Confirmation ------------------------------ */

function Confirmation({ state, confirmation, onAgain, headingRef }: { state: BookingState; confirmation: string; onAgain: () => void; headingRef: React.Ref<HTMLHeadingElement> }) {
  const c = copy.done
  const care = careById(state.care)
  const clinic = clinicLocationFor(state)
  const addToCalendar = () => {
    const ics = calendarFile(state, c.calendarTitle(care?.label))
    if (!ics) return
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = c.calendarFile
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-12 md:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="flex flex-col">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-emerald-600 text-white">
          <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2.4} className="size-5" />
        </span>
        <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-neutral-950 outline-none text-page">
          {c.title}
        </h1>
        <p className="mt-2 text-pretty text-neutral-500 text-body">{c.body(state.details.email)}</p>
        <p className="mt-1 text-neutral-400 tabular-nums text-caption">{c.confirmation(confirmation)}</p>

        <dl className="mt-8 divide-y divide-neutral-100 rounded-2xl border border-neutral-200/70 px-5">
          {summaryRows(state).map((r) => (
            <div key={r.label} className="flex justify-between gap-4 py-3">
              <dt className="text-neutral-500 text-caption">{r.label}</dt>
              <dd className="text-right text-neutral-950 text-caption">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" variant="outline" className="rounded-full px-4 text-caption" onClick={addToCalendar}>
            <HugeiconsIcon aria-hidden="true" icon={CalendarAdd01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {c.addToCalendar}
          </Button>
          {state.format === "in-person" && (
            <Button size="lg" variant="outline" nativeButton={false} render={<a href={directionsHref(clinic)} target="_blank" rel="noopener noreferrer" />} className="rounded-full px-4 text-caption">
              <HugeiconsIcon aria-hidden="true" icon={Location01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {c.directions}
            </Button>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-2.5 border-t border-neutral-100 pt-8 sm:flex-row">
          <Button size="xl" nativeButton={false} render={<Link href={c.portal.href} />} className="sm:flex-1">
            {c.portal.label}
          </Button>
          <Button size="xl" variant="outline" onClick={onAgain} className="sm:flex-1">
            {c.again}
          </Button>
        </div>
        <p className="mt-6 text-neutral-500 text-caption">{c.help}</p>
        <p className="mt-1 text-neutral-400 text-micro">{c.demo}</p>
      </motion.div>
    </main>
  )
}

/** Reads ?doctor= (id or slug), ?slot=, ?service= / ?specialty=, ?format=, ?reason= and ?person=. Wrap in <Suspense>. */
export function BookingFlowWithParams() {
  const params = useSearchParams()
  return <BookingFlow key={params.toString()} doctor={params.get("doctor")} slot={params.get("slot")} visit={params.get("service") ?? params.get("specialty")} format={params.get("format")} reason={params.get("reason")} person={params.get("person")} />
}

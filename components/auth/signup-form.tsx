"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  ImageUpload01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { setSessionRole } from "@/lib/session-client"
import { EASE, fadeUp } from "@/lib/motion"
import { focusRing } from "@/lib/styles"
import { loginCopy, setupCopy, signupCopy as copy } from "@/lib/data/auth"
import { checkerPlanNames } from "@/lib/data/insurance"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError } from "@/components/ui/field"
import { AuthHeader, DateField, PasswordField, SocialButtons, TextField } from "@/components/auth/auth-parts"
import { FilterSelect } from "@/components/site/filter-select"
import { PlanCombobox } from "@/components/insurance/plan-combobox"

/* ----------------------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------------------- */

const passwordRules = {
  length: (p: string) => p.length >= 8,
  number: (p: string) => /\d/.test(p),
  symbol: (p: string) => /[^A-Za-z0-9]/.test(p),
} as const

const schema = z.object({
  firstName: z.string().trim().min(1, copy.errors.firstName),
  lastName: z.string().trim().min(1, copy.errors.lastName),
  email: z.email(copy.errors.email),
  phone: z.string().trim().regex(/^[+()\d\s-]{7,}$/, copy.errors.phone),
  dob: z.string().refine((d) => !!d && new Date(d).getTime() < Date.now(), copy.errors.dob),
  password: z.string().refine((p) => Object.values(passwordRules).every((rule) => rule(p)), copy.errors.password),
})
type Values = z.infer<typeof schema>
type Errors = Partial<Record<keyof Values | "agree", string>>

type FamilyMember = { key: number; name: string; dob: string; relationship: string }

/* ----------------------------------------------------------------------------
 * Account form
 * ------------------------------------------------------------------------- */

function PasswordHints({ password }: { password: string }) {
  return (
    <ul aria-live="polite" className="flex flex-wrap gap-x-4 gap-y-1">
      {copy.hints.map((h) => {
        const met = passwordRules[h.id as keyof typeof passwordRules](password)
        return (
          <li key={h.id} className={cn("flex items-center gap-1.5 transition-colors", met ? "text-emerald-700" : "text-neutral-500", "text-caption")}>
            <span
              aria-hidden="true"
              className={cn("grid size-4 place-items-center rounded-full transition-colors", met ? "bg-emerald-600 text-white" : "bg-neutral-200 text-transparent")}
            >
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2.4} className="size-2.5" />
            </span>
            {h.label}
            <span className="sr-only">{copy.hintState(met)}</span>
          </li>
        )
      })}
    </ul>
  )
}

function AccountForm({ onCreated }: { onCreated: (firstName: string) => void }) {
  const [values, setValues] = React.useState<Values>({ firstName: "", lastName: "", email: "", phone: "", dob: "", password: "" })
  const [agree, setAgree] = React.useState(false)
  const [reminders, setReminders] = React.useState(true)
  const [errors, setErrors] = React.useState<Errors>({})

  const update = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = schema.safeParse(values)
    const next: Errors = {}
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path[0] as keyof Values] ??= issue.message
    if (!agree) next.agree = copy.errors.agree
    setErrors(next)
    if (parsed.success && agree) onCreated(parsed.data.firstName)
    // Focus the first field with a problem.
    else requestAnimationFrame(() => document.querySelector<HTMLElement>("form [aria-invalid=true]")?.focus())
  }

  const f = copy.fields
  const field = (key: keyof Values, extra: React.ComponentProps<"input"> = {}) => ({
    label: f[key].label,
    placeholder: f[key].placeholder || undefined,
    autoComplete: f[key].autoComplete,
    value: values[key],
    onChange: update(key),
    error: errors[key],
    ...extra,
  })

  return (
    <>
      <AuthHeader title={copy.heading} intro={copy.intro} />
      <div className="mt-8">
        <SocialButtons onSelect={() => onCreated("Sarah")} />
      </div>

      <motion.form variants={fadeUp} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField {...field("firstName")} />
          <TextField {...field("lastName")} />
        </div>
        <TextField {...field("email", { type: "email", inputMode: "email" })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField {...field("phone", { type: "tel", inputMode: "tel" })} />
          <DateField
            label={f.dob.label}
            placeholder={f.dob.placeholder}
            value={values.dob}
            onChange={(dob) => {
              setValues((v) => ({ ...v, dob }))
              if (errors.dob) setErrors((er) => ({ ...er, dob: undefined }))
            }}
            error={errors.dob}
          />
        </div>
        <PasswordField
          {...field("password")}
          showLabel={loginCopy.show}
          hideLabel={loginCopy.hide}
          hint={<PasswordHints password={values.password} />}
        />

        <div className="mt-1 flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-neutral-700 text-caption">
            <Checkbox
              checked={agree}
              onCheckedChange={(v: boolean) => {
                setAgree(v)
                if (v) setErrors((er) => ({ ...er, agree: undefined }))
              }}
              aria-invalid={errors.agree ? true : undefined}
              className="mt-0.5"
            />
            <span>
              {copy.agree.before}
              <Link href={copy.agree.terms.href} prefetch={false} className={cn("rounded-sm text-neutral-950 underline underline-offset-2", focusRing.dark)}>
                {copy.agree.terms.label}
              </Link>
              {copy.agree.and}
              <Link href={copy.agree.privacy.href} prefetch={false} className={cn("rounded-sm text-neutral-950 underline underline-offset-2", focusRing.dark)}>
                {copy.agree.privacy.label}
              </Link>
            </span>
          </label>
          {errors.agree && <FieldError className="text-caption">{errors.agree}</FieldError>}
          <label className="flex cursor-pointer items-center gap-2.5 text-neutral-700 text-caption">
            <Checkbox checked={reminders} onCheckedChange={(v: boolean) => setReminders(v)} />
            {copy.reminders}
          </label>
        </div>

        <Button type="submit" size="xl" className="mt-2 w-full">
          {copy.submit}
        </Button>
      </motion.form>

      <motion.p variants={fadeUp} className="mt-6 text-center text-neutral-500 text-body">
        {copy.haveAccount}{" "}
        <Link href={copy.login.href} className={cn("rounded-sm text-neutral-950 underline underline-offset-4", focusRing.dark)}>
          {copy.login.label}
        </Link>
      </motion.p>
    </>
  )
}

/* ----------------------------------------------------------------------------
 * Setup steps
 * ------------------------------------------------------------------------- */

function StepHeader({ step, total, title, intro }: { step: number; total: number; title: string; intro: string }) {
  // Each step mounts its own header: move focus to it so keyboard and screen reader users start at the new step.
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  React.useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("h-1 w-8 rounded-full transition-colors", i < step ? "bg-neutral-950" : "bg-neutral-200")} />
          ))}
        </div>
        <span className="text-neutral-500 text-caption">{setupCopy.stepOf(step, total)}</span>
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-neutral-950 outline-none text-heading">
        {title}
      </h1>
      <p className="mt-3 text-balance text-neutral-500 text-body">{intro}</p>
    </div>
  )
}

function CardUpload({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const id = React.useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-3 py-5 text-center transition-colors hover:border-neutral-400",
        file ? "border-emerald-300 bg-emerald-50" : "border-neutral-300 bg-white",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-neutral-950"
      )}
    >
      <HugeiconsIcon aria-hidden="true" icon={file ? Tick02Icon : ImageUpload01Icon} strokeWidth={1.6} className={cn("size-5", file ? "text-emerald-700" : "text-neutral-400")} />
      <span className="text-neutral-950 text-caption">{label}</span>
      <span className="max-w-full truncate text-neutral-500 text-micro">{file ? file.name : setupCopy.insurance.upload}</span>
      <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </label>
  )
}

const relationshipOptions = setupCopy.family.relationships.map((r) => ({ value: r, label: r }))

function Setup({ firstName }: { firstName: string }) {
  const [step, setStep] = React.useState(1)
  const [plan, setPlan] = React.useState<string | null>(null)
  const [memberId, setMemberId] = React.useState("")
  const [front, setFront] = React.useState<File | null>(null)
  const [back, setBack] = React.useState<File | null>(null)
  const [family, setFamily] = React.useState<FamilyMember[]>([])
  const nextKey = React.useRef(1)
  const insurerId = React.useId()
  const total = 3

  const addMember = () => setFamily((f) => [...f, { key: nextKey.current++, name: "", dob: "", relationship: "Child" }])
  const updateMember = (key: number, patch: Partial<FamilyMember>) => setFamily((f) => f.map((m) => (m.key === key ? { ...m, ...patch } : m)))
  const removeMember = (key: number) => setFamily((f) => f.filter((m) => m.key !== key))
  const namedFamily = family.filter((m) => m.name.trim())

  const footer = (onNext: () => void, nextLabel = setupCopy.next) => (
    <div className="mt-8 flex items-center justify-between gap-3">
      {step > 1 ? (
        <Button variant="ghost" size="xl" onClick={() => setStep((s) => s - 1)}>
          {setupCopy.back}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="xl" onClick={() => setStep((s) => s + 1)}>
          {setupCopy.skip}
        </Button>
        <Button size="xl" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        {step === 1 && (
          <>
            <StepHeader step={1} total={total} title={setupCopy.insurance.title} intro={setupCopy.insurance.intro} />
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={insurerId} className="text-neutral-600 text-caption">
                  {setupCopy.insurance.insurer}
                </label>
                <PlanCombobox
                  id={insurerId}
                  items={checkerPlanNames}
                  value={plan}
                  onValueChange={setPlan}
                  placeholder={setupCopy.insurance.insurerPlaceholder}
                  emptyText={setupCopy.insurance.insurerEmpty}
                />
              </div>
              <TextField
                label={setupCopy.insurance.memberId}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value.slice(0, 24))}
                autoComplete="off"
                hint={<p className="text-neutral-500 text-caption">{setupCopy.insurance.memberIdHint}</p>}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <CardUpload label={setupCopy.insurance.cardFront} file={front} onFile={setFront} />
                <CardUpload label={setupCopy.insurance.cardBack} file={back} onFile={setBack} />
              </div>
            </div>
            {footer(() => setStep(2))}
          </>
        )}

        {step === 2 && (
          <>
            <StepHeader step={2} total={total} title={setupCopy.family.title} intro={setupCopy.family.intro} />
            <ul className="mt-8 flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {family.map((m) => (
                  <motion.li
                    key={m.key}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 rounded-[20px] bg-neutral-50 p-4">
                      <div className="flex items-end gap-2">
                        <TextField
                          label={setupCopy.family.name}
                          value={m.name}
                          onChange={(e) => updateMember(m.key, { name: e.target.value })}
                          autoComplete="off"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={() => removeMember(m.key)}
                          aria-label={setupCopy.family.remove(m.name)}
                          className="mb-1 rounded-full text-neutral-500"
                        >
                          <HugeiconsIcon aria-hidden="true" icon={Delete02Icon} strokeWidth={1.8} />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DateField
                          label={setupCopy.family.dob}
                          placeholder={setupCopy.family.dobPlaceholder}
                          value={m.dob}
                          onChange={(dob) => updateMember(m.key, { dob })}
                        />
                        <div className="flex flex-col gap-2">
                          <span className="text-neutral-600 text-caption">{setupCopy.family.relationship}</span>
                          <FilterSelect
                            ariaLabel={setupCopy.family.relationship}
                            value={m.relationship}
                            onValueChange={(v) => updateMember(m.key, { relationship: v })}
                            options={relationshipOptions}
                            className="h-12 w-full rounded-xl sm:w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <Button variant="outline" size="xl" onClick={addMember} className={cn("w-full border-dashed", family.length && "mt-3")}>
              <HugeiconsIcon aria-hidden="true" icon={Add01Icon} strokeWidth={1.8} data-icon="inline-start" />
              {setupCopy.family.add}
            </Button>
            {footer(() => setStep(3))}
          </>
        )}

        {step === 3 && (
          <div>
            <StepHeader step={3} total={total} title={setupCopy.done.title(firstName)} intro={setupCopy.done.body} />
            <ul className="mt-6 flex flex-col gap-2 rounded-[20px] bg-neutral-50 p-4 text-neutral-700 text-body">
              <li className="flex items-center gap-2">
                <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4 text-emerald-600" />
                {setupCopy.done.summaryInsurance(plan)}
              </li>
              <li className="flex items-center gap-2">
                <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4 text-emerald-600" />
                {setupCopy.done.summaryFamily(namedFamily.length)}
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-2.5">
              <Button size="xl" nativeButton={false} render={<a href={setupCopy.done.book.href} />} className="w-full justify-between">
                {setupCopy.done.book.label}
                <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" />
              </Button>
              <Button variant="outline" size="xl" nativeButton={false} render={<a href={setupCopy.done.dashboard.href} />} className="w-full justify-between">
                {setupCopy.done.dashboard.label}
                <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} strokeWidth={1.8} data-icon="inline-end" />
              </Button>
            </div>
            <p className="mt-4 text-neutral-400 text-caption">{setupCopy.done.demo}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function SignupForm() {
  const [createdName, setCreatedName] = React.useState<string | null>(null)
  // The demo has one patient account, so a new sign-up continues as the demo patient (portal and booking need a session).
  // With a backend, create the account here (e.g. POST /api/signup) and set the real session from its response.
  const created = (firstName: string) => {
    setSessionRole("patient")
    setCreatedName(firstName)
  }
  return createdName ? <Setup firstName={createdName} /> : <AccountForm onCreated={created} />
}

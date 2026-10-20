"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, SquareLock02Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { EASE, fadeUp } from "@/lib/motion"
import { focusRing } from "@/lib/styles"
import { demoAccounts, LOCK_MINUTES, loginCopy as copy, MAX_ATTEMPTS, type DemoAccount } from "@/lib/data/auth"
import { canAccess, sessionUsers } from "@/lib/session"
import { signInAndGo } from "@/lib/session-client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthHeader, PasswordField, SocialButtons, TextField } from "@/components/auth/auth-parts"

const schema = z.object({
  email: z.email(copy.errors.email),
  password: z.string().min(1, copy.errors.password),
})
type Values = z.infer<typeof schema>
type Errors = Partial<Record<keyof Values, string>>

function Notice({ tone, icon, children }: { tone: "error" | "info"; icon: typeof Alert02Icon; children: React.ReactNode }) {
  return (
    <motion.div
      role={tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={cn(
        "flex gap-3 rounded-2xl px-4 py-3",
        tone === "error" ? "bg-red-50 text-red-900" : "bg-neutral-100 text-neutral-800",
        "text-caption"
      )}
    >
      <HugeiconsIcon aria-hidden="true" icon={icon} strokeWidth={1.8} className="mt-px size-4 shrink-0" />
      <div>{children}</div>
    </motion.div>
  )
}

export function LoginForm() {
  const [values, setValues] = React.useState<Values>({ email: "", password: "" })
  const [errors, setErrors] = React.useState<Errors>({})
  const [remember, setRemember] = React.useState(true)
  const [failures, setFailures] = React.useState(0)
  const [lockedUntil, setLockedUntil] = React.useState<number | null>(null)
  const [now, setNow] = React.useState(0)
  const [mismatch, setMismatch] = React.useState(false)
  const [info, setInfo] = React.useState<string | null>(null)

  /** Every account goes straight to its dashboard, or back to the page it was sent from (booking, a portal page, an admin page). */
  const finish = (account: DemoAccount) => {
    const next = new URLSearchParams(window.location.search).get("next")
    const home = sessionUsers[account.id].home
    const allowed = next && canAccess(account.id, next.split("?")[0]) && (account.id === "patient" ? !next.startsWith("/admin") : next.startsWith("/admin") || next.startsWith("/book"))
    signInAndGo(account.id, allowed && !(account.id === "doctor" && next === "/admin") ? next : home)
  }

  const locked = lockedUntil !== null && now < lockedUntil
  const minutesLeft = lockedUntil ? Math.max(1, Math.ceil((lockedUntil - now) / 60_000)) : 0

  // Tick once a minute while locked, so the countdown updates and the form unlocks on time.
  React.useEffect(() => {
    if (!lockedUntil) return
    const timer = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= lockedUntil) {
        setLockedUntil(null)
        setFailures(0)
      }
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [lockedUntil])

  const update = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
    setMismatch(false)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setInfo(null)
    if (locked) return
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Values] ??= issue.message
      setErrors(next)
      requestAnimationFrame(() => document.querySelector<HTMLElement>("form [aria-invalid=true]")?.focus())
      return
    }
    // Demo: credentials are checked against the public demo accounts. With a backend, POST them
    // (e.g. /api/login), let the server set the session cookie and own the lockout, then redirect.
    const account = demoAccounts.find(
      (a) => a.email.toLowerCase() === parsed.data.email.toLowerCase() && a.password === parsed.data.password
    )
    if (account) {
      setFailures(0)
      finish(account)
      return
    }
    const nextFailures = failures + 1
    setFailures(nextFailures)
    setMismatch(true)
    if (nextFailures >= MAX_ATTEMPTS) {
      const t = Date.now()
      setNow(t)
      setLockedUntil(t + LOCK_MINUTES * 60_000)
    }
  }

  const signInAs = (account: DemoAccount) => {
    setValues({ email: account.email, password: account.password })
    setErrors({})
    setMismatch(false)
    finish(account)
  }

  const reset = () => {
    const parsed = z.email().safeParse(values.email)
    if (!parsed.success) {
      setErrors({ email: copy.errors.email })
      return
    }
    setInfo(copy.resetSent(values.email))
  }

  return (
    <>
      <AuthHeader title={copy.heading} intro={copy.intro} />

      <div className="mt-8">
        <SocialButtons
          onSelect={() => signInAs(demoAccounts.find((a) => a.id === "patient")!)}
        />
      </div>

      <motion.form variants={fadeUp} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <AnimatePresence mode="wait" initial={false}>
          {locked ? (
            <Notice key="locked" tone="error" icon={SquareLock02Icon}>
              {copy.errors.locked}
              <span className="mt-1 block text-red-900/70">{copy.lockedLeft(minutesLeft)}</span>
            </Notice>
          ) : mismatch ? (
            <Notice key="mismatch" tone="error" icon={Alert02Icon}>
              {copy.errors.mismatch}
              {failures >= 2 && <span className="mt-1 block text-red-900/70">{copy.attemptsLeft(MAX_ATTEMPTS - failures)}</span>}
            </Notice>
          ) : info ? (
            <Notice key="info" tone="info" icon={Tick02Icon}>
              {info}
            </Notice>
          ) : null}
        </AnimatePresence>

        <TextField
          label={copy.email.label}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={copy.email.placeholder}
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          disabled={locked}
        />
        <PasswordField
          label={copy.password.label}
          autoComplete="current-password"
          placeholder={copy.password.placeholder}
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          disabled={locked}
          showLabel={copy.show}
          hideLabel={copy.hide}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-neutral-700 text-caption">
            <Checkbox checked={remember} onCheckedChange={(v: boolean) => setRemember(v)} />
            {copy.remember}
          </label>
          <button
            type="button"
            onClick={reset}
            className={cn("rounded-sm text-neutral-950 underline-offset-4 hover:underline text-caption", focusRing.dark)}
          >
            {copy.forgot}
          </button>
        </div>

        <Button type="submit" size="xl" disabled={locked} className="mt-2 w-full">
          {copy.submit}
        </Button>
      </motion.form>

      <motion.p variants={fadeUp} className="mt-6 text-center text-neutral-500 text-body">
        {copy.newHere}{" "}
        <Link href={copy.createAccount.href} className={cn("rounded-sm text-neutral-950 underline underline-offset-4", focusRing.dark)}>
          {copy.createAccount.label}
        </Link>
      </motion.p>

      <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-neutral-400 text-caption">
        <span>{copy.demoTitle}</span>
        {demoAccounts.map((a) => (
          <React.Fragment key={a.id}>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => signInAs(a)}
              aria-label={a.aria}
              className={cn("rounded-sm text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline", focusRing.dark)}
            >
              {a.label}
            </button>
          </React.Fragment>
        ))}
      </motion.div>
    </>
  )
}

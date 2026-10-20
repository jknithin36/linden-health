"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons"
import { format, parseISO, subYears } from "date-fns"

import { cn } from "@/lib/utils"
import { fadeUp, stagger, useReducedMotion } from "@/lib/motion"
import { focusRing } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { authShell } from "@/lib/data/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AppleLogo, GoogleLogo } from "@/components/site/icons"

/** Input style shared by every auth field. */
const authInput = cn(
  "h-12 rounded-xl border-neutral-200 bg-white px-4 hover:border-neutral-300",
  "focus-visible:border-neutral-950 focus-visible:ring-0 text-body"
)

/* ----------------------------------------------------------------------------
 * Logo top left, the form centered in the middle, legal links below
 * ------------------------------------------------------------------------- */

export function AuthShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <div className="flex min-h-svh flex-col items-center bg-white px-6 py-6 sm:px-10">
      <Link href="/" aria-label={authShell.homeLabel} className={cn("self-start rounded-sm", focusRing.dark)}>
        <Image src={site.logo.dark} alt="" width={site.logo.width} height={site.logo.height} preload className="h-7 w-auto" />
      </Link>

      <main id="main" tabIndex={-1} className="flex w-full flex-1 items-center justify-center py-10 outline-none">
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={stagger(0.06)}
          className="w-full max-w-[400px]"
        >
          {children}
        </motion.div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-neutral-400 text-caption">
        <span>{authShell.copyright}</span>
        {authShell.legal.map((l) => (
          <Link key={l.href} href={l.href} prefetch={false} className={cn("rounded-sm hover:text-neutral-950", focusRing.dark)}>
            {l.label}
          </Link>
        ))}
      </footer>
    </div>
  )
}

/** Heading + intro at the top of each auth card. */
export function AuthHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <motion.div variants={fadeUp} className="text-center">
      <h1 className="text-balance text-neutral-950 text-heading">{title}</h1>
      <p className="mt-3 text-balance text-neutral-500 text-body">{intro}</p>
    </motion.div>
  )
}

/* ----------------------------------------------------------------------------
 * Social buttons + divider
 * ------------------------------------------------------------------------- */

export function SocialButtons({ onSelect }: { onSelect: (provider: "google" | "apple") => void }) {
  return (
    <motion.div variants={fadeUp}>
      <div className="grid grid-cols-2 gap-2.5">
        {(
          [
            ["google", <GoogleLogo key="g" className="size-[18px]" />],
            ["apple", <AppleLogo key="a" className="size-[18px] -translate-y-px" />],
          ] as const
        ).map(([provider, logo]) => (
          <Button
            key={provider}
            type="button"
            variant="ghost"
            size="xl"
            onClick={() => onSelect(provider)}
            aria-label={authShell[provider].aria}
            className="w-full bg-neutral-100 hover:bg-neutral-200/70"
          >
            {logo}
            {authShell[provider].label}
          </Button>
        ))}
      </div>
      <div className="my-6 flex items-center gap-4 text-neutral-400 text-caption">
        <span aria-hidden="true" className="h-px flex-1 bg-neutral-200" />
        {authShell.divider}
        <span aria-hidden="true" className="h-px flex-1 bg-neutral-200" />
      </div>
    </motion.div>
  )
}

/* ----------------------------------------------------------------------------
 * Fields
 * ------------------------------------------------------------------------- */

type TextFieldProps = Omit<React.ComponentProps<"input">, "className"> & {
  label: string
  error?: string
  hint?: React.ReactNode
  className?: string
}

export function TextField({ label, error, hint, className, id, ...props }: TextFieldProps) {
  const fallbackId = React.useId()
  const inputId = id ?? fallbackId
  return (
    <Field data-invalid={error ? true : undefined} className={cn("gap-2", className)}>
      <FieldLabel htmlFor={inputId} className="text-neutral-600 text-caption">
        {label}
      </FieldLabel>
      <Input id={inputId} aria-invalid={error ? true : undefined} className={authInput} {...props} />
      {hint}
      {error && <FieldError className="text-caption">{error}</FieldError>}
    </Field>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, "type"> & { showLabel: string; hideLabel: string }

export function PasswordField({ label, error, hint, className, id, showLabel, hideLabel, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false)
  const fallbackId = React.useId()
  const inputId = id ?? fallbackId
  return (
    <Field data-invalid={error ? true : undefined} className={cn("gap-2", className)}>
      <FieldLabel htmlFor={inputId} className="text-neutral-600 text-caption">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={cn(authInput, "pr-12")}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full text-neutral-500"
        >
          <HugeiconsIcon aria-hidden="true" icon={visible ? ViewOffSlashIcon : ViewIcon} strokeWidth={1.8} />
        </Button>
      </div>
      {hint}
      {error && <FieldError className="text-caption">{error}</FieldError>}
    </Field>
  )
}

type DateFieldProps = {
  label: string
  placeholder: string
  /** `yyyy-MM-dd`, or "" when empty. */
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}

/** Date of birth picker: input-styled trigger, calendar with month + year dropdowns, no future dates. */
export function DateField({ label, placeholder, value, onChange, error, className }: DateFieldProps) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  const selected = value ? parseISO(value) : undefined
  return (
    <Field data-invalid={error ? true : undefined} className={cn("gap-2", className)}>
      <FieldLabel htmlFor={id} className="text-neutral-600 text-caption">
        {label}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            authInput,
            "flex w-full items-center justify-between gap-3 border text-left transition-colors outline-none",
            "focus-visible:border-neutral-950 aria-invalid:border-destructive data-popup-open:border-neutral-950",
            selected ? "text-neutral-950" : "text-neutral-400"
          )}
        >
          {selected ? format(selected, "MMM d, yyyy") : placeholder}
          <HugeiconsIcon aria-hidden="true" icon={Calendar03Icon} strokeWidth={1.8} className="size-4 shrink-0 text-neutral-500" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-2xl p-0">
          <BirthdayCalendar
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "")
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <FieldError className="text-caption">{error}</FieldError>}
    </Field>
  )
}

/** Only rendered while the popover is open, so reading today's date never runs during prerender. */
function BirthdayCalendar({ selected, onSelect }: { selected?: Date; onSelect: (date: Date | undefined) => void }) {
  const today = new Date()
  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      selected={selected}
      onSelect={onSelect}
      defaultMonth={selected ?? subYears(today, 30)}
      startMonth={new Date(1900, 0)}
      endMonth={today}
      disabled={{ after: today }}
    />
  )
}

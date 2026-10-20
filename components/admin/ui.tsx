"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Alert02Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, InboxIcon, Refresh01Icon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { family } from "@/lib/data/portal"
import { ageLabel, fmtDate, fmtMoney, fmtTime, initials, relative } from "@/lib/admin/format"
import { getClinicSync, getDoctorSync, getPatientSync } from "@/lib/admin/queries"
import type { ClinicId, Patient } from "@/lib/admin/types"
import { panel } from "@/components/admin/skeletons"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export { CardSkeleton, ChartSkeleton, DetailSkeleton, PageSkeleton, panel, TableSkeleton } from "@/components/admin/skeletons"

/** Grows a 32px icon button's hit area to 40px without changing how it looks. */
export const touchTarget = "relative after:absolute after:-inset-1 after:content-['']"

// Recharts is large; only stat cards that draw a trend line load it.
const Sparkline = dynamic(() => import("@/components/admin/sparkline"), { ssr: false, loading: () => <div aria-hidden="true" className="mt-3 h-10" /> })

/* --------------------------------- Toasts ---------------------------------- */

export const notify = {
  success: (title: string, description?: string) => toast.add({ title, description, type: "success" }),
  error: (title: string, description?: string) => toast.add({ title, description, type: "error" }),
  info: (title: string, description?: string) => toast.add({ title, description, type: "info" }),
  /** Success toast with an Undo button for 5 seconds. */
  undo: (title: string, undo: () => void, description?: string) =>
    toast.add({
      title,
      description,
      type: "success",
      timeout: 5000,
      actionProps: {
        children: "Undo",
        onClick: () => {
          undo()
          toast.add({ title: "Undone", type: "info", timeout: 2500 })
        },
      },
    }),
}

/* ------------------------------- Page header ------------------------------- */

export function PageHeader({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-neutral-950 text-page">{title}</h1>
          {description && <p className="mt-1 text-pretty text-neutral-500 text-body">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

/* ------------------------------- Status badge ------------------------------ */

type Tone = "green" | "amber" | "red" | "blue" | "gray"
const tone: Record<Tone, { chip: string; dot: string }> = {
  green: { chip: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  amber: { chip: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  red: { chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  blue: { chip: "bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  gray: { chip: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" },
}

/** Every status in the admin, mapped once: green ok, amber attention, red urgent, blue in progress, gray neutral. */
const statusMap: Record<string, [string, Tone]> = {
  // appointments
  "appointment:scheduled": ["Scheduled", "gray"],
  "appointment:confirmed": ["Confirmed", "green"],
  "appointment:arrived": ["Arrived", "blue"],
  "appointment:checked-in": ["Checked in", "blue"],
  "appointment:waiting": ["Waiting", "amber"],
  "appointment:with-doctor": ["With doctor", "blue"],
  "appointment:completed": ["Completed", "green"],
  "appointment:no-show": ["No-show", "red"],
  "appointment:cancelled": ["Cancelled", "gray"],
  "appointment:late-cancel": ["Late cancel", "red"],
  // claims
  "claim:draft": ["Draft", "gray"],
  "claim:submitted": ["Submitted", "blue"],
  "claim:pending": ["Pending", "amber"],
  "claim:paid": ["Paid", "green"],
  "claim:denied": ["Denied", "red"],
  "claim:appealed": ["Appealed", "blue"],
  // messages
  "thread:open": ["Open", "amber"],
  "thread:waiting": ["Waiting on patient", "blue"],
  "thread:closed": ["Closed", "gray"],
  "priority:high": ["High priority", "red"],
  "priority:normal": ["Normal", "gray"],
  // refunds
  "refund:pending": ["Needs review", "amber"],
  "refund:approved": ["Approved", "blue"],
  "refund:issued": ["Issued", "green"],
  // refills
  "refill:new": ["New", "amber"],
  "refill:routed": ["Routed", "blue"],
  "refill:approved": ["Approved", "green"],
  "refill:denied": ["Denied", "red"],
  // people
  "doctor:active": ["Active", "green"],
  "doctor:on-leave": ["On leave", "amber"],
  "staff:active": ["Active", "green"],
  "staff:invited": ["Invited", "blue"],
  "flag:high-risk": ["High risk", "red"],
  "flag:new": ["New", "blue"],
  "flag:balance-due": ["Balance due", "amber"],
  "flag:forms-pending": ["Forms pending", "amber"],
  // booleans
  "forms:done": ["Done", "green"],
  "forms:pending": ["Pending", "amber"],
  "insurance:verified": ["Verified", "green"],
  "insurance:not-verified": ["Not verified", "amber"],
  "accepting:yes": ["Accepting", "green"],
  "accepting:no": ["Not accepting", "gray"],
}

export const statusLabel = (kind: string, status: string) => statusMap[`${kind}:${status}`]?.[0] ?? status

export function StatusBadge({ kind, status, className }: { kind: string; status: string; className?: string }) {
  const [label, t] = statusMap[`${kind}:${status}`] ?? [status, "gray" as Tone]
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 whitespace-nowrap text-micro", tone[t].chip, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone[t].dot)} />
      {label}
    </span>
  )
}

/* ---------------------------------- Cells ---------------------------------- */

const avatarTone = ["bg-violet-100 text-violet-800", "bg-sky-100 text-sky-800", "bg-rose-100 text-rose-800", "bg-amber-100 text-amber-800", "bg-emerald-100 text-emerald-800", "bg-indigo-100 text-indigo-800"]
const toneFor = (id: string) => avatarTone[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % avatarTone.length]

/** `eager` for a large photo above the fold (profile headers), so it isn't lazy-loaded. */
export function Avatar({ name, id, src, className, eager }: { name: string; id: string; src?: string; className?: string; eager?: boolean }) {
  if (src) return <Image src={src} alt="" width={eager ? 160 : 72} height={eager ? 160 : 72} loading={eager ? "eager" : undefined} className={cn("size-8 shrink-0 rounded-full bg-neutral-100 object-cover object-top", className)} />
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full text-micro", toneFor(id), className)}>
      {initials(name.replace(/^Dr\. /, ""))}
    </span>
  )
}

const portalPhoto = new Map(family.map((m) => [m.id as string, m.avatar]))

/** The Mitchells have portal photos; everyone else gets initials. */
export const patientPhoto = (p: Patient) => (p.portalId ? portalPhoto.get(p.portalId) : undefined)

export function PatientCell({ patient, link = true, className }: { patient: Patient | string; link?: boolean; className?: string }) {
  const p = typeof patient === "string" ? getPatientSync(patient) : patient
  if (!p) return null
  const body = (
    <>
      <Avatar name={p.name} id={p.id} src={patientPhoto(p)} />
      <span className="min-w-0">
        <span className="block truncate text-neutral-950 text-body">{p.name}</span>
        <span className="block truncate text-neutral-500 tabular-nums text-micro">
          {ageLabel(p.dob, p.sex)} · {p.mrn}
        </span>
      </span>
    </>
  )
  return link ? (
    <Link href={`/admin/patients/${p.id}`} onClick={(e) => e.stopPropagation()} className={cn("flex min-w-0 items-center gap-2.5 rounded-lg hover:[&_span:first-child]:underline", focusRing.dark, className)}>
      {body}
    </Link>
  ) : (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>{body}</span>
  )
}

export function DoctorCell({ id, sub = true, className }: { id: string; sub?: boolean; className?: string }) {
  const d = getDoctorSync(id)
  if (!d) return null
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar name={d.name} id={d.id} src={d.avatar} className="size-7" />
      <span className="min-w-0">
        <span className="block truncate text-neutral-900 text-caption">{d.name}</span>
        {sub && <span className="block truncate text-neutral-500 text-micro">{d.specialty}</span>}
      </span>
    </span>
  )
}

const clinicDot: Record<ClinicId, string> = { cleveland: "bg-sky-500", lakewood: "bg-emerald-500", beachwood: "bg-violet-500" }

export function ClinicBadge({ id }: { id: ClinicId }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-neutral-700 text-caption">
      <span aria-hidden="true" className={cn("size-2 rounded-full", clinicDot[id])} />
      {getClinicSync(id).short}
    </span>
  )
}

export function MoneyCell({ value, muted, tone: t }: { value: number; muted?: boolean; tone?: "green" | "red" }) {
  return (
    <span className={cn("block text-right tabular-nums text-caption", t === "green" ? "text-emerald-700" : t === "red" ? "text-red-700" : muted ? "text-neutral-500" : "text-neutral-950")}>
      {fmtMoney(value)}
    </span>
  )
}

export function TimeCell({ value, showDate = true, video }: { value: string; showDate?: boolean; video?: boolean }) {
  return (
    <span className="block whitespace-nowrap">
      <span className="flex items-center gap-1.5 text-neutral-950 tabular-nums text-caption">
        {showDate ? `${fmtDate(value)} · ${fmtTime(value)}` : fmtTime(value)}
        {video && <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} role="img" aria-label="Video visit" className="size-3.5 text-sky-600" />}
      </span>
      <span className="block text-neutral-400 text-micro">{relative(value)}</span>
    </span>
  )
}

/* ---------------------------------- States --------------------------------- */

export function EmptyState({ icon = InboxIcon, title, text, action }: { icon?: IconSvgElement; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-neutral-100 text-neutral-500">
        <HugeiconsIcon icon={icon} strokeWidth={1.7} aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-neutral-950 text-body">{title}</p>
      {text && <p className="mt-1 max-w-sm text-pretty text-neutral-500 text-caption">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = "Something went wrong", text = "We couldn’t load this. Check your connection and try again.", onRetry }: { title?: string; text?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600">
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-neutral-950 text-body">{title}</p>
      <p className="mt-1 max-w-sm text-pretty text-neutral-500 text-caption">{text}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 rounded-full px-4 text-caption" onClick={onRetry}>
          <HugeiconsIcon icon={Refresh01Icon} strokeWidth={1.8} data-icon="inline-start" />
          Try again
        </Button>
      )}
    </div>
  )
}

/* -------------------------------- Stat card -------------------------------- */

export function StatCard({
  label,
  value,
  delta,
  deltaGood = "up",
  hint,
  spark,
  tone: t,
  href,
}: {
  label: string
  value: React.ReactNode
  delta?: { value: string; direction: "up" | "down" | "flat" }
  deltaGood?: "up" | "down"
  hint?: React.ReactNode
  spark?: number[]
  tone?: "amber" | "red" | "green"
  href?: string
}) {
  const good = delta && delta.direction !== "flat" && delta.direction === deltaGood
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("flex items-center gap-1.5 text-caption", t === "amber" ? "text-amber-800" : t === "red" ? "text-red-700" : "text-neutral-500")}>
          {t && <span aria-hidden="true" className={cn("size-1.5 rounded-full", t === "red" ? "bg-red-500" : t === "amber" ? "bg-amber-500" : "bg-emerald-500")} />}
          {label}
        </p>
        {delta && (
          <span className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 whitespace-nowrap tabular-nums text-micro", delta.direction === "flat" ? "bg-neutral-100 text-neutral-600" : good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
            {delta.direction !== "flat" && <HugeiconsIcon icon={delta.direction === "up" ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2.2} aria-hidden="true" className="size-3" />}
            <span className="sr-only">{delta.direction === "up" ? "Up" : delta.direction === "down" ? "Down" : "No change"} </span>
            {delta.value}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-neutral-950 tabular-nums text-title">{value}</p>
      {hint && <p className="mt-0.5 text-neutral-500 text-micro">{hint}</p>}
      {spark && spark.length > 1 && <Sparkline values={spark} label={label} color={t === "red" ? "var(--color-red-500)" : t === "amber" ? "var(--color-amber-500)" : "var(--color-sky-500)"} />}
    </>
  )
  // Tone colors the label and sparkline only; the card itself stays white so the row reads as one set.
  const cls = cn(panel, "flex flex-col p-4 md:p-5")
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-neutral-300", focusRing.dark)}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/* ------------------------------ Sheet + confirm ---------------------------- */

export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full gap-0 p-0", wide ? "data-[side=right]:sm:max-w-xl" : "data-[side=right]:sm:max-w-md")}>
        <SheetHeader className="gap-1.5 border-b border-neutral-100 p-6">
          <SheetTitle className="pr-8 text-neutral-950 text-title">{title}</SheetTitle>
          {description ? <SheetDescription className="text-neutral-500 text-caption">{description}</SheetDescription> : <SheetDescription className="sr-only">Details</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t border-neutral-100 p-4 md:px-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  children?: React.ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-5 rounded-3xl">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-neutral-950 text-title">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty text-neutral-500 text-body">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="gap-2.5 sm:justify-end">
          <AlertDialogCancel variant="outline" size="lg" className="rounded-full px-5 text-caption">
            Keep
          </AlertDialogCancel>
          <Button
            size="lg"
            className={cn("rounded-full px-5 text-caption", destructive && "bg-red-600 text-white hover:bg-red-700")}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* -------------------------------- Chart theme ------------------------------ */

/** Shared Recharts props: neutral-500 axis text, neutral-100 grid, no axis lines. */
export const chartAxis = { tickLine: false, axisLine: false, tickMargin: 8, tick: { fill: "var(--color-neutral-500)", fontSize: 11 } } as const
export const chartGrid = { vertical: false, stroke: "var(--color-neutral-100)" } as const
export const chartColors = ["var(--color-sky-500)", "var(--color-emerald-500)", "var(--color-violet-500)", "var(--color-amber-500)", "var(--color-rose-500)", "var(--color-neutral-400)"]

/** A titled panel for one chart. */
export function ChartCard({ title, subtitle, children, action, className }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={cn(panel, "flex flex-col p-5 md:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-neutral-950 text-body">{title}</h2>
          {subtitle && <p className="text-neutral-500 text-caption">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 min-h-0 flex-1">{children}</div>
    </section>
  )
}

/**
 * A titled panel. Content is padded by default; `flush` lets tables and lists run edge to edge.
 * `action` sits at the right of the heading (a button or a SectionLink).
 */
export function Section({ title, description, count, action, children, flush, className, id }: { title: string; description?: React.ReactNode; count?: number; action?: React.ReactNode; children: React.ReactNode; flush?: boolean; className?: string; id?: string }) {
  const hid = React.useId()
  return (
    <section aria-labelledby={hid} id={id} className={cn(panel, "flex min-w-0 flex-col", className)}>
      <div className={cn("flex justify-between gap-3 px-5 pt-4 pb-3", description ? "items-start" : "items-center")}>
        <div className="min-w-0">
          <h2 id={hid} className="flex items-center gap-2 text-neutral-950 text-body">
            {title}
            {count !== undefined && <span className="rounded-full bg-neutral-100 px-2 text-neutral-600 tabular-nums text-micro">{count}</span>}
          </h2>
          {description && <p className="mt-0.5 text-neutral-500 text-caption">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("min-w-0 flex-1", !flush && "px-5 pb-5")}>{children}</div>
    </section>
  )
}

/** "View all →" in a section heading. */
export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center gap-1 rounded-full text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}>
      {children}
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
    </Link>
  )
}

export function KeyValue({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-neutral-400 text-micro">{label}</dt>
      <dd className="mt-0.5 text-neutral-950 text-caption">{children}</dd>
    </div>
  )
}

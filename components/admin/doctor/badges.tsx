// Shared doctor-view badges: note state, appointment status in the doctor's words, priority label.
// Color is always paired with text so nothing relies on color alone.

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Alert02Icon, File01Icon, FileEditIcon, Medicine02Icon, Message01Icon, TestTube01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@/lib/admin/types"
import type { NoteState } from "@/lib/admin/doctor"

type Tone = "green" | "amber" | "red" | "blue" | "gray"

const toneCls: Record<Tone, { chip: string; dot: string }> = {
  green: { chip: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  amber: { chip: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  red: { chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  blue: { chip: "bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  gray: { chip: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" },
}

function Chip({ label, tone, className, outline }: { label: string; tone: Tone; className?: string; outline?: boolean }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 whitespace-nowrap text-micro", outline ? "border border-neutral-200 bg-white text-neutral-600" : toneCls[tone].chip, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", toneCls[tone].dot)} />
      {label}
    </span>
  )
}

/* ---------------------------------- Notes ---------------------------------- */

const noteStateMeta: Record<NoteState, [string, Tone]> = {
  signed: ["Signed", "green"],
  unsigned: ["Unsigned", "amber"],
  "not-started": ["Not started", "gray"],
}

export function NoteStatusBadge({ state, className }: { state: NoteState; className?: string }) {
  const [label, tone] = noteStateMeta[state]
  return <Chip label={label} tone={tone} outline={state === "not-started"} className={className} />
}

/* ------------------------------ Doctor status ------------------------------ */

type DoctorStatus = "completed" | "with-you" | "checked-in" | "waiting" | "scheduled" | "no-show" | "cancelled"

const doctorStatusMeta: Record<DoctorStatus, [string, Tone]> = {
  completed: ["Completed", "green"],
  "with-you": ["With you", "blue"],
  "checked-in": ["Checked in", "blue"],
  waiting: ["Waiting", "amber"],
  scheduled: ["Scheduled", "gray"],
  "no-show": ["No-show", "red"],
  cancelled: ["Cancelled", "gray"],
}

/** Appointment status as the doctor sees it ("With doctor" → "With you"). */
function doctorStatusOf(s: AppointmentStatus): DoctorStatus {
  switch (s) {
    case "completed":
      return "completed"
    case "with-doctor":
      return "with-you"
    case "arrived":
    case "checked-in":
      return "checked-in"
    case "waiting":
      return "waiting"
    case "no-show":
      return "no-show"
    case "cancelled":
    case "late-cancel":
      return "cancelled"
    default:
      return "scheduled"
  }
}

export function DoctorStatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const [label, tone] = doctorStatusMeta[doctorStatusOf(status)]
  return <Chip label={label} tone={tone} className={className} />
}

/* --------------------------------- Priority -------------------------------- */

/** Red text label for high priority (renders nothing for normal unless `showNormal`). */
export function PriorityLabel({ priority, className, showNormal }: { priority: "normal" | "high"; className?: string; showNormal?: boolean }) {
  if (priority !== "high")
    return showNormal ? <span className={cn("text-neutral-500 text-micro", className)}>Normal</span> : null
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-red-700 text-micro", className)}>
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
      High priority
    </span>
  )
}

/** Allergy chip (red, with text). */
export function AllergyChip({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 whitespace-nowrap text-red-700 text-micro", className)}>
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="size-3" />
      <span className="sr-only">Allergy: </span>
      {name}
    </span>
  )
}

/** Icon per inbox item type. */
export const inboxTypeIcon: Record<string, IconSvgElement> = { result: TestTube01Icon, refill: Medicine02Icon, "note-to-sign": FileEditIcon, message: Message01Icon, form: File01Icon }

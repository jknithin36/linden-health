import type { AppointmentStatus } from "@/lib/admin/types"

/** Calendar block colors by status: soft tint, a thin accent bar, and readable text. */
type BlockTone = { box: string; accent: string; meta: string }

const tones = {
  scheduled: { box: "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300", accent: "bg-neutral-300", meta: "text-neutral-500" },
  confirmed: { box: "border-emerald-200/80 bg-emerald-50 text-emerald-950 hover:border-emerald-300", accent: "bg-emerald-500", meta: "text-emerald-800/80" },
  progress: { box: "border-sky-200/80 bg-sky-50 text-sky-950 hover:border-sky-300", accent: "bg-sky-500", meta: "text-sky-800/80" },
  waiting: { box: "border-amber-200/80 bg-amber-50 text-amber-950 hover:border-amber-300", accent: "bg-amber-500", meta: "text-amber-800/80" },
  completed: { box: "border-neutral-200/70 bg-neutral-100/70 text-neutral-600 hover:border-neutral-300", accent: "bg-neutral-300", meta: "text-neutral-500" },
  missed: { box: "border-red-200/80 bg-red-50 text-red-950 hover:border-red-300", accent: "bg-red-500", meta: "text-red-800/80" },
  cancelled: { box: "border-dashed border-neutral-300 bg-white/80 text-neutral-400 hover:border-neutral-400", accent: "bg-transparent", meta: "text-neutral-400" },
} satisfies Record<string, BlockTone>

type ToneId = keyof typeof tones

const toneId = (s: AppointmentStatus): ToneId =>
  s === "confirmed"
    ? "confirmed"
    : s === "arrived" || s === "checked-in" || s === "with-doctor"
      ? "progress"
      : s === "waiting"
        ? "waiting"
        : s === "completed"
          ? "completed"
          : s === "no-show" || s === "late-cancel"
            ? "missed"
            : s === "cancelled"
              ? "cancelled"
              : "scheduled"

export const blockTone = (s: AppointmentStatus) => tones[toneId(s)]

/** Legend swatches (ids match scheduleCopy.legend). */
export const legendTone: Record<string, BlockTone> = {
  scheduled: tones.scheduled,
  confirmed: tones.confirmed,
  "in-progress": tones.progress,
  waiting: tones.waiting,
  completed: tones.completed,
  missed: tones.missed,
}

/** Utilization tint for week cells: one sequential hue, darker = fuller. */
export function utilTone(u: number) {
  if (u >= 0.9) return "bg-sky-200/80 text-sky-950"
  if (u >= 0.75) return "bg-sky-100 text-sky-950"
  if (u >= 0.5) return "bg-sky-50 text-sky-900"
  if (u > 0) return "bg-white text-neutral-800"
  return "bg-white text-neutral-400"
}

export const hatch = { backgroundImage: "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 1px, transparent 1px 7px)" }

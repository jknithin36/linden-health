import { cn } from "@/lib/utils"
import type { TrustInstitution } from "@/lib/data/trust"

/** Small caps line used under/over the main word in two-line marks. */
const smallCaps = "text-[9px] leading-none tracking-[0.22em] uppercase"

function ShieldIcon() {
  return (
    <svg viewBox="0 0 30 36" fill="none" aria-hidden="true" className="h-9 w-[30px] shrink-0">
      <path
        d="M15 1.5 27.5 5.5V17c0 8.4-5.4 14.4-12.5 17.5C7.9 31.4 2.5 25.4 2.5 17V5.5L15 1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M15 8v20M8 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Ring of 16 dots for the seal, computed once. */
const SEAL_DOTS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2
  return { cx: (18 + Math.cos(a) * 13).toFixed(2), cy: (18 + Math.sin(a) * 13).toFixed(2) }
})

function SealIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className="size-9 shrink-0">
      <circle cx="18" cy="18" r="16.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="18" cy="18" r="9.5" stroke="currentColor" strokeWidth="1.2" />
      {SEAL_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="0.9" fill="currentColor" />
      ))}
      <path d="M18 13.5v9M13.5 18h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-8 shrink-0">
      <path
        d="M27 5C14 5 5 11.5 5 21c0 3.3 2.4 6 5.8 6C21 27 27 17.5 27 5Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 25C12 19 17 14.5 23 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type InstitutionMarkProps = {
  institution: TrustInstitution
  className?: string
}

/** Draws a fictional wordmark for an institution in `currentColor`. */
export function InstitutionMark({ institution, className }: InstitutionMarkProps) {
  const { name, style, line1, line2 } = institution

  return (
    <div
      role="img"
      aria-label={name}
      className={cn("flex h-9 shrink-0 items-center whitespace-nowrap", className)}
    >
      {style === "serif" && (
        <span aria-hidden="true" className="font-serif text-3xl leading-none tracking-tight">
          {line1}
        </span>
      )}

      {style === "crest" && (
        <span aria-hidden="true" className="flex items-center gap-2.5">
          <ShieldIcon />
          <span className="flex flex-col gap-1">
            <span className="font-serif text-[22px] leading-none tracking-[0.06em]">{line1}</span>
            {line2 && <span className={smallCaps}>{line2}</span>}
          </span>
        </span>
      )}

      {style === "monogram" && (
        <span aria-hidden="true" className="font-sans text-[32px] leading-none font-bold tracking-[-0.07em]">
          {line1}
        </span>
      )}

      {style === "seal" && (
        <span aria-hidden="true" className="flex items-center gap-2.5">
          <SealIcon />
          <span className="flex flex-col gap-1">
            {line2 && <span className={smallCaps}>{line2}</span>}
            <span className="font-serif text-[22px] leading-none tracking-[0.06em]">{line1}</span>
          </span>
        </span>
      )}

      {style === "leaf" && (
        <span aria-hidden="true" className="flex items-center gap-2">
          <LeafIcon />
          <span className="flex flex-col gap-1">
            <span className="font-sans text-[22px] leading-none font-medium tracking-[-0.03em]">{line1}</span>
            {line2 && <span className={smallCaps}>{line2}</span>}
          </span>
        </span>
      )}
    </div>
  )
}

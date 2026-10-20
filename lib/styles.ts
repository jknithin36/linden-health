/** Shared layout and surface classes, so every section lines up and looks the same. */

/** Standard content width for page sections. */
export const container = "mx-auto w-full max-w-310 px-6"

/**
 * Standard vertical rhythm for page sections: 48px / 72px of padding, so with the
 * 16px page gap there's ~112px (phone) / ~160px (desktop) between sections.
 */
export const sectionY = "py-12 md:py-18"

/** Top spacing under the navbar for pages that open on white (no hero panel). */
export const pageTop = "pt-10 md:pt-16"

/** Space between a section's header and its content. */
export const headerGap = "mt-10 md:mt-12"

/** Rounded, inset panel used for tinted sections and the hero cards. */
export const panel = "mx-4 rounded-[32px]"

/** Dark glass, same treatment as the scrolled navbar pill. */
export const glass = "border border-white/10 bg-neutral-900/55 text-white backdrop-blur-xl"

/** Focus rings for links and custom controls (shadcn components bring their own). */
export const focusRing = {
  /** On light surfaces. */
  dark: "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950",
  /** On photos and dark surfaces. */
  light: "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  /** Follows the text color, for the navbar that switches between light and dark. */
  current: "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
} as const

/** Pill chips for single-choice filters (shadcn ToggleGroupItem). */
export const chip =
  "h-10 shrink-0 rounded-full bg-neutral-100 px-4 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white"

/**
 * Soft studio backdrop for doctor portraits shot on white. Used with
 * `mix-blend-multiply` on the image, so the white turns into this warm light
 * (brightest behind the head, gently darker toward the shoulders).
 */
export const portraitBackdrop =
  "bg-[radial-gradient(120%_85%_at_50%_18%,#f8f4ef_0%,#ece5db_50%,#dcd2c5_100%)]"

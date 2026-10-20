import { useSyncExternalStore } from "react"
import type { Transition, Variants } from "motion/react"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/**
 * Whether the visitor asked for reduced motion. Use this instead of motion's own hook:
 * it reports `false` while hydrating (matching the server HTML), then the real value,
 * so pages don't hit hydration mismatches when Reduce Motion is on.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false)
}

/** House easing for every animation on the site. */
export const EASE: Transition["ease"] = [0.22, 1, 0.36, 1]

/** Default entrance: fade up 16px. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

/** Fade only, for elements that shouldn't move (logos, wordmarks). */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
}

/** Parent that reveals its children one after another. */
export function stagger(staggerChildren = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren } },
  }
}

/** Props for a section that animates once when scrolled into view. */
export function revealOnView(reduceMotion: boolean, amount = 0.15) {
  return {
    initial: reduceMotion ? (false as const) : ("hidden" as const),
    whileInView: "visible" as const,
    viewport: { once: true, amount },
  }
}

import { useMediaQuery } from "@/hooks/use-media-query"

const MOBILE_BREAKPOINT = 768

/** True below the mobile breakpoint. Always false during server rendering. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}

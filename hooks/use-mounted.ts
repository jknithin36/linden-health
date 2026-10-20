import * as React from "react"

const subscribeNoop = () => () => {}

/** True after hydration. Use it to render client-only state (sessionStorage, cookies) without a hydration mismatch. */
export function useMounted() {
  return React.useSyncExternalStore(subscribeNoop, () => true, () => false)
}

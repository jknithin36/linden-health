// Tiny per-tab demo state ("this result was opened", "this thread was read", "the bill was paid").
// Kept in sessionStorage so it survives navigation and reloads within the tab. Server render and
// hydration always see the empty starting state, so there are never hydration mismatches.
// A real portal would keep this on the server.

import { useSyncExternalStore } from "react"

const EMPTY: ReadonlySet<string> = new Set()

export function createSessionSet(key: string) {
  const listeners = new Set<() => void>()
  let value: ReadonlySet<string> | null = null

  const read = (): ReadonlySet<string> => {
    if (value) return value
    try {
      value = new Set(JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[])
    } catch {
      value = new Set()
    }
    return value
  }

  const add = (...ids: string[]) => {
    const current = read()
    if (ids.every((id) => current.has(id))) return
    value = new Set([...current, ...ids])
    try {
      sessionStorage.setItem(key, JSON.stringify([...value]))
    } catch {
      // Storage can be blocked (private mode); the change still applies to this page view.
    }
    listeners.forEach((l) => l())
  }

  const subscribe = (onChange: () => void) => {
    listeners.add(onChange)
    return () => listeners.delete(onChange)
  }

  const useSet = () => useSyncExternalStore(subscribe, read, () => EMPTY)

  return { add, useSet }
}

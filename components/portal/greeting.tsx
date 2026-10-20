"use client"

import { useSyncExternalStore } from "react"

import { overviewCopy } from "@/lib/data/portal"

const g = overviewCopy.greeting
const noop = () => () => {}

function forHour(hour: number) {
  if (hour < 12) return g.morning
  if (hour < 18) return g.afternoon
  return g.evening
}

/**
 * "Good morning / afternoon / evening, {name}". The server (and hydration) render the neutral
 * fallback; the browser then swaps in the visitor's local time of day, so there's no mismatch.
 */
export function Greeting({ name }: { name: string }) {
  const greeting = useSyncExternalStore(noop, () => forHour(new Date().getHours()), () => g.fallback)
  return <>{`${greeting}, ${name}`}</>
}

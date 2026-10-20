"use client"

// Browser side of the mock session: read the role cookie, switch roles, sign out.

import { useSyncExternalStore } from "react"

import { parseSession, SESSION_COOKIE, sessionCookieString, type Session, type SessionRole } from "@/lib/session"

const listeners = new Set<() => void>()
let cached: { raw: string; session: Session | null } = { raw: "\u0000", session: null }

function read(): Session | null {
  const raw = document.cookie
  if (raw !== cached.raw) {
    const value = raw
      .split("; ")
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1)
    cached = { raw, session: parseSession(value) }
  }
  return cached.session
}

/** The signed-in session (patient or staff), or null (also null during the server render and hydration). */
export function useSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    read,
    () => null
  )
}

/** Synchronous read for queries and actions (null outside the browser; callers fall back to the demo admin). */
export function getSessionSync(): Session | null {
  return typeof document === "undefined" ? null : read()
}

export function setSessionRole(role: SessionRole | null) {
  document.cookie = sessionCookieString(role)
  listeners.forEach((l) => l())
}

/**
 * Change the session and go to `href` with a full page load. A client-side push could replay
 * redirects the router cached while signed out (e.g. /book → /login), so we start fresh.
 */
export function signInAndGo(role: SessionRole | null, href: string) {
  setSessionRole(role)
  window.location.assign(href)
}

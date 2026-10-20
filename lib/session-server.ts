import { cookies } from "next/headers"

import { parseSession, SESSION_COOKIE } from "@/lib/session"

/** The mock staff session from the request cookie. Call inside a <Suspense> boundary. */
export async function getSession() {
  const jar = await cookies()
  return parseSession(jar.get(SESSION_COOKIE)?.value)
}

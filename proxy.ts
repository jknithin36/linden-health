import { NextResponse, type NextRequest } from "next/server"

import { canAccess, parseSession, SESSION_COOKIE } from "@/lib/session"

/**
 * Route protection (mock session cookie):
 * - the patient portal, booking and the staff admin all need a signed-in session (else → log in);
 * - a role on a page it can't open goes to its home page (staff get a notice).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", pathname + search)
    return NextResponse.redirect(url)
  }
  // A doctor's home is My day.
  if (session.role === "doctor" && (pathname === "/admin" || pathname === "/admin/")) return NextResponse.redirect(new URL("/admin/my-day", request.url))
  if (!canAccess(session.role, pathname)) {
    const url = new URL(session.home, request.url)
    if (session.role !== "patient") url.searchParams.set("denied", "1")
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/admin", "/admin/:path*", "/portal", "/portal/:path*", "/book"] }

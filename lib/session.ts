// Fictional data for demo purposes only.
// The mock session: one cookie holding the signed-in role (the demo patient or a staff role). It is readable on the server
// (admin layout, proxy route protection) and in the browser (role-aware pages). No real auth.
// Backend: swap the cookie value for a signed session token and resolve the user in parseSession
// (or your auth library's session helper); canAccess stays the single place for role rules.

export type SessionRole = "admin" | "front-desk" | "doctor" | "patient"

export const SESSION_COOKIE = "linden_session"

/** The demo person behind each role. `doctorId` links a doctor login to their provider record. */
export const sessionUsers: Record<SessionRole, { role: SessionRole; staffId: string; doctorId?: string; name: string; home: string }> = {
  admin: { role: "admin", staffId: "s-taylor", name: "Taylor Brooks", home: "/admin" },
  "front-desk": { role: "front-desk", staffId: "s-jamie", name: "Jamie Ortiz", home: "/admin" },
  doctor: { role: "doctor", staffId: "s-chen", doctorId: "dr-chen", name: "Dr. Emily Chen", home: "/admin/my-day" },
  // The demo patient. `staffId` is her patient id, so the shared shape still works.
  patient: { role: "patient", staffId: "p-sarah", name: "Sarah Mitchell", home: "/portal" },
}

export type Session = (typeof sessionUsers)[SessionRole]

const isRole = (v: unknown): v is SessionRole => v === "admin" || v === "front-desk" || v === "doctor" || v === "patient"

export function parseSession(value: string | undefined | null): Session | null {
  return isRole(value) ? sessionUsers[value] : null
}

/**
 * Which roles may open a path. Doctors get their own pages plus patients, schedule and
 * messages; the front desk can't open the doctor's inbox or visit notes.
 */
export function canAccess(role: SessionRole, pathname: string) {
  const p = pathname.replace(/\/+$/, "") || "/"
  const under = (base: string) => p === base || p.startsWith(`${base}/`)
  // Patients use the portal and booking; staff can open them too (for demos and support).
  if (under("/portal") || under("/book")) return true
  if (role === "patient") return false
  if (role === "admin") return true
  if (role === "doctor") return ["/admin/my-day", "/admin/inbox", "/admin/visit", "/admin/patients", "/admin/schedule", "/admin/messages"].some(under)
  // front desk
  return !["/admin/my-day", "/admin/inbox", "/admin/visit"].some(under)
}

/** Cookie string for the browser (30 days, whole site). */
export const sessionCookieString = (role: SessionRole | null) =>
  role ? `${SESSION_COOKIE}=${role}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax` : `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`

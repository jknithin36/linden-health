// Sidebar navigation for each staff role. Admin and front desk share the admin nav;
// doctors get their own, focused on today, patients and messages.

import { adminNav, type AdminNavItem } from "@/lib/data/admin"
import type { SessionRole } from "@/lib/session"

export type DashboardNavId = AdminNavItem["id"] | "my-day" | "inbox" | "my-patients" | "my-schedule" | "my-messages"
export type DashboardNavItem = {
  id: DashboardNavId
  label: string
  href: string
  /** Path that marks this item active (and its sub-paths). */
  match: string
  /** Other paths that belong to this item, e.g. a visit note opened from My day. */
  alsoMatch?: string[]
}
export type DashboardNavGroup = { label?: string; items: DashboardNavItem[] }

export const doctorNav: DashboardNavGroup[] = [
  {
    label: "Today",
    items: [
      { id: "my-day", label: "My day", href: "/admin/my-day", match: "/admin/my-day", alsoMatch: ["/admin/visit"] },
      { id: "inbox", label: "Inbox", href: "/admin/inbox", match: "/admin/inbox" },
    ],
  },
  {
    label: "Patients",
    items: [
      { id: "my-patients", label: "My patients", href: "/admin/patients?doctor=me", match: "/admin/patients" },
      { id: "my-schedule", label: "Schedule", href: "/admin/schedule?doctor=me", match: "/admin/schedule" },
    ],
  },
  {
    label: "Communication",
    items: [{ id: "my-messages", label: "Messages", href: "/admin/messages?assigned=me", match: "/admin/messages" }],
  },
]

const staffNav: DashboardNavGroup[] = adminNav.map((g) => ({ label: g.label, items: g.items.map((i) => ({ ...i, match: i.href })) }))

/** Front desk loses nothing from the admin nav; the doctor-only pages aren't in it. */
export const navFor = (role: SessionRole | null): DashboardNavGroup[] => (role === "doctor" ? doctorNav : staffNav)

const under = (pathname: string, base: string) => (base === "/admin" ? pathname === "/admin" : pathname === base || pathname.startsWith(`${base}/`))

/** The item whose path best matches (longest first; the overview only on exact match). */
export function activeNavItem(groups: DashboardNavGroup[], pathname: string) {
  const items = groups.flatMap((g) => g.items).sort((a, b) => b.match.length - a.match.length)
  return items.find((i) => under(pathname, i.match)) ?? items.find((i) => i.alsoMatch?.some((m) => under(pathname, m))) ?? null
}

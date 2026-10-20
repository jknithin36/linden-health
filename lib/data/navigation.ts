// Navigation for a fictional clinic: navbar, menu sheet.

import { site } from "@/lib/data/site"

export type NavLink = { label: string; href: string }
export type NavColumn = { title: string; links: NavLink[] }

/** Left side of the navbar. */
export const primaryLinks: NavLink[] = [
  { label: "Find a doctor", href: "/find-a-doctor" },
  { label: "Services", href: "/services" },
  { label: "FAQs", href: "/faq" },
  { label: "Insurance", href: "/insurance" },
]

export const loginLink: NavLink = { label: "Log in", href: "/login" }
/** Shown instead of "Log in" once someone is signed in; the href is their role's home. */
export const dashboardLabel = "Dashboard"
export const bookLink: NavLink = { label: "Book a visit", href: "/book" }

/** Large links at the top of the menu sheet. */
export const menuExplore: NavLink[] = [
  ...primaryLinks,
  { label: "Video visits", href: "/services#video" },
  { label: "Patient resources", href: "/faq" },
  { label: "About us", href: "/about" },
]

/** Small two-column links under the Explore list. */
export const menuColumns: NavColumn[] = [
  {
    title: "Patients",
    links: [
      { label: "Patient portal", href: "/portal" },
      { label: "Pay a bill", href: "/portal/billing" },
      { label: "Request records", href: "/portal/records" },
    ],
  },
  {
    title: "Clinic",
    links: [
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
]

export const navCopy = {
  navLabel: "Main",
  homeLabel: `${site.name} home`,
  openMenu: "Open menu",
  closeMenu: "Close menu",
  menuTitle: "Menu",
  menuDescription: "Site navigation",
  menuLabel: "Menu",
  exploreTitle: "Explore",
  callUs: "Call us",
}

// Fictional data for demo purposes only.
// Copy for the staff admin: navigation, page headings and shared labels.

export type AdminNavId = "overview" | "schedule" | "queue" | "appointments" | "patients" | "doctors" | "messages" | "billing" | "reports" | "settings"

export type AdminNavItem = { id: AdminNavId; label: string; href: string }

export const adminNav: { label?: string; items: AdminNavItem[] }[] = [
  { items: [{ id: "overview", label: "Overview", href: "/admin" }] },
  {
    label: "Front desk",
    items: [
      { id: "schedule", label: "Schedule", href: "/admin/schedule" },
      { id: "queue", label: "Queue", href: "/admin/queue" },
      { id: "appointments", label: "Appointments", href: "/admin/appointments" },
    ],
  },
  {
    label: "Care",
    items: [
      { id: "patients", label: "Patients", href: "/admin/patients" },
      { id: "doctors", label: "Doctors", href: "/admin/doctors" },
      { id: "messages", label: "Messages", href: "/admin/messages" },
    ],
  },
  {
    label: "Business",
    items: [
      { id: "billing", label: "Billing", href: "/admin/billing" },
      { id: "reports", label: "Reports", href: "/admin/reports" },
    ],
  },
  { items: [{ id: "settings", label: "Settings", href: "/admin/settings" }] },
]

/** Every page in the staff navigation, in order (also the "Pages" group in global search). */
export const adminNavItems = adminNav.flatMap((g) => g.items)

export const adminCopy = {
  navLabel: "Admin navigation",
  homeLabel: "Linden Health admin home",
  toggle: "Toggle sidebar",
  footer: "Demo data. Linden Health is a fictional clinic.",
  doctorFooter: "Demo data. Not for clinical use.",
  denied: "You don’t have access to that page",
  clinicLabel: "Clinic",
  allClinics: "All clinics",
  search: { label: "Search", placeholder: "Search patients, MRN, phone, appointments, claims…", shortcut: "⌘K", empty: "No matches. Try a name, MRN, phone number or claim number." },
  account: {
    label: "Account menu",
    role: "Demo role",
    portal: { label: "Open patient portal", href: "/portal" },
    website: { label: "Go to website", href: "/" },
    logout: { label: "Log out", href: "/login" },
  },
  roles: [
    { value: "admin", label: "Admin" },
    { value: "front-desk", label: "Front desk" },
    { value: "doctor", label: "Doctor" },
  ],
  newAppointment: "New appointment",
  pages: {
    overview: { title: "Overview", description: "How today is going across the clinic." },
    schedule: { title: "Schedule", description: "Every provider’s day, side by side." },
    queue: { title: "Queue", description: "Who’s here, who’s waiting, and who’s with a doctor." },
    appointments: { title: "Appointments", description: "Search, filter and manage every booking." },
    patients: { title: "Patients", description: "Find a chart, check a balance, or add someone new." },
    doctors: { title: "Doctors", description: "Providers, their hours and how full their days are." },
    messages: { title: "Messages", description: "Patient conversations and refill requests." },
    billing: { title: "Billing", description: "Claims, payments, balances and refunds." },
    reports: { title: "Reports", description: "Visits, waits, revenue and utilization over time." },
    settings: { title: "Settings", description: "Clinics, services, insurance, team and reminders." },
    "my-day": { title: "My day", description: "Your patients, notes and inbox for today." },
    inbox: { title: "Inbox", description: "Results, refills, notes and messages waiting on you." },
    visit: { title: "Visit note", description: "Document the visit and sign the note." },
  },
  error: { title: "This page didn’t load", text: "Something went wrong on our side. Try again, or go back to the overview.", back: "Back to overview" },
} as const

/** Copy for /admin/appointments. */
export const appointmentsCopy = {
  tabs: [
    { id: "today", label: "Today" },
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "no-shows", label: "No-shows" },
    { id: "cancelled", label: "Cancelled" },
  ],
  search: "Search name, MRN, phone or ID…",
  export: "Export",
  exported: (n: number) => `Exported ${n} appointment${n === 1 ? "" : "s"}`,
  bulk: { confirm: "Mark confirmed", remind: "Send reminders", export: "Export" },
  menu: { view: "View details", confirm: "Mark confirmed", remind: "Send reminder", change: "Reschedule or cancel…" },
  empty: {
    filtered: { title: "No appointments match", text: "Try a wider date range or remove a filter." },
    none: { title: "No appointments here yet", text: "Booked visits will show up here." },
    clear: "Clear filters",
  },
} as const

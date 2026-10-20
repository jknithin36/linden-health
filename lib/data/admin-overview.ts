// Fictional data for demo purposes only.
// Copy for the admin overview (/admin).

export const overviewCopy = {
  /** The demo clock is pinned to 2:25 PM. Without a name yet (first render), just the greeting. */
  greeting: (firstName?: string) => (firstName ? `Good afternoon, ${firstName}` : "Good afternoon"),
  openQueue: "Open queue",
  viewAll: "View all",
  stats: {
    today: "Appointments today",
    todayHint: "vs. last Monday",
    checkedIn: "Checked in",
    checkedInHint: "of today’s visits",
    waiting: "Waiting now",
    avg: "Avg",
    longest: "longest",
    open: "Open slots left",
    utilization: "of capacity booked",
  },
  queue: { title: "Live queue", link: "Open queue", empty: "No one is waiting right now.", cols: ["Patient", "Appt", "Provider", "Status", "Wait"] },
  trend: { title: "Last 14 days", link: "Reports", booked: "Booked", completed: "Completed" },
  upNext: { title: "Up next today", link: "Schedule", empty: "No more visits today." },
  attention: {
    title: "Needs attention",
    clear: "All caught up.",
    overdue: "Messages waiting over 24 hours",
    unread: "Unread patient messages",
    refills: "New refill requests",
    denied: "Denied claims to rework",
    forms: "Later today: forms not done",
    insurance: "Later today: insurance not verified",
  },
  billing: { title: "Billing this month", collected: "Collected", outstanding: "Outstanding A/R", denial: "Denial rate", days: "Avg days to pay" },
  activity: { title: "Recent activity", link: "Audit log" },
} as const

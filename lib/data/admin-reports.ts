// Fictional data for demo purposes only.
// Copy for the admin reports page: range presets, KPI labels and chart titles.

export const reportsCopy = {
  presets: [
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "quarter", label: "This quarter" },
    { id: "custom", label: "Custom" },
  ],
  export: "Export report",
  vsPrevious: "vs previous period",
  kpis: {
    visits: "Completed visits",
    noShow: "No-show rate",
    wait: "Avg wait",
    video: "Video share",
    revenue: "Insurance revenue",
  },
  charts: {
    appointments: { title: "Appointments over time", subtitle: "Booked vs completed", booked: "Booked", completed: "Completed" },
    rates: { title: "No-show and cancellation rate", subtitle: "By week", noShow: "No-show", cancel: "Cancelled" },
    specialty: { title: "Visits by specialty", subtitle: "Completed visits", visits: "Visits" },
    type: { title: "Visits by type", subtitle: "In person vs video" },
    waitClinic: { title: "Average wait by clinic", subtitle: "Check-in to rooming, minutes", minutes: "Minutes" },
    waitHour: { title: "Average wait by hour", subtitle: "Check-in to rooming, minutes", minutes: "Minutes" },
    revenue: { title: "Revenue", subtitle: "Billed vs collected by month", billed: "Billed", collected: "Collected" },
    payer: { title: "Payer mix", subtitle: "Claims by plan category" },
    newReturning: { title: "New vs returning patients", subtitle: "Completed visits by week", new: "New", returning: "Returning" },
    utilization: { title: "Doctor utilization", subtitle: "Booked slots as a share of open slots", utilization: "Utilization" },
  },
  empty: { title: "No visits in this range", text: "Pick a wider date range or another clinic." },
} as const

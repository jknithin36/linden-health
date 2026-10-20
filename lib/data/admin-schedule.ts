// Fictional data for demo purposes only.
// Copy for the admin schedule and doctors pages.

export const scheduleCopy = {
  views: [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "doctor", label: "Doctor" },
  ],
  stats: { booked: "Booked", open: "Open slots", utilization: "Utilization", scope: "All clinics" },
  legend: [
    { id: "scheduled", label: "Scheduled" },
    { id: "confirmed", label: "Confirmed" },
    { id: "in-progress", label: "Arrived · in clinic" },
    { id: "waiting", label: "Waiting" },
    { id: "completed", label: "Completed" },
    { id: "missed", label: "No-show · late cancel" },
  ],
  blocked: "Blocked",
  closed: "Not working",
  off: "Off",
  emptyTitle: "No providers working",
  emptyText: "Nobody is scheduled for this day with the current filters. Try another date or clear filters.",
  weekHint: "Booked / capacity in 20-minute slots. Click a day to open it.",
  doctorPick: "Choose a provider",
  doctorHint: "Next 7 days for one provider.",
  slotHint: "Click an open slot to book.",
}

export const doctorsCopy = {
  layout: { grid: "Grid", table: "Table" },
  search: "Search name or specialty…",
  clear: "Clear filters",
  emptyTitle: "No providers match",
  emptyText: "Try removing a filter.",
  detail: {
    back: "All doctors",
    hours: { title: "Weekly working hours", text: "Set the clinic and hours for each weekday. Patients can book 20-minute slots inside these hours.", save: "Save hours", reset: "Discard changes", locked: "Only admins can change working hours. Switch the demo role to Admin to edit." },
    timeOff: { title: "Time off", text: "Days this provider can’t be booked.", add: "Add time off", dialogText: "Existing bookings in this range stay put; reschedule them from the schedule.", empty: "No time off planned.", locked: "Only admins can change time off." },
    utilization: { title: "Utilization", text: "Booked share of open slots, last 8 weeks" },
    upcoming: { title: "Upcoming appointments", empty: "Nothing booked yet." },
    stats: { noShow: "No-show rate", noShowHint: "Last 8 weeks", avgVisit: "Average visit", avgVisitHint: "Roomed to done", panel: "Patients on panel", panelHint: "Primary care patients" },
  },
}

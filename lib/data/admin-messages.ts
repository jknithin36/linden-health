// Fictional data for demo purposes only.
// Copy for the admin inbox (/admin/messages).

export const messagesCopy = {
  tabs: { threads: "Conversations", refills: "Refills" },
  search: "Search name, MRN or message…",
  filters: {
    status: { title: "Status", options: [{ value: "open", label: "Open" }, { value: "waiting", label: "Waiting on patient" }, { value: "closed", label: "Closed" }] },
    topic: {
      title: "Topic",
      options: [
        { value: "symptoms", label: "Symptoms" },
        { value: "results", label: "Results" },
        { value: "prescription", label: "Prescription" },
        { value: "appointment", label: "Appointment" },
        { value: "billing", label: "Billing" },
        { value: "other", label: "Other" },
      ],
    },
    priority: { title: "Priority", options: [{ value: "high", label: "High" }, { value: "normal", label: "Normal" }] },
    mine: "Assigned to me",
    unread: "Unread",
  },
  sort: [
    { value: "-last", label: "Newest first" },
    { value: "last", label: "Oldest first" },
    { value: "-priority", label: "High priority first" },
  ],
  loadMore: "Load more",
  overdue: "Over 24 h",
  empty: { title: "No conversations match", text: "Try clearing a filter or searching for something else." },
  noThread: { title: "Pick a conversation", text: "Choose a thread on the left to read it and reply." },
  newThread: {
    title: (name: string) => `New message to ${name}`,
    text: "There are no conversations with this patient yet. Start one below.",
    subject: "Subject",
    subjectPlaceholder: "e.g. Follow-up from your visit",
  },
  internalLabel: "Internal note · staff only",
  composer: {
    placeholder: "Write a reply…",
    notePlaceholder: "Add a note only staff can see…",
    internal: "Internal note",
    attach: "Attach files",
    send: "Send",
    addNote: "Add note",
    hint: "⌘ Enter to send",
    quickReplies: "Quick replies",
  },
  quickReplies: [
    { label: "Booked", text: "We’ve booked you for [day] at [time] with [provider]. Reply here if that time doesn’t work." },
    { label: "Results ready", text: "Your results are ready in the portal under Results. Your doctor added a note for you." },
    { label: "Refill sent", text: "Your refill was sent to your pharmacy. It’s usually ready within a few hours." },
    { label: "Need a visit", text: "Thanks for letting us know. This is best looked at in person. Can we book you a visit this week?" },
    { label: "Billing", text: "Thanks for reaching out. I’ve looked at your account and will follow up with the details shortly." },
  ],
  context: {
    title: "Patient",
    openChart: "Open chart",
    next: "Next visit",
    none: "None booked",
    balance: "Balance",
    allergies: "Allergies",
    noAllergies: "No known allergies",
    results: "Recent results",
    noResults: "No results on file",
    assign: "Assigned to",
    status: "Status",
    book: "Book appointment",
  },
  refills: {
    empty: "No refill requests right now.",
    approve: "Approve",
    route: "Route to doctor",
    deny: "Deny",
    requested: "Requested",
  },
  back: "Back",
  details: "Patient details",
} as const

/** "Symptoms", "Billing"… by thread topic. */
export const topicLabel: Record<string, string> = Object.fromEntries(messagesCopy.filters.topic.options.map((o) => [o.value, o.label]))

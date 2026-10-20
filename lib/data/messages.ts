// /portal/messages: secure conversations with the care team and billing. Fictional demo data,
// pinned to Monday, Oct 19, 2026. These threads also feed the Messages panel on the overview.
// `Conversation` / `ThreadMessage` are the shapes a messaging API would return; sending is local
// state in the page today (replace with a POST to e.g. /api/messages).

import { doctorBySlug } from "@/lib/data/doctors"
import type { PersonId } from "@/lib/data/portal"

export type MessageCategory = "care" | "billing"

export type ThreadMessage = {
  id: string
  /** "you" is Sarah, the account owner. */
  from: "you" | "them"
  time: string
  text: string
  /** A link to a portal page, or (no `href`) a file the patient attached. */
  attachment?: { label: string; href?: string }
}

export type Conversation = {
  id: string
  from: string
  /** "Dr. Chen", for "Message Dr. Chen" and the composer. */
  short: string
  initials: string
  image?: string
  /** Show the Linden Health mark instead of a photo (billing, front desk). */
  brand?: boolean
  /** Show a clinician icon instead of a photo (nurses). */
  clinician?: boolean
  role: string
  category: MessageCategory
  about: { personId?: PersonId; topic: string }
  time: string
  unread: boolean
  replyTime: string
  messages: ThreadMessage[]
}

const photo = (slug: string) => doctorBySlug(slug)?.image

export const conversations: Conversation[] = [
  {
    id: "chen-lily-cough",
    from: "Dr. Emily Chen",
    short: "Dr. Chen",
    initials: "EC",
    image: photo("emily-chen"),
    role: "Dr. Emily Chen, MD · Family medicine",
    category: "care",
    about: { personId: "lily", topic: "Cough" },
    time: "2h ago",
    unread: true,
    replyTime: "Usually replies within 1 business day",
    messages: [
      {
        id: "1",
        from: "you",
        time: "Today, 10:42 AM",
        text: "Lily still has a cough after 5 days, and she had a low fever last night (99.9 °F). Should I bring her in?",
      },
      {
        id: "2",
        from: "them",
        time: "Today, 12:05 PM",
        text: "Thanks for letting me know about Lily’s cough. A cough after a cold can last up to 2 weeks, but since she had a fever, let’s take a look. I’ve held a spot for her Tuesday at 4:30. If she has trouble breathing before then, go to urgent care.",
        attachment: { label: "Visit booked · Tue, Oct 21 · 4:30 PM", href: "/portal/visits" },
      },
    ],
  },
  {
    id: "billing-october",
    from: "Linden Health Billing",
    short: "Billing",
    initials: "LH",
    brand: true,
    role: "Billing team",
    category: "billing",
    about: { topic: "October statement" },
    time: "Yesterday",
    unread: true,
    replyTime: "Usually replies within 2 business days",
    messages: [
      {
        id: "1",
        from: "them",
        time: "Yesterday, 9:15 AM",
        text: "Your October statement is ready to view. Northbridge Health PPO covered $298.40 of your last two visits, and your share is $45.00, due November 4. You can pay online any time.",
        attachment: { label: "October statement · $45.00", href: "/portal/billing" },
      },
    ],
  },
  {
    id: "gomez-sarah-labs",
    from: "Nurse Alicia Gomez",
    short: "Nurse Gomez",
    initials: "AG",
    clinician: true,
    role: "Alicia Gomez, RN · Care team",
    category: "care",
    about: { personId: "sarah", topic: "Lab results" },
    time: "Oct 15",
    unread: false,
    replyTime: "Usually replies within 1 business day",
    messages: [
      {
        id: "1",
        from: "them",
        time: "Oct 15, 2:10 PM",
        text: "Hi Sarah, your lab results are in. Dr. Chen added a note for you. Most things look great. She’d like you to start vitamin D and recheck in January.",
        attachment: { label: "Annual blood work · 18 of 20 in range", href: "/portal/results/sarah-annual-2026-10" },
      },
      { id: "2", from: "you", time: "Oct 15, 6:48 PM", text: "Thank you! Is it okay to take the vitamin D in the evening?" },
      { id: "3", from: "them", time: "Oct 16, 8:30 AM", text: "Yes, any time of day is fine. Taking it with a meal helps your body absorb it." },
    ],
  },
  {
    id: "khalil-david-bp",
    from: "Dr. Omar Khalil",
    short: "Dr. Khalil",
    initials: "OK",
    image: photo("omar-khalil"),
    role: "Dr. Omar Khalil, MD · Family medicine",
    category: "care",
    about: { personId: "david", topic: "Blood pressure" },
    time: "Sep 19",
    unread: false,
    replyTime: "Usually replies within 1 business day",
    messages: [
      { id: "1", from: "you", time: "Sep 19, 7:20 AM", text: "Here are David’s home readings from this week. Mornings have been 126 to 130 on top." },
      { id: "2", from: "them", time: "Sep 19, 11:02 AM", text: "Your readings look better. Keep up the walks, and keep the log going until your physical on November 3." },
    ],
  },
]

export const conversationById = (id: string | null) => conversations.find((c) => c.id === id)

/** Who a new message can go to. */
export const recipients: ({ id: string; label: string } & Pick<Conversation, "from" | "short" | "role" | "category" | "image" | "brand" | "initials" | "replyTime">)[] = [
  {
    id: "care",
    label: "Care team (Dr. Emily Chen)",
    from: "Dr. Emily Chen",
    short: "Dr. Chen",
    initials: "EC",
    image: photo("emily-chen"),
    role: "Dr. Emily Chen, MD · Family medicine",
    category: "care",
    replyTime: "Usually replies within 1 business day",
  },
  { id: "billing", label: "Billing", from: "Linden Health Billing", short: "Billing", initials: "LH", brand: true, role: "Billing team", category: "billing", replyTime: "Usually replies within 2 business days" },
  {
    id: "front-desk",
    label: "Front desk",
    from: "Linden Health Front desk",
    short: "Front desk",
    initials: "LH",
    brand: true,
    role: "Front desk · Linden Health Cleveland",
    category: "care",
    replyTime: "Usually replies within 1 business day",
  },
]

export const topics = ["Question about symptoms", "Results", "Prescription", "Appointment", "Billing", "Other"]

export const messagesCopy = {
  heading: "Messages",
  newMessage: "New message",
  tabs: [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "care", label: "Care team" },
    { id: "billing", label: "Billing" },
  ] as { id: "all" | "unread" | MessageCategory; label: string }[],
  tabsLabel: "Show conversations",
  unreadLabel: "Unread",
  you: "You",
  justNow: "Just now",
  categoryLabel: { care: "Care team", billing: "Billing" } as Record<MessageCategory, string>,
  about: (name: string | null, topic: string) => (name ? `${name} · ${topic}` : topic),
  back: "All messages",
  input: { label: "Write a message", placeholder: "Write a message…", attach: "Attach file", send: "Send", remove: (name: string) => `Remove ${name}` },
  safety: "For emergencies, call 911. Messages are for non-urgent questions.",
  empty: "No conversations here.",
  compose: {
    title: "New message",
    to: "To",
    about: "About",
    topic: "Topic",
    message: "Message",
    placeholder: "Write your question. Include symptoms, how long, and any medicines you’ve tried.",
    send: "Send message",
    success: (replyTime: string) => `Message sent. ${replyTime}.`,
    open: "Open conversation",
  },
}

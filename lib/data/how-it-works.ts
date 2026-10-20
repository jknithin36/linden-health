// Dummy content for a fictional clinic. Swap `image` in when real photos exist.

import { site } from "@/lib/data/site"

export type StepPreview =
  | {
      kind: "appointment"
      title: string
      when: string
      where: string
    }
  | {
      kind: "doctor"
      name: string
      role: string
      note: string
    }
  | {
      kind: "plan"
      title: string
      items: { label: string; detail: string }[]
    }
  | {
      kind: "message"
      from: string
      text: string
      time: string
    }

export type HowItWorksStep = {
  id: string
  title: string
  description: string
  /**
   * Finished square artwork. It already carries the step number and caption card,
   * so the card shows it as-is. Until it exists, `placeholder` plus the live preview is shown.
   */
  image?: string
  /** The artwork already shows the step number, so the card doesn't add one. */
  imageNumbered?: boolean
  /** The artwork already shows a caption card, so the card skips the live preview. */
  imageCaptioned?: boolean
  imageAlt: string
  /** CSS background for the placeholder photo. */
  placeholder: string
  preview: StepPreview
}

export const howItWorksHeading = "How it works"
export const howItWorksIntro =
  `Getting care should be simple. Here’s what to expect at ${site.name}.`

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: "meet",
    title: "Meet your doctor",
    description:
      "A real conversation, not a rushed checkup. Your doctor takes time to understand you and your history.",
    image: "/images/how-it-works/meet-your-doctor-photo.webp",
    imageAlt: "A smiling doctor in a white coat talking with an older patient across a desk",
    placeholder: "linear-gradient(160deg, #a9b7b0 0%, #63766d 100%)",
    preview: {
      kind: "doctor",
      name: "Unhurried visits",
      role: "30 minutes with your doctor",
      note: "Same doctor every time",
    },
  },
  {
    id: "book",
    title: "Book in minutes",
    description:
      "Pick a time that suits you, at a clinic near you or by video. Most visits are available the same week.",
    image: "/images/how-it-works/book-in-minutes-golden.webp",
    imageCaptioned: true,
    imageAlt: "A woman holding her phone at sunset, with an appointment confirmation shown",
    placeholder: "linear-gradient(160deg, #b9a998 0%, #7d6d5f 100%)",
    preview: {
      kind: "appointment",
      title: "Visit confirmed",
      when: "Thu 9:30am",
      where: "Cleveland",
    },
  },
  {
    id: "plan",
    title: "Get a clear plan",
    description:
      "Leave with next steps for tests, treatment and everyday habits, explained in plain language.",
    image: "/images/how-it-works/clear-plan-golden.webp",
    imageCaptioned: true,
    imageAlt: "A man writing in a notebook at sunset, with his care plan of tests, treatment and habits shown",
    placeholder: "linear-gradient(160deg, #b3aec2 0%, #6c6783 100%)",
    preview: {
      kind: "plan",
      title: "Your care plan",
      items: [
        { label: "Annual blood work", detail: "Scheduled for Oct 24" },
        { label: "Flu vaccine", detail: "Due this month" },
        { label: "Follow-up visit", detail: "In 3 months" },
      ],
    },
  },
  {
    id: "follow-up",
    title: "Stay on track",
    description:
      "Results, reminders and messages live in one place, and your care team is always a message away.",
    image: "/images/how-it-works/stay-on-track.webp",
    imageNumbered: true,
    imageCaptioned: true,
    imageAlt: "A woman on a sofa reading a message from her care team",
    placeholder: "linear-gradient(160deg, #c2ae9c 0%, #8a6f5c 100%)",
    preview: {
      kind: "message",
      from: "Dr. Chen",
      text: "Your results look great. See you at your follow-up!",
      time: "2m ago",
    },
  },
]

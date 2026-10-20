// Fictional data for demo purposes only.

import { site } from "@/lib/data/site"

export type FooterLink = { label: string; href: string }
export type FooterColumn = { title: string; links: FooterLink[] }

export type SocialIcon = "x" | "instagram" | "linkedin" | "facebook"
export type SocialLink = { label: string; href: string; icon: SocialIcon }

export type CtaPhoto = {
  desktop: string
  tablet: string
  mobile: string
  alt: string
}

/** Full-screen CTA photo, art-directed per breakpoint. `null` shows `ctaPlaceholder` instead. */
export const ctaPhoto: CtaPhoto | null = {
  desktop: "/images/cta/cta-desktop.webp",
  tablet: "/images/cta/cta-tablet.webp",
  mobile: "/images/cta/cta-mobile.webp",
  alt: "A smiling doctor in blue scrubs talking with an older patient during a home visit",
}
export const ctaPlaceholder = "linear-gradient(135deg, #8d7766 0%, #5b4a3e 55%, #3a302a 100%)"

export const cta = {
  /** Small line above the heading. The rating already appears in Patient stories, so it isn't repeated here. */
  eyebrow: "Book online in about 2 minutes",
  heading: "Your next visit is closer than you think",
  /** New reassurances only; same-week visits and insurance are covered by the hero and Insurance section. */
  checks: [
    { id: "no-referral", label: "No referral needed" },
    { id: "video", label: "Video visits 7 days a week" },
    { id: "results", label: "Results in your portal" },
  ],
  primary: { label: "Book a visit", href: "/book" },
  secondary: { label: "Find a doctor", href: "/find-a-doctor" },
} as const

export const footerColumns: FooterColumn[] = [
  {
    title: site.name,
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Find a doctor", href: "/find-a-doctor" },
      { label: "Services", href: "/services" },
      { label: "Insurance", href: "/insurance" },
    ],
  },
  {
    title: "Patients",
    links: [
      { label: "Patient portal", href: "/portal" },
      { label: "Book a visit", href: "/book" },
      { label: "Pay a bill", href: "/portal/billing" },
      { label: "Request records", href: "/portal/records" },
      { label: "Video visits", href: "/services#video" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact us", href: "/contact" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "Health guides",
    links: [
      { label: "Choosing a primary care doctor", href: "/blog/choosing-a-primary-care-doctor" },
      { label: "Preparing for your annual physical", href: "/blog/preparing-for-your-annual-physical" },
      { label: "Understanding your lab results", href: "/blog/understanding-your-lab-results" },
      { label: "When to see a dermatologist", href: "/blog/when-to-see-a-dermatologist" },
      { label: "Heart health basics", href: "/blog/heart-health-basics" },
      { label: "Kids' vaccine schedule", href: "/blog/kids-vaccine-schedule" },
    ],
  },
]

/** The "Connect" (social) group sits under this column on tablet and desktop. */
export const connectUnderColumn = "Company"

export const socialLinks: SocialLink[] = [
  { label: "X", href: "#", icon: "x" },
  { label: "Instagram", href: "#", icon: "instagram" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "Facebook", href: "#", icon: "facebook" },
]

export const legalLinks: FooterLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Patient rights", href: "/patient-rights" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Cookie preferences", href: "#" },
]

export const footerCopy = {
  homeLabel: `${site.name} home`,
  emailLabel: "Email address",
  signUp: "Sign up",
  connectTitle: "Connect",
  legalLabel: "Legal",
  opensInNewTab: (label: string) => `${label} (opens in a new tab)`,
  stores: {
    apple: { top: "Download on the", bottom: "App Store", href: "#" },
    google: { top: "Get it on", bottom: "Google Play", href: "#" },
  },
  guideLead: "Not sure where to start?",
  guideRest: " Get our free guide to choosing the right doctor for your family.",
  emailPlaceholder: "Your email",
  emailError: "Enter a valid email address",
  success: "You’re in! Check your inbox.",
  appTitle: `Get the ${site.name} app`,
  appBody: "Book visits, message your care team, and see results on the go.",
  copyright: `© 2026 ${site.name}. All rights reserved.`,
  disclaimer:
    `${site.name} is a fictional clinic. All names, data, and logos are for demonstration only.`,
}

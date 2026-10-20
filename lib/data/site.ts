// Site-wide facts for a fictional clinic. Every section reads these, so numbers stay consistent.

export const site = {
  name: "Linden Health",
  description: "Primary and specialty care for your whole family, close to home.",
  phone: { display: "(216) 555-0100", tel: "+12165550100" },
  billingPhone: { display: "(216) 555-0142", tel: "+12165550142" },
  billingHours: "Monday to Friday, 8 AM to 6 PM",
  rating: { score: "4.9", count: "12,000+" },
  /** Clinics in Greater Cleveland. */
  locations: ["Cleveland", "Lakewood", "Beachwood"],
  region: "Greater Cleveland",
  logo: {
    dark: "/brand/linden-health-dark.png",
    light: "/brand/linden-health-white.png",
    width: 1151,
    height: 228,
  },
} as const

/** One of the clinic towns in `site.locations`. */
export type Location = (typeof site.locations)[number]

/** "Linden Health Cleveland" */
export const locationName = (location: string) => `${site.name} ${location}`

/** Branded 404, also shown for links to pages this template doesn't include yet. */
export const notFoundCopy = {
  title: `Page not found · ${site.name}`,
  label: "404",
  heading: "This page isn’t here yet",
  body: `It may have moved, or it’s not part of the ${site.name} template. Here are the pages that are:`,
  links: [
    { label: "Home", href: "/", hint: "Start from the beginning" },
    { label: "Find a doctor", href: "/find-a-doctor", hint: "Search 20 doctors by specialty and clinic" },
    { label: "Services", href: "/services", hint: "Six specialties and seven services" },
    { label: "Insurance", href: "/insurance", hint: "Check your plan and self-pay prices" },
    { label: "FAQs", href: "/faq", hint: "25 answers in 5 topics" },
    { label: "Book a visit", href: "/book", hint: "It takes about two minutes" },
  ],
}

/** Shown by the error boundaries of the marketing pages and /book. */
export const routeErrorCopy = {
  label: "Something went wrong",
  heading: "This page didn’t load",
  body: "It’s probably a hiccup on our side. Try again, or head back to the homepage.",
  retry: "Try again",
  home: { label: "Go to the homepage", href: "/" },
}

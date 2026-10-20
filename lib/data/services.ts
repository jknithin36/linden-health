// Services for a fictional clinic. Specialties come from lib/data/specialties.ts.

import { site } from "@/lib/data/site"

export type ServiceCategory = "everyday" | "specialists" | "tests" | "wellness"

export const serviceCategories: { id: ServiceCategory; label: string }[] = [
  { id: "everyday", label: "Everyday care" },
  { id: "specialists", label: "Specialists" },
  { id: "tests", label: "Tests and imaging" },
  { id: "wellness", label: "Wellness" },
]

/** Category + extra search words for each specialty (by specialty id). */
export const specialtyMeta: Record<string, { category: ServiceCategory; keywords: string[] }> = {
  "family-medicine": { category: "everyday", keywords: ["checkup", "fever", "cough", "sick", "diabetes", "flu"] },
  pediatrics: { category: "everyday", keywords: ["child", "kids", "baby", "newborn", "teen", "fever"] },
  "womens-health": { category: "specialists", keywords: ["pregnancy", "menopause", "pap smear", "gynecology"] },
  dermatology: { category: "specialists", keywords: ["rash", "mole", "skin", "hair", "nails", "psoriasis"] },
  cardiology: { category: "specialists", keywords: ["heart", "chest pain", "palpitations", "cholesterol"] },
  orthopedics: { category: "specialists", keywords: ["knee pain", "back pain", "joint", "sports injury", "broken bone"] },
}

export type ExtraService = {
  id: "labs" | "imaging" | "vaccines" | "physical-therapy" | "mental-health" | "nutrition" | "video"
  name: string
  summary: string
  priceFrom: number
  category: ServiceCategory
  keywords: string[]
  href: string
}

export const extraServices: ExtraService[] = [
  {
    id: "labs",
    name: "Lab testing",
    summary: "Blood work and tests on site, with results in your portal.",
    priceFrom: 45,
    category: "tests",
    keywords: ["blood test", "bloodwork", "cholesterol test", "results"],
    href: "/book?service=labs",
  },
  {
    id: "imaging",
    name: "X-ray and imaging",
    summary: "Quick X-rays at our Cleveland and Beachwood clinics.",
    priceFrom: 85,
    category: "tests",
    keywords: ["x-ray", "xray", "scan", "broken bone", "fracture"],
    href: "/book?service=imaging",
  },
  {
    id: "vaccines",
    name: "Vaccines",
    summary: "Flu shots, childhood vaccines, and travel vaccines.",
    priceFrom: 35,
    category: "everyday",
    keywords: ["flu shot", "shot", "immunization", "travel"],
    href: "/book?service=vaccines",
  },
  {
    id: "physical-therapy",
    name: "Physical therapy",
    summary: "Recover from injury and surgery with a personal plan.",
    priceFrom: 120,
    category: "wellness",
    keywords: ["rehab", "knee pain", "back pain", "sports injury", "surgery recovery"],
    href: "/book?service=physical-therapy",
  },
  {
    id: "mental-health",
    name: "Mental health",
    summary: "Support for stress, anxiety, and depression, in person or by video.",
    priceFrom: 140,
    category: "wellness",
    keywords: ["stress", "anxiety", "depression", "therapy", "counseling", "sleep"],
    href: "/book?service=mental-health",
  },
  {
    id: "nutrition",
    name: "Nutrition counseling",
    summary: "Practical eating plans for weight, diabetes, and heart health.",
    priceFrom: 90,
    category: "wellness",
    keywords: ["diet", "weight", "diabetes", "food"],
    href: "/book?service=nutrition",
  },
  {
    id: "video",
    name: "Video visits",
    summary: "See a doctor from home, 7 days a week.",
    priceFrom: 65,
    category: "everyday",
    keywords: ["online", "telehealth", "from home", "rash", "cold"],
    href: "/book?service=video",
  },
]

export const servicesCopy = {
  label: "Services",
  heading: "Care for every part of your life",
  intro:
    "From everyday checkups to specialist care, our doctors work together so your whole family gets the right care in one place.",
  searchLabel: "Search services",
  searchPlaceholder: "Search a condition or service, like “rash”, “knee pain” or “flu shot”…",
  allFilter: "All",
  specialtiesTitle: "Specialties",
  specialtiesIntro: "Six teams of board-certified doctors, all under one roof and one patient record.",
  moreTitle: "More services",
  moreIntro: "Tests, therapy and everyday extras, with clear self-pay prices.",
  collageNote: "Same-week visits across all six specialties",
  results: (n: number) => `${n} ${n === 1 ? "result" : "results"}`,
  empty: "Nothing matches that search yet.",
  emptyHint: `Try another word, or call us at ${site.phone.display} and we’ll point you in the right direction.`,
  clear: "Clear search",
  doctors: (n: number) => `${n} doctors`,
  nextAvailable: (when: string) => `Next available ${when === "Today" || when === "Tomorrow" ? when.toLowerCase() : when}`,
  learnMore: "Find a doctor",
  learnMoreHref: (specialtyId: string) => `/find-a-doctor?specialty=${specialtyId}`,
  priceFrom: (n: number) => `From $${n}`,
  guide: {
    heading: "Not sure where to start?",
    intro: "Pick what sounds like you. We’ll take it from there.",
    picks: [
      { id: "sick", label: "I’m sick or need a checkup", to: "Family medicine", href: "/find-a-doctor?specialty=family-medicine" },
      { id: "child", label: "It’s for my child", to: "Pediatrics", href: "/find-a-doctor?specialty=pediatrics" },
      { id: "remote", label: "I can’t come in", to: "Video visit", href: "/book?service=video" },
    ],
    note: "Start with family medicine, and your doctor will refer you to a specialist if you need one.",
  },
}


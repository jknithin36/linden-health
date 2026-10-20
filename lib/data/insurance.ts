// Fictional insurance data for a fictional clinic. Every insurer and program name here is
// invented: never swap in real company or government program names, and never show logos.

import { site, type Location } from "@/lib/data/site"

/* ----------------------------------------------------------------------------
 * Plans
 * ------------------------------------------------------------------------- */

/** Plan types the coverage checker asks for. */
export const planTypes = ["PPO", "HMO", "EPO", "POS", "Senior", "Community", "Marketplace"] as const
export type PlanType = (typeof planTypes)[number]
/** Network plan types: shown after the insurer's name ("Northbridge Health PPO"); the rest are categories. */
export const networkPlanTypes: readonly PlanType[] = ["PPO", "HMO", "EPO", "POS"]

export type PlanCategory = "commercial" | "regional" | "senior" | "community" | "marketplace" | "service"

export const planCategories: { id: PlanCategory; label: string; title: string }[] = [
  { id: "commercial", label: "Commercial", title: "Commercial plans" },
  { id: "regional", label: "Regional", title: "Regional plans" },
  { id: "senior", label: "Senior", title: "Senior plans" },
  { id: "community", label: "Community", title: "Community plans" },
  { id: "marketplace", label: "Marketplace", title: "Marketplace plans" },
  { id: "service", label: "Service and other", title: "Service and other plans" },
]

export type InsurancePlan = {
  number: number
  name: string
  category: PlanCategory
  /** Plan types as shown in the list, e.g. "PPO", "Bronze", "Managed care". */
  types: string[]
  /** Clinics where the plan is in network. */
  locations: "all" | Location[]
}

const plan = (
  number: number,
  name: string,
  category: PlanCategory,
  types: string[],
  locations: InsurancePlan["locations"] = "all"
): InsurancePlan => ({ number, name, category, types, locations })

export const insurancePlans: InsurancePlan[] = [
  // Commercial
  plan(1, "Northbridge Health", "commercial", ["PPO", "HMO", "EPO"]),
  plan(2, "Summit Mutual", "commercial", ["PPO", "POS"]),
  plan(3, "Lakeshore Care", "commercial", ["HMO", "PPO"], ["Cleveland", "Lakewood"]),
  plan(4, "Keystone Health Partners", "commercial", ["PPO", "EPO"]),
  plan(5, "BrightPath Insurance", "commercial", ["PPO", "HMO"]),
  plan(6, "Harbor Point Health", "commercial", ["PPO"]),
  plan(7, "Cedarline Health Plan", "commercial", ["HMO", "POS"]),
  plan(8, "Unity Shield", "commercial", ["PPO", "EPO"]),
  plan(9, "Meridian Crest", "commercial", ["PPO"]),
  plan(10, "Ironwood Health", "commercial", ["HMO"], ["Cleveland", "Beachwood"]),
  plan(11, "Clearwater Benefits", "commercial", ["PPO", "HMO"]),
  plan(12, "Ashford Health", "commercial", ["PPO"]),
  // Regional
  plan(13, "Buckeye Valley Health", "regional", ["PPO", "HMO"]),
  plan(14, "Great Lakes Health Plan", "regional", ["HMO", "POS"]),
  plan(15, "Erie Shore Medical Plan", "regional", ["PPO"]),
  plan(16, "Cuyahoga Community Health", "regional", ["HMO"], ["Cleveland", "Lakewood"]),
  plan(17, "Western Reserve Care", "regional", ["PPO", "HMO"]),
  plan(18, "Riverbend Health", "regional", ["PPO"], ["Lakewood", "Beachwood"]),
  plan(19, "Heartland Mutual", "regional", ["PPO", "EPO"]),
  plan(20, "Northcoast Health Alliance", "regional", ["HMO"]),
  // Senior
  plan(21, "Evergreen Senior Health", "senior", ["Standard", "Plus"]),
  plan(22, "Northbridge Senior Advantage", "senior", ["HMO", "PPO"]),
  plan(23, "Summit Senior Choice", "senior", ["PPO"]),
  plan(24, "Silver Oak Health", "senior", ["HMO"]),
  plan(25, "Golden Years Health Plan", "senior", ["Supplement"]),
  plan(26, "Lakeshore Senior Plus", "senior", ["HMO"], ["Cleveland", "Lakewood"]),
  // Community
  plan(27, "Statewide Community Health", "community", ["Standard"]),
  plan(28, "CareBridge Community Plan", "community", ["Managed care"]),
  plan(29, "Hopewell Health Plan", "community", ["Managed care"]),
  plan(30, "Family First Health", "community", ["Managed care", "Kids plan"]),
  plan(31, "Buckeye Valley Community", "community", ["Managed care"], ["Cleveland", "Beachwood"]),
  // Marketplace
  plan(32, "Clearpath Marketplace", "marketplace", ["Bronze", "Silver", "Gold"]),
  plan(33, "Oakleaf Health", "marketplace", ["Silver", "Gold"]),
  plan(34, "Brightwater Individual", "marketplace", ["Bronze", "Silver"]),
  plan(35, "Keystone Select", "marketplace", ["Silver", "Gold", "Platinum"]),
  // Service and other
  plan(36, "Liberty Service Health", "service", ["Prime", "Select"]),
  plan(37, "Veterans Care Network", "service", ["Referral program"]),
  plan(38, "Harborline Employer Health", "service", ["Employer plans"]),
  plan(39, "Pinnacle Student Health", "service", ["Student plans"], ["Cleveland"]),
  plan(40, "Workright Comp", "service", ["Workers’ compensation"]),
]

const OTHER_PLAN = "Other / not listed"

/** Names offered in the checker's search list. */
export const checkerPlanNames = [...insurancePlans.map((p) => p.name), OTHER_PLAN]

/** Typical copays by category (fictional). */
const copays: Record<PlanCategory, { primary: number; specialist: number }> = {
  commercial: { primary: 25, specialist: 50 },
  regional: { primary: 20, specialist: 45 },
  senior: { primary: 0, specialist: 20 },
  community: { primary: 0, specialist: 0 },
  marketplace: { primary: 35, specialist: 70 },
  service: { primary: 0, specialist: 30 },
}

export const planByName = (name: string) => insurancePlans.find((p) => p.name === name)
const planCopay = (p: InsurancePlan) => copays[p.category]

/* ----------------------------------------------------------------------------
 * Coverage check (shared by the homepage and /insurance)
 * ------------------------------------------------------------------------- */

export type CoverageStatus = "covered" | "partial" | "not-covered"
export type CoverageResult = { status: CoverageStatus; name: string; type: PlanType; plan?: InsurancePlan }

function typeMatches(p: InsurancePlan, type: PlanType) {
  switch (p.category) {
    case "senior":
      return type === "Senior"
    case "community":
      return type === "Community"
    case "marketplace":
      return type === "Marketplace"
    case "service":
      // Service plans aren't sold by plan type; any choice counts.
      return true
    default:
      return p.types.includes(type)
  }
}

export function checkCoverage(name: string, type: PlanType): CoverageResult {
  const p = planByName(name)
  if (!p || !typeMatches(p, type)) return { status: "not-covered", name, type }
  return { status: p.locations === "all" ? "covered" : "partial", name, type, plan: p }
}

const listJoin = (items: readonly string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`

/** "Northbridge Health PPO", but just "Evergreen Senior Health" for category-style types. */
const planLabel = (r: CoverageResult) =>
  networkPlanTypes.includes(r.type) ? `${r.name} ${r.type}` : r.name

export const coverageMessages = {
  covered: (r: CoverageResult) => {
    const c = r.plan ? planCopay(r.plan) : copays.commercial
    return {
      title: "You’re covered.",
      body: `${planLabel(r)} is accepted at all ${site.locations.length} ${site.name} locations. Typical copay: $${c.primary} primary care, $${c.specialist} specialist.`,
    }
  },
  partial: (r: CoverageResult) => {
    const where = r.plan && r.plan.locations !== "all" ? listJoin(r.plan.locations) : ""
    return {
      title: "Covered at some locations.",
      body: `${planLabel(r)} is accepted at ${where}.${r.type === "HMO" ? " A referral may be needed for specialists." : ""}`,
    }
  },
  notCovered: {
    title: "Not in our network yet.",
    body: "You can still visit us with self-pay prices from $65.",
  },
}

/* ----------------------------------------------------------------------------
 * Copy
 * ------------------------------------------------------------------------- */

export const insuranceLabel = "Insurance"
export const insuranceHeading = "We work with your insurance"
export const insuranceIntro = `${site.name} accepts 40+ plans across ${site.region}, so you can focus on your care, not the paperwork.`

export const insuranceTrust = ["40+ plans accepted", "We file claims for you", "HSA and FSA cards welcome"]

export const allPlansLink = { label: `See all ${insurancePlans.length} plans`, href: "/insurance#plans" }

export type HelpCard = {
  id: "self-pay" | "paperwork" | "hsa"
  title: string
  body: string
}

export const helpCards: HelpCard[] = [
  { id: "self-pay", title: "No insurance? No problem.", body: "Clear self-pay prices, with no surprises." },
  { id: "paperwork", title: "We handle the paperwork.", body: "We check coverage and file claims for you." },
  { id: "hsa", title: "HSA and FSA cards accepted.", body: "Use them for visits, labs, and copays." },
]

export type VisitType = "sick" | "physical" | "specialist" | "video" | "lab"

/** Self-pay prices; the first five double as the cost estimator's visit types. */
export const selfPayPrices: { id: VisitType | "xray" | "flu"; visit: string; price: number }[] = [
  { id: "video", visit: "Video visit", price: 65 },
  { id: "sick", visit: "Sick visit", price: 95 },
  { id: "physical", visit: "Annual physical", price: 180 },
  { id: "specialist", visit: "Specialist visit", price: 175 },
  { id: "lab", visit: "Basic lab panel", price: 45 },
  { id: "xray", visit: "X-ray (one area)", price: 85 },
  { id: "flu", visit: "Flu shot", price: 35 },
]

export const formatPrice = (n: number) => `$${n}`

/** Cost estimator: typical cost with a plan vs. self-pay. Estimates only. */
export const estimateVisits: { id: VisitType; label: string }[] = [
  { id: "sick", label: "Sick visit" },
  { id: "physical", label: "Annual physical" },
  { id: "specialist", label: "Specialist visit" },
  { id: "video", label: "Video visit" },
  { id: "lab", label: "Lab panel" },
]

export function estimateCost(visit: VisitType, p: InsurancePlan) {
  const c = planCopay(p)
  const withPlan = { sick: c.primary, video: c.primary, specialist: c.specialist, physical: 0, lab: 10 }[visit]
  const selfPay = selfPayPrices.find((s) => s.id === visit)?.price ?? 0
  return { withPlan, selfPay }
}

export const billingContact = {
  heading: "Questions about coverage?",
  body: `Our billing team is here ${site.billingHours}.`,
  phone: site.billingPhone,
  message: { label: "Message billing", href: "/portal/messages" },
  call: (phone: string) => `Call ${phone}`,
}

export const coverageSteps = [
  { title: "Before your visit", body: "We check your coverage and tell you about any expected cost." },
  { title: "At your visit", body: "You pay your copay, if you have one. That’s it." },
  { title: "After your visit", body: "We send the claim to your insurance. No forms for you to fill in." },
  { title: "Your bill", body: "You’ll see exactly what insurance paid and what you owe, in your portal." },
]

export const insuranceFaqs = [
  {
    question: "What’s the difference between in-network and out-of-network?",
    answer: "In-network plans have an agreement with us, so you usually pay less.",
  },
  { question: "Do I need a referral?", answer: "Some HMO plans need one for specialists. The coverage checker will tell you." },
  { question: "What if my insurance changes?", answer: "Update it in your portal before your next visit." },
  { question: "Do you accept secondary insurance?", answer: "Yes. We bill both plans for you." },
  { question: "What if my claim is denied?", answer: "Our billing team will review it and help you appeal." },
]

export const insuranceCopy = {
  checkerTitle: "Check your coverage",
  checkerIntro: (count: number, name: string) =>
    `Check any of our ${count} plans in seconds. We’ll tell you which ${name} locations take it.`,
  companyLabel: "Insurance company",
  companyPlaceholder: `Search ${insurancePlans.length} plans…`,
  companyEmpty: `No matching plans. Try “${OTHER_PLAN}”.`,
  planLabel: "Plan type",
  memberIdLabel: "Member ID (optional)",
  memberIdHint: "Found on the front of your insurance card",
  checkButton: "Check my coverage",
  errors: {
    both: "Choose your insurance company and plan type.",
    company: "Choose your insurance company.",
    plan: "Choose your plan type.",
  },
  findInNetwork: "Find a doctor in your network",
  findInNetworkHref: (name: string, type: string) =>
    `/find-a-doctor?insurance=${encodeURIComponent(name)}&plan=${encodeURIComponent(type)}`,
  seeLocations: "See covered locations",
  seeSelfPay: "See self-pay prices",
  talkToBilling: "Talk to billing",
  plansTitle: `All ${insurancePlans.length} accepted plans`,
  plansSearch: `Search ${insurancePlans.length} plans`,
  plansSearchPlaceholder: `Search ${insurancePlans.length} plans…`,
  plansShown: (n: number) => `${n} ${n === 1 ? "plan" : "plans"} shown`,
  plansAll: "All",
  plansEmpty: "No plans match your search.",
  plansColumns: { number: "#", insurer: "Insurer", types: "Plan types", coverage: "Coverage" },
  allLocations: "All locations",
  notListed: (phone: string) => `Don’t see your plan? Plans change often, so call us at ${phone} and we’ll check for you.`,
  stepsTitle: "How your coverage works",
  estimateTitle: "Estimate your cost",
  estimateVisitLabel: "Visit type",
  estimatePlanLabel: "Insurance",
  estimateWithPlan: "Typical cost with your plan",
  estimateWithout: "Without insurance",
  copay: "copay",
  estimateNote: "Estimates only. Your final cost depends on your plan’s deductible and coverage.",
  pricesTitle: "Self-pay prices",
  /** Screen-reader heading for the estimator + price list section. */
  costsHeading: "Estimate your cost and self-pay prices",
  pricesIntro: "No insurance, or out of network? You’ll always know the price before your visit.",
  pricesCaption: "Self-pay prices by visit type",
  paymentPlans: "Payment plans are available for bills over $200. Ask our billing team.",
  faqTitle: "Insurance FAQs",
  disclaimer: `${site.name} and all insurance plans shown are fictional, for demonstration only.`,
  /** Fanned insurance-card visual next to the checker. */
  card: {
    label: "Insurance card preview",
    member: "Member",
    memberName: "Your name",
    memberId: "ID •••• 2418",
    covered: "In network",
    partial: "Some locations",
    notCovered: "Not in network",
    choosePlan: "Your plan",
  },
  networkLine: `${insurancePlans.length} plans accepted across ${site.region}.`,
}

/** Homepage "self-pay" summary, shown as a centred striped table. */
export const selfPaySummary = {
  eyebrow: "No insurance? No problem.",
  heading: ["Clear prices,", "with no surprises"],
  intro: "No insurance, or out of network? You’ll always know the price before your visit.",
  /** First five self-pay prices, then two reassurances (detail only, no price). */
  rows: [
    ...selfPayPrices.slice(0, 5).map((p) => ({ label: p.visit, detail: formatPrice(p.price), price: true })),
    { label: "We handle the paperwork", detail: "We check coverage and file claims for you", price: false },
    { label: "HSA and FSA cards accepted", detail: "Use them for visits, labs, and copays", price: false },
  ],
  cta: { label: "See all prices", href: "/insurance#self-pay-prices" },
  contact: (phone: string, hours: string) => `Questions about coverage? Call ${phone}, ${hours}.`,
}

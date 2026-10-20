// Log in / sign up copy and demo accounts. This is a frontend demo: nothing is sent to a server,
// and the demo passwords are public on purpose.

import { site } from "@/lib/data/site"

export type DemoAccount = { id: "patient" | "admin" | "doctor"; label: string; aria: string; name: string; greeting: string; email: string; password: string }

export const demoAccounts: DemoAccount[] = [
  { id: "admin", label: "Admin portal", aria: "Log in as admin (Taylor Brooks)", name: "Taylor Brooks", greeting: "Taylor", email: "frontdesk@lindenhealth.example", password: "Linden2026!" },
  { id: "doctor", label: "Doctor portal", aria: "Log in as doctor (Dr. Emily Chen)", name: "Dr. Emily Chen", greeting: "Dr. Chen", email: "emily.chen@lindenhealth.example", password: "Linden2026!" },
  { id: "patient", label: "User portal", aria: "Log in as patient (Sarah Mitchell)", name: "Sarah Mitchell", greeting: "Sarah", email: "sarah@lindenhealth.example", password: "Linden2026!" },
]

/** Wrong passwords allowed before the form locks. */
export const MAX_ATTEMPTS = 5
export const LOCK_MINUTES = 10

export const authShell = {
  homeLabel: `${site.name} home`,
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy policy", href: "/privacy" },
  ],
  copyright: `© 2026 ${site.name}`,
  google: { label: "Google", aria: "Continue with Google" },
  apple: { label: "Apple", aria: "Continue with Apple" },
  divider: "or",
}

export const loginCopy = {
  heading: "Welcome back",
  intro: "Log in to see your visits, results, and messages.",
  email: { label: "Email", placeholder: "you@example.com" },
  password: { label: "Password", placeholder: "Your password" },
  show: "Show password",
  hide: "Hide password",
  remember: "Remember me",
  forgot: "Forgot password?",
  submit: "Log in",
  newHere: `New to ${site.name}?`,
  createAccount: { label: "Create an account", href: "/signup" },
  demoTitle: "Demo access",
  errors: {
    email: "Enter a valid email address",
    password: "Enter your password",
    mismatch: "That email and password don’t match. Try again or reset your password.",
    locked: `Too many attempts. Please wait ${LOCK_MINUTES} minutes or reset your password.`,
  },
  lockedLeft: (minutes: number) => `About ${minutes} min left.`,
  attemptsLeft: (n: number) => `${n} ${n === 1 ? "try" : "tries"} left before the account is locked for ${LOCK_MINUTES} minutes.`,
  resetSent: (email: string) => `If ${email} has an account, we’ve sent a reset link. (Demo: nothing was sent.)`,
}

export const signupCopy = {
  heading: "Create your account",
  intro: "Manage care for you and your family, all in one place.",
  fields: {
    firstName: { label: "First name", placeholder: "Sarah", autoComplete: "given-name" },
    lastName: { label: "Last name", placeholder: "Mitchell", autoComplete: "family-name" },
    email: { label: "Email", placeholder: "you@example.com", autoComplete: "email" },
    phone: { label: "Phone", placeholder: "(216) 555-0123", autoComplete: "tel" },
    dob: { label: "Date of birth", placeholder: "Select a date", autoComplete: "bday" },
    password: { label: "Password", placeholder: "Create a password", autoComplete: "new-password" },
  },
  hints: [
    { id: "length", label: "At least 8 characters" },
    { id: "number", label: "One number" },
    { id: "symbol", label: "One symbol" },
  ],
  hintState: (met: boolean) => (met ? "(met)" : "(not met yet)"),
  agree: { before: "I agree to the ", terms: { label: "Terms", href: "/terms" }, and: " and ", privacy: { label: "Privacy policy", href: "/privacy" } },
  reminders: "Send me appointment reminders by text",
  submit: "Create account",
  haveAccount: "Already have an account?",
  login: { label: "Log in", href: "/login" },
  errors: {
    firstName: "Enter your first name",
    lastName: "Enter your last name",
    email: "Enter a valid email address",
    phone: "Enter a phone number we can reach you on",
    dob: "Enter your date of birth",
    password: "Use at least 8 characters, with a number and a symbol",
    agree: "Please agree to the Terms and Privacy policy",
  },
}

export const setupCopy = {
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  skip: "Skip for now",
  next: "Continue",
  back: "Back",
  insurance: {
    title: "Add your insurance",
    intro: "We’ll check your coverage before every visit.",
    insurer: "Insurance company",
    insurerPlaceholder: "Search 40 plans…",
    insurerEmpty: "No matching plans.",
    memberId: "Member ID",
    memberIdHint: "Found on the front of your insurance card",
    cardFront: "Front of card",
    cardBack: "Back of card",
    upload: "Upload photo",
  },
  family: {
    title: "Add family members",
    intro: "Book and manage visits for the people you care for.",
    name: "Full name",
    dob: "Date of birth",
    dobPlaceholder: "Select a date",
    relationship: "Relationship",
    relationships: ["Child", "Partner", "Parent", "Other"],
    add: "Add a family member",
    remove: (name: string) => `Remove ${name || "family member"}`,
  },
  done: {
    title: (first: string) => `You’re all set, ${first}.`,
    body: "Your account is ready. Book your first visit whenever you’re ready.",
    summaryInsurance: (plan: string | null) => (plan ? `Insurance: ${plan}` : "Insurance: not added yet"),
    summaryFamily: (n: number) => (n ? `Family members: ${n}` : "Family members: none yet"),
    book: { label: "Book your first visit", href: "/book" },
    dashboard: { label: "Go to my dashboard", href: "/portal" },
    demo: "Demo only: no account was created.",
  },
}

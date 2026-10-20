// FAQ for a fictional clinic. Numbers and claims match the rest of the site (lib/data/site.ts).

import { site } from "@/lib/data/site"

export type FaqItem = { question: string; answer: string }
export type FaqCategory = { id: string; title: string; items: FaqItem[] }

export const faqCopy = {
  heading: "FAQs",
  /** Page description for search engines; not shown on the page. */
  description: `Answers about visits, insurance, billing, results and the patient portal at ${site.name}.`,
  categoriesLabel: "FAQ topics",
  contactTitle: "Still have questions?",
  contactBody: `Our team is here ${site.billingHours}.`,
  call: (phone: string) => `Call ${phone}`,
  message: { label: "Send us a message", href: "/portal/messages" },
}

export const faqCategories: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        question: "Do I need a referral to see a doctor?",
        answer:
          "No. You can book with our family medicine doctors, pediatricians, and most specialists without a referral. Some insurance plans, like certain HMOs, may require one, and we’ll let you know when you book.",
      },
      {
        question: "How do I become a new patient?",
        answer:
          "Book your first visit online, in the app, or by phone. Before your visit, you’ll fill in a short form about your health history.",
      },
      {
        question: `Can my whole family see ${site.name} doctors?`,
        answer:
          "Yes. We care for every age, from newborns to grandparents, and you can manage everyone’s visits from one account.",
      },
      {
        question: "Can I choose my own doctor?",
        answer:
          "Yes. Browse doctors by specialty, location, language, and availability. When possible, you’ll see the same doctor at every visit.",
      },
      {
        question: "What should I bring to my first visit?",
        answer:
          "Your photo ID, insurance card, a list of current medications, and any recent test results from other doctors.",
      },
    ],
  },
  {
    id: "appointments",
    title: "Appointments",
    items: [
      {
        question: "How soon can I get an appointment?",
        answer:
          "Most patients are seen the same week. Same-day visits are often available for sick visits and video visits.",
      },
      {
        question: "How long is a visit?",
        answer:
          "Most visits last about 30 minutes, so you have time to talk through everything without feeling rushed.",
      },
      {
        question: "Do you offer video visits?",
        answer:
          "Yes. Video visits are available 7 days a week, 7 AM to 10 PM, for colds, rashes, follow-ups, and prescription questions.",
      },
      {
        question: "How do I cancel or reschedule?",
        answer:
          "Change your visit anytime in the patient portal or app. Please let us know at least 24 hours ahead so we can offer the time to someone else.",
      },
      {
        question: "Can I walk in without an appointment?",
        answer:
          "Walk-ins are welcome for sick visits when time is available, but booking ahead is the best way to avoid a wait.",
      },
    ],
  },
  {
    id: "insurance-billing",
    title: "Insurance and billing",
    items: [
      {
        question: "Do you accept my insurance?",
        answer:
          "We accept 40+ plans, including most PPO, HMO, senior, community and marketplace plans. Use the coverage checker on our Insurance page, or call our billing team.",
      },
      {
        question: "What if I don’t have insurance?",
        answer:
          "You can pay as you go with clear self-pay prices: video visits from $65 and in-person visits from $95.",
      },
      {
        question: "Can I use my HSA or FSA card?",
        answer: "Yes. You can use it for visits, lab tests, and copays.",
      },
      {
        question: "How do I pay my bill?",
        answer: `Pay online in the patient portal or app, or call our billing team at ${site.billingPhone.display}.`,
      },
      {
        question: "Why did I get a bill after my visit?",
        answer:
          "Your insurance may not cover the full cost, for example because of a deductible or copay. Your bill shows exactly what insurance paid and what you owe.",
      },
    ],
  },
  {
    id: "results-prescriptions",
    title: "Results and prescriptions",
    items: [
      {
        question: "How do I see my test results?",
        answer:
          "Results appear in your patient portal, usually within 1–3 days, with a short note from your doctor explaining what they mean.",
      },
      {
        question: "Can I get lab work without a doctor’s visit?",
        answer: "Yes, if your doctor has already ordered the tests. Book a lab-only visit at any of our clinics.",
      },
      {
        question: "How do I refill a prescription?",
        answer: "Request a refill in the portal or app. Most refills are approved within one business day.",
      },
      {
        question: "Can I message my doctor?",
        answer: "Yes. Send a secure message anytime, and your care team will reply within one business day.",
      },
      {
        question: "What if my results need follow-up?",
        answer:
          "Your doctor will message you with next steps, and if needed, we’ll help you book a follow-up visit right away.",
      },
    ],
  },
  {
    id: "portal-privacy",
    title: "Patient portal and privacy",
    items: [
      {
        question: "How do I create a portal account?",
        answer: "You’ll get an email invite after booking your first visit, or you can sign up anytime on our website.",
      },
      {
        question: "Can I manage my child’s account?",
        answer:
          "Yes. Parents and guardians can manage accounts for children under 18, including visits, results, and vaccine records.",
      },
      {
        question: "Can I manage care for an aging parent?",
        answer:
          "Yes. With your parent’s permission, you can be added as a caregiver to see their visits, messages, and results.",
      },
      {
        question: "Is my health information safe?",
        answer: "Yes. Your information is encrypted, stored securely, and only shared with your care team.",
      },
      {
        question: "Can I download or share my medical records?",
        answer: "Yes. Download your records anytime from the portal, or request that we send them to another doctor.",
      },
    ],
  },
]

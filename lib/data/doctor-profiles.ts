// Profile content for /doctors/[slug]. Fictional doctors, schools, hospitals, societies and patients.
// Bios are written by name rather than pronoun, except Dr. Chen's, which is the brief's own text.

import type { Doctor } from "@/lib/data/doctors"
import { locationName } from "@/lib/data/site"

export type Review = { rating: 4 | 5; text: string; name: string; location: string; date: string }

export type DoctorProfile = {
  /** "About" paragraph. */
  bio: string
  patients: string
  focus: string[]
  residency: string
  training: string
  membership: string
  recertified: number
  videoVisits: boolean
}

type SpecialtyProfile = {
  ages: string
  visitLength: string
  highlights: string[]
  /** `{name}` is replaced with the doctor's surname. */
  reviews: Review[]
  videoNote: string
}

/* ----------------------------------------------------------------------------
 * Shared by specialty
 * ------------------------------------------------------------------------- */

export const specialtyProfiles: Record<string, SpecialtyProfile> = {
  "family-medicine": {
    ages: "Sees all ages",
    visitLength: "30 minutes",
    highlights: ["Great listener", "Explains clearly", "On time", "Thorough", "Kind with kids"],
    videoNote: "on Fridays and for many follow-up visits",
    reviews: [
      { rating: 5, text: "Dr. {name} ordered one more test and found a thyroid issue I’d lived with for years.", name: "Maria", location: "Cleveland", date: "Sep 2026" },
      { rating: 5, text: "Never rushes. I left with a clear plan and a follow-up already booked.", name: "David", location: "Lakewood", date: "Aug 2026" },
      { rating: 5, text: "My kids actually like going to the doctor now.", name: "Hannah", location: "Cleveland", date: "Aug 2026" },
      { rating: 4, text: "Great doctor. The wait was a little long that day, but worth it.", name: "Sam", location: "Beachwood", date: "Jul 2026" },
    ],
  },
  pediatrics: {
    ages: "Newborns to age 18",
    visitLength: "20 minutes",
    highlights: ["Great with kids", "Patient with parents", "Explains clearly", "On time", "Gentle"],
    videoNote: "for fevers, rashes and follow-ups",
    reviews: [
      { rating: 5, text: "Dr. {name} got my anxious toddler laughing before the checkup even started.", name: "Priya", location: "Beachwood", date: "Sep 2026" },
      { rating: 5, text: "Answered every new-parent question without making us feel silly.", name: "Jordan", location: "Cleveland", date: "Sep 2026" },
      { rating: 5, text: "Vaccines done in minutes, with a sticker and zero tears.", name: "Elena", location: "Lakewood", date: "Aug 2026" },
      { rating: 4, text: "Wonderful doctor. Parking was tricky, but the visit itself was perfect.", name: "Chris", location: "Beachwood", date: "Jul 2026" },
    ],
  },
  "womens-health": {
    ages: "Teens and adults",
    visitLength: "30 minutes",
    highlights: ["Listens closely", "Never rushed", "Explains options", "Respectful", "Thorough"],
    videoNote: "for birth control, results and follow-ups",
    reviews: [
      { rating: 5, text: "Dr. {name} walked me through every option and let me decide what felt right.", name: "Aisha", location: "Lakewood", date: "Sep 2026" },
      { rating: 5, text: "The calmest prenatal visits I could have asked for.", name: "Rachel", location: "Cleveland", date: "Aug 2026" },
      { rating: 5, text: "Finally a doctor who took my menopause symptoms seriously.", name: "Linda", location: "Beachwood", date: "Aug 2026" },
      { rating: 4, text: "Excellent care. Booking took a couple of tries, but it was worth it.", name: "Tess", location: "Lakewood", date: "Jul 2026" },
    ],
  },
  dermatology: {
    ages: "All ages",
    visitLength: "20 minutes",
    highlights: ["Thorough skin checks", "Clear routines", "On time", "Explains clearly", "Friendly"],
    videoNote: "for acne and rash follow-ups",
    reviews: [
      { rating: 5, text: "Dr. {name} spotted a mole I’d ignored for years. So glad I went.", name: "Mark", location: "Beachwood", date: "Sep 2026" },
      { rating: 5, text: "My eczema is under control for the first time since college.", name: "Nina", location: "Cleveland", date: "Aug 2026" },
      { rating: 5, text: "A simple routine that actually worked. No upsell, no fuss.", name: "Leah", location: "Lakewood", date: "Aug 2026" },
      { rating: 4, text: "Very helpful. I’d have liked a little more time, but the advice was spot on.", name: "Omar", location: "Beachwood", date: "Jul 2026" },
    ],
  },
  cardiology: {
    ages: "Adults",
    visitLength: "40 minutes",
    highlights: ["Explains results", "Practical advice", "Thorough", "Calm", "On time"],
    videoNote: "for results reviews and follow-ups",
    reviews: [
      { rating: 5, text: "Dr. {name} explained my ECG line by line. I finally understand my heart.", name: "James", location: "Lakewood", date: "Sep 2026" },
      { rating: 5, text: "My cholesterol is down and I didn’t have to give up everything I love.", name: "Patricia", location: "Cleveland", date: "Aug 2026" },
      { rating: 5, text: "Calm, kind and incredibly thorough after my scare last spring.", name: "Victor", location: "Beachwood", date: "Aug 2026" },
      { rating: 4, text: "Great doctor. The tests took a while, but everything was explained clearly.", name: "Ruth", location: "Lakewood", date: "Jul 2026" },
    ],
  },
  orthopedics: {
    ages: "Ages 12 and up",
    visitLength: "30 minutes",
    highlights: ["Clear recovery plans", "Sports-savvy", "Encouraging", "Explains clearly", "On time"],
    videoNote: "for recovery check-ins",
    reviews: [
      { rating: 5, text: "Dr. {name} had me back on the trail weeks earlier than I expected.", name: "Tom", location: "Beachwood", date: "Sep 2026" },
      { rating: 5, text: "Explained my knee scan in plain English and skipped surgery I didn’t need.", name: "Grace", location: "Lakewood", date: "Aug 2026" },
      { rating: 5, text: "My son’s sprain healed fast with a plan he actually stuck to.", name: "Andre", location: "Cleveland", date: "Aug 2026" },
      { rating: 4, text: "Very good care. The X-ray wait was long, but the doctor was excellent.", name: "Maya", location: "Lakewood", date: "Jul 2026" },
    ],
  },
}

/* ----------------------------------------------------------------------------
 * Per doctor
 * ------------------------------------------------------------------------- */

export const doctorProfiles: Record<string, DoctorProfile> = {
  "dr-chen": {
    bio: "Dr. Chen has cared for Cleveland families for over a decade. She’s known for catching what others miss and explaining it in plain language. She takes a whole-person approach, looking at sleep, stress, and daily habits along with symptoms. Outside the clinic, she enjoys hiking, cooking with her two kids, and running half marathons.",
    patients: "2,400+",
    focus: ["Preventive care and annual physicals", "Thyroid conditions", "High blood pressure and cholesterol", "Diabetes care", "Women’s health basics", "Family care for all ages", "Stress, sleep, and fatigue"],
    residency: "Family medicine, Westbrook University Hospital",
    training: "Thyroid and metabolic health",
    membership: "National Academy of Family Doctors",
    recertified: 2023,
    videoVisits: true,
  },
  "dr-nair": {
    bio: "Dr. Nair has cared for some Lakewood families across three generations. Visits start with a real conversation, and plans are built around what patients can actually do day to day. Dr. Nair is a go-to for complex, long-term conditions and loves teaching new doctors. Weekends are for gardening and classical dance.",
    patients: "4,100+",
    focus: ["Long-term condition care", "Diabetes care", "High blood pressure", "Preventive care and screenings", "Healthy aging", "Medication reviews"],
    residency: "Family medicine, Westbrook University Hospital",
    training: "Geriatric primary care",
    membership: "National Academy of Family Doctors",
    recertified: 2021,
    videoVisits: true,
  },
  "dr-donovan": {
    bio: "Dr. Donovan believes the best medicine is the problem you never have. Visits focus on prevention: screenings, vaccines and small changes that add up. Patients often mention how easy Dr. Donovan is to talk to. Off the clock, you’ll find Dr. Donovan coaching youth soccer.",
    patients: "1,300+",
    focus: ["Preventive care and screenings", "Vaccines for all ages", "Colds, flu and infections", "Weight and nutrition", "Sports physicals"],
    residency: "Family medicine, Marlow Regional Medical Center",
    training: "Preventive medicine",
    membership: "National Academy of Family Doctors",
    recertified: 2024,
    videoVisits: true,
  },
  "dr-khalil": {
    bio: "Dr. Khalil explains things the way they’d want them explained to their own family: clearly, honestly and without jargon. Patients come for everything from sore throats to managing several conditions at once. Fluent in English and Arabic, Dr. Khalil also leads the clinic’s new-patient program.",
    patients: "1,100+",
    focus: ["New-patient visits", "Colds, flu and infections", "Asthma and allergies", "High blood pressure", "Men’s health", "Mental health check-ins"],
    residency: "Family medicine, UCAZ Health Medical Center",
    training: "Behavioral health in primary care",
    membership: "National Academy of Family Doctors",
    recertified: 2024,
    videoVisits: true,
  },
  "dr-ramirez": {
    bio: "Dr. Ramirez is a favourite with kids and parents alike. Visits are calm and unhurried, and every family leaves knowing exactly what to watch for at home. Dr. Ramirez sees children in English and Spanish, and has a special interest in newborn care and early childhood development.",
    patients: "3,200+",
    focus: ["Newborn and well-baby care", "Well-child visits", "Vaccines", "Ear infections and fevers", "Early childhood development", "Asthma in children"],
    residency: "Pediatrics, Ridgeview Children’s Hospital",
    training: "Newborn and infant care",
    membership: "National Pediatric Care Society",
    recertified: 2023,
    videoVisits: true,
  },
  "dr-bennett": {
    bio: "Dr. Bennett takes time to learn what makes each child tick, from favourite cartoons to biggest worries. With fourteen years in pediatrics, Dr. Bennett has a calm, practical approach that parents trust. Outside the clinic, Dr. Bennett volunteers at local school health fairs.",
    patients: "3,600+",
    focus: ["Well-child visits", "School and sports physicals", "Allergies and eczema", "Sleep and feeding questions", "ADHD evaluations", "Vaccines"],
    residency: "Pediatrics, Ridgeview Children’s Hospital",
    training: "Developmental and behavioral pediatrics",
    membership: "National Pediatric Care Society",
    recertified: 2022,
    videoVisits: true,
  },
  "dr-johnson": {
    bio: "Dr. Johnson believes a good visit ends with a smile, from the kid and the parent. Known for making nervous children feel at ease, Dr. Johnson covers everything from first vaccines to teen health. Dr. Johnson also runs the clinic’s Saturday sick-visit hours.",
    patients: "2,500+",
    focus: ["Sick visits", "Teen health", "Vaccines", "Ear, nose and throat infections", "Sports injuries in kids", "Well-child visits"],
    residency: "Pediatrics, Halden University Hospital",
    training: "Adolescent medicine",
    membership: "National Pediatric Care Society",
    recertified: 2023,
    videoVisits: false,
  },
  "dr-okafor": {
    bio: "Dr. Okafor believes no question is too small. Patients come for annual exams, prenatal care and everything in between, and leave feeling informed and in control. Dr. Okafor sees patients in English and French and has a special interest in prenatal and postpartum care.",
    patients: "2,700+",
    focus: ["Annual exams", "Prenatal and postpartum care", "Birth control options", "Period problems", "Fertility questions", "Menopause care"],
    residency: "Obstetrics and gynecology, Halden University Hospital",
    training: "Prenatal and postpartum care",
    membership: "Society for Women’s Health Practice",
    recertified: 2023,
    videoVisits: true,
  },
  "dr-haddad": {
    bio: "Dr. Haddad wants every patient to feel informed and in control of their own health. Visits are thorough and unhurried, with options explained side by side. Dr. Haddad sees patients in English, Arabic and French and leads the clinic’s cervical screening program.",
    patients: "2,900+",
    focus: ["Annual exams and screenings", "Cervical screening", "Birth control options", "PCOS care", "Pregnancy planning", "Pelvic health"],
    residency: "Obstetrics and gynecology, Westbrook University Hospital",
    training: "Gynecologic screening",
    membership: "Society for Women’s Health Practice",
    recertified: 2022,
    videoVisits: true,
  },
  "dr-harper": {
    bio: "After twenty-four years in women’s health, Dr. Harper has seen it all, so nothing patients ask comes as a surprise. Dr. Harper is especially known for menopause care that’s practical and personal. Outside work, Dr. Harper sings in a community choir.",
    patients: "5,800+",
    focus: ["Menopause care", "Annual exams", "Bone health", "Hormone questions", "Bladder health", "Midlife wellness"],
    residency: "Obstetrics and gynecology, Marlow Regional Medical Center",
    training: "Menopause medicine",
    membership: "Society for Women’s Health Practice",
    recertified: 2021,
    videoVisits: true,
  },
  "dr-kim": {
    bio: "Dr. Kim believes healthy skin starts with a plan you can actually stick to. Visits end with a simple routine, not a shelf of products. Dr. Kim sees patients in English and Korean and has a special interest in acne and skin of color.",
    patients: "1,900+",
    focus: ["Acne care", "Skin checks", "Eczema and rashes", "Skin of color", "Hair loss", "Rosacea"],
    residency: "Dermatology, UCAZ Health Medical Center",
    training: "Acne and skin of color",
    membership: "Northern Dermatology Society",
    recertified: 2024,
    videoVisits: true,
  },
  "dr-park": {
    bio: "Dr. Park helps patients understand what their skin is telling them, and how to look after it for life. Patients mention how thorough Dr. Park’s full-body skin checks are. Dr. Park sees patients in English and Korean and loves weekend photography.",
    patients: "2,100+",
    focus: ["Full-body skin checks", "Mole checks", "Eczema", "Psoriasis", "Sun damage", "Nail problems"],
    residency: "Dermatology, Halden University Hospital",
    training: "Skin cancer screening",
    membership: "Northern Dermatology Society",
    recertified: 2023,
    videoVisits: true,
  },
  "dr-lindqvist": {
    bio: "Dr. Lindqvist believes regular skin checks save lives, and makes them quick, thorough and painless. Patients appreciate the straightforward advice and clear follow-up plans. Dr. Lindqvist sees patients in English and Swedish and spends free time cross-country skiing.",
    patients: "1,700+",
    focus: ["Skin cancer screening", "Mole checks", "Psoriasis", "Rosacea", "Skin infections", "Minor skin procedures"],
    residency: "Dermatology, Westbrook University Hospital",
    training: "Dermatologic surgery",
    membership: "Northern Dermatology Society",
    recertified: 2022,
    videoVisits: false,
  },
  "dr-patel": {
    bio: "Dr. Patel focuses on preventing heart disease before it starts. Visits turn test results into a clear plan built around everyday life: food, movement and sleep. Dr. Patel sees patients in English, Hindi and Gujarati and runs the clinic’s heart-health classes.",
    patients: "3,000+",
    focus: ["Heart checkups", "High cholesterol", "High blood pressure", "Heart disease prevention", "ECG and heart tests", "Palpitations"],
    residency: "Internal medicine, Westbrook University Hospital",
    training: "Preventive cardiology",
    membership: "Lakes Region Cardiology Society",
    recertified: 2023,
    videoVisits: true,
  },
  "dr-hale": {
    bio: "With twenty-eight years in cardiology, Dr. Hale brings deep experience and a famously calm manner. Dr. Hale cares for patients with complex heart conditions and takes time to explain every step. Outside the clinic, Dr. Hale restores old sailboats.",
    patients: "6,500+",
    focus: ["Complex heart conditions", "Heart failure care", "Heart rhythm problems", "ECG and heart tests", "After-heart-attack care", "Second opinions"],
    residency: "Internal medicine, Marlow Regional Medical Center",
    training: "Heart failure care",
    membership: "Lakes Region Cardiology Society",
    recertified: 2021,
    videoVisits: true,
  },
  "dr-tanaka": {
    bio: "Dr. Tanaka believes small, steady changes add up, and helps patients find the ones that fit their life. Patients come for blood pressure, cholesterol and heart checkups. Dr. Tanaka sees patients in English and Japanese and is a keen distance cyclist.",
    patients: "4,200+",
    focus: ["High blood pressure", "High cholesterol", "Heart checkups", "Exercise and the heart", "Heart rhythm problems", "Diabetes and heart health"],
    residency: "Internal medicine, UCAZ Health Medical Center",
    training: "Sports and exercise cardiology",
    membership: "Lakes Region Cardiology Society",
    recertified: 2022,
    videoVisits: true,
  },
  "dr-ellis": {
    bio: "Dr. Ellis always tells patients what their numbers mean and what can be done about them. With twenty-six years of experience, Dr. Ellis has a special interest in heart health for women. Patients describe visits as calm, clear and reassuring.",
    patients: "5,900+",
    focus: ["Heart health for women", "Heart checkups", "High blood pressure", "Chest pain evaluation", "ECG and heart tests", "Heart disease prevention"],
    residency: "Internal medicine, Halden University Hospital",
    training: "Women’s heart health",
    membership: "Lakes Region Cardiology Society",
    recertified: 2021,
    videoVisits: true,
  },
  "dr-brooks": {
    bio: "Dr. Brooks’s goal is simple: get patients back to the things they love doing, safely. Visits focus on clear diagnoses and recovery plans that fit real life. With eighteen years in orthopedics, Dr. Brooks treats everything from sprains to joint replacements.",
    patients: "4,400+",
    focus: ["Knee and hip pain", "Joint replacement care", "Back and neck pain", "Sprains and strains", "Fractures", "Arthritis"],
    residency: "Orthopedic surgery, Marlow Regional Medical Center",
    training: "Joint replacement",
    membership: "Bone & Joint Care Society",
    recertified: 2022,
    videoVisits: true,
  },
  "dr-morales": {
    bio: "Whether it’s a sprain or a new knee, Dr. Morales gets patients moving again. Patients appreciate the honest advice, including when surgery isn’t needed. Dr. Morales sees patients in English and Spanish and coaches a local masters running club.",
    patients: "4,800+",
    focus: ["Knee injuries", "Shoulder pain", "Running injuries", "Arthritis", "Fractures", "Surgery second opinions"],
    residency: "Orthopedic surgery, Westbrook University Hospital",
    training: "Knee and shoulder care",
    membership: "Bone & Joint Care Society",
    recertified: 2021,
    videoVisits: true,
  },
  "dr-cole": {
    bio: "Sports injuries are Dr. Cole’s specialty, from weekend warriors to high-school athletes. Visits focus on healing well and training smarter, so injuries don’t come back. Off the clock, Dr. Cole is the team doctor for a local youth hockey league.",
    patients: "1,500+",
    focus: ["Sports injuries", "Sprains and strains", "ACL and knee injuries", "Concussion care", "Return-to-play plans", "Fractures"],
    residency: "Orthopedic surgery, Ridgeview Children’s Hospital",
    training: "Sports medicine",
    membership: "Bone & Joint Care Society",
    recertified: 2024,
    videoVisits: false,
  },
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

const surname = (d: Pick<Doctor, "name">) => d.name.split(" ").slice(-1)[0]

/** "Dr. Chen" */
export const shortName = (d: Pick<Doctor, "name">) => `Dr. ${surname(d)}`

/** Residency year, then med school three years before. Fictional but consistent with experience. */
export function educationFor(d: Doctor, p: DoctorProfile) {
  const residencyYear = 2025 - d.yearsExperience
  return [
    { type: "Medical school", details: `${d.trainedAt}, ${residencyYear - 3}` },
    { type: "Residency", details: `${p.residency}, ${residencyYear}` },
    { type: "Board certification", details: `${d.specialty}, recertified ${p.recertified}` },
    { type: "Special training", details: p.training },
    { type: "Memberships", details: p.membership },
  ]
}

export function reviewsFor(d: Doctor) {
  return (specialtyProfiles[d.specialtyId]?.reviews ?? []).map((r) => ({ ...r, text: r.text.replace("{name}", surname(d)) }))
}

export function faqsFor(d: Doctor, p: DoctorProfile) {
  const name = shortName(d)
  const sp = specialtyProfiles[d.specialtyId]
  return [
    {
      question: `Is ${name} accepting new patients?`,
      answer: d.acceptingNewPatients
        ? `Yes, ${name} is currently accepting new patients (${sp.ages.toLowerCase()}).`
        : `Not right now. Join the waitlist, or book with another ${d.specialty.toLowerCase()} doctor.`,
    },
    {
      question: `Does ${name} offer video visits?`,
      answer: p.videoVisits ? `Yes, ${sp.videoNote}.` : `${name} sees patients in person only. Other doctors in ${d.specialty.toLowerCase()} offer video visits.`,
    },
    { question: `Who does ${name} see?`, answer: `${sp.ages}, at ${locationName(d.location)}.` },
    { question: `How soon can I see ${name}?`, answer: `The next opening is ${d.slots[0].label}. Most patients are seen within 1–3 days.` },
  ]
}

export const profileCopy = {
  breadcrumbRoot: { label: "Find a doctor", href: "/find-a-doctor" },
  title: (specialty: string, years: number) => `Board-certified in ${specialty.toLowerCase()} · ${years} years of experience`,
  badges: { accepting: "Accepting new patients", video: "Video visits" },
  reviewsCount: (n: number) => `${n} reviews`,
  book: "Book a visit",
  message: "Message the office",
  panel: {
    heading: (name: string) => `Book with ${name}`,
    visitType: "Visit type",
    formats: [
      { id: "in-person", label: "In person" },
      { id: "video", label: "Video" },
    ],
    reason: "Reason for visit",
    reasons: ["Annual physical", "Sick visit", "Follow-up", "New patient visit"],
    day: "Day",
    open: (n: number) => `${n} open`,
    time: "Time",
    insurance: "Usually accepted by 40+ insurance plans",
    checkPlan: { label: "Check your plan", href: "/insurance" },
    continue: "Continue booking",
    cancellation: "Free cancellation up to 24 hours before.",
    pickTime: "Choose a time to continue",
  },
  about: (name: string) => `About ${name}`,
  facts: { experience: "Experience", patients: "Patients", visit: "Visit length", response: "Response time" },
  factValues: { years: (n: number) => `${n} years`, patients: (s: string) => `${s} cared for`, response: "Replies within 1 business day" },
  focusTitle: "Areas of focus",
  educationTitle: "Education and training",
  educationNote: "All institutions and organizations are fictional.",
  insuranceTitle: "Insurance accepted",
  insuranceMore: "and 30+ more",
  whereTitle: (name: string) => `Where ${name} sees patients`,
  directions: "Get directions",
  viewClinic: "View clinic",
  reviewsTitle: "Patient reviews",
  reviewsSummary: (score: string, n: number) => `${score} out of 5 · ${n} reviews`,
  reviewsShowing: (shown: number, n: number) => `Showing ${shown} of ${n} reviews`,
  faqTitle: (name: string) => `FAQs about ${name}`,
  similarTitle: "Similar doctors",
  allInSpecialty: (specialty: string) => `All ${specialty.toLowerCase()} doctors`,
  specialtyHref: (specialtyId: string) => `/find-a-doctor?specialty=${specialtyId}`,
  clinicHref: (location: string) => `/find-a-doctor?clinic=${location}`,
  next: (slot: string) => `Next: ${slot}`,
}

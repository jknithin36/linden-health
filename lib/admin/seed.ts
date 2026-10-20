// Fictional data for demo purposes only.
// A tiny seeded random generator plus the pools the demo data is drawn from. Same seed, same
// data, on the server and in every browser, on every refresh.

/** mulberry32: fast 32-bit seeded PRNG. Returns a function giving floats in [0, 1). */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof createRng>

/** Convenience helpers around one seeded stream. */
export function createRng(seed: number) {
  const next = mulberry32(seed)
  const rng = {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    float: (min: number, max: number) => min + next() * (max - min),
    chance: (p: number) => next() < p,
    pick: <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)],
    /** Weighted pick: [[value, weight], …]. */
    weighted: <T,>(items: readonly (readonly [T, number])[]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0)
      let r = next() * total
      for (const [v, w] of items) {
        r -= w
        if (r < 0) return v
      }
      return items[items.length - 1][0]
    },
    shuffle: <T,>(list: readonly T[]): T[] => {
      const out = [...list]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    sample: <T,>(list: readonly T[], n: number): T[] => rng.shuffle(list).slice(0, n),
    digits: (n: number) => Array.from({ length: n }, () => Math.floor(next() * 10)).join(""),
  }
  return rng
}

/* -------------------------------- Name pools -------------------------------- */

export const femaleNames = [
  "Olivia", "Amara", "Sofia", "Mei", "Priya", "Isabella", "Fatima", "Hannah", "Zoe", "Aaliyah", "Grace", "Leah", "Nora",
  "Camila", "Yuki", "Ananya", "Chloe", "Maya", "Elena", "Imani", "Lucia", "Ava", "Riya", "Naomi", "Clara", "Jasmine",
  "Rosa", "Ines", "Keiko", "Tamar", "Abigail", "Mila", "Lena", "Sana", "Adaeze", "Margaret", "Dorothy", "Evelyn",
  "Linda", "Patricia", "Carmen", "Gloria", "Joan", "Ruth", "Beatrice", "Harper", "Ivy", "Luna", "Aria", "Nia",
]

export const maleNames = [
  "Liam", "Mateo", "Ethan", "Wei", "Arjun", "Noah", "Omar", "Elijah", "Daniel", "Kofi", "Lucas", "Hiro", "Samuel",
  "Diego", "Malik", "Aarav", "Julian", "Leo", "Ibrahim", "Caleb", "Andre", "Theo", "Ravi", "Isaac", "Felix", "Jamal",
  "Tomas", "Kenji", "Elias", "Owen", "Gabriel", "Aiden", "Nikhil", "Emeka", "Victor", "Walter", "Frank", "Harold",
  "Raymond", "Eugene", "George", "Arthur", "Henry", "Louis", "Miles", "Jonah", "Ezra", "Silas", "Rafael", "Yusuf",
]

export const lastNames = [
  "Alvarez", "Okonkwo", "Nguyen", "Patel", "Kowalski", "Haddad", "Johansson", "Okafor", "Reyes", "Chen", "Brennan",
  "Moreno", "Takahashi", "Abara", "Lindgren", "Kapoor", "Delgado", "Fischer", "Mensah", "Romano", "Sato", "Ibrahim",
  "Duarte", "Hollis", "Osei", "Varga", "Castillo", "Kim", "Mahmoud", "Sullivan", "Petrov", "Ndiaye", "Bianchi",
  "Herrera", "Novak", "Ortega", "Asante", "Byrne", "Gupta", "Rossi", "Yamada", "Owusu", "Keller", "Santos", "Farah",
  "Wright", "Dubois", "Mwangi", "Larsen", "Quinn", "Aguilar", "Morales", "Price", "Ellison", "Tran", "Banerjee",
  "Whitfield", "Coleman", "Ferreira", "Ward", "Hughes", "Kaur", "Lopez", "Zhang", "Russo", "Murphy", "Nakamura",
]

export const streets = [
  "Maple Avenue", "Cedar Road", "Birch Lane", "Lake Shore Drive", "Elm Street", "Oak Park Drive", "Detroit Avenue",
  "Madison Avenue", "Fairmount Boulevard", "Chagrin Boulevard", "Clifton Boulevard", "Warren Road", "Hilliard Road",
  "Shaker Boulevard", "Euclid Avenue", "Lorain Avenue", "Edgewater Drive", "Coventry Road", "Lee Road", "Belvoir Boulevard",
]

/** Cities patients live in, near each clinic. */
export const cityByClinic = {
  cleveland: ["Cleveland", "Cleveland", "Cleveland Heights", "East Cleveland", "Parma"],
  lakewood: ["Lakewood", "Lakewood", "Rocky River", "Westlake", "Bay Village"],
  beachwood: ["Beachwood", "Beachwood", "Shaker Heights", "Pepper Pike", "University Heights"],
} as const

export const zipByCity: Record<string, string> = {
  Cleveland: "44113",
  "Cleveland Heights": "44118",
  "East Cleveland": "44112",
  Parma: "44129",
  Lakewood: "44107",
  "Rocky River": "44116",
  Westlake: "44145",
  "Bay Village": "44140",
  Beachwood: "44122",
  "Shaker Heights": "44120",
  "Pepper Pike": "44124",
  "University Heights": "44121",
}

/** Fictional 555-01xx numbers only. */
export const areaCodes = ["216", "440", "330", "234"]

/* ------------------------------- Clinical pools ----------------------------- */

export const allergyPool = ["Penicillin", "Sulfa drugs", "Peanuts", "Latex", "Shellfish", "Codeine", "Amoxicillin", "Bee stings", "Tree nuts", "Ibuprofen"]

export const conditionsByAge = {
  child: ["Asthma", "Eczema", "Seasonal allergies", "ADHD", "Ear infections (recurring)"],
  adult: ["Seasonal allergies", "Migraine", "Anxiety", "Low vitamin D", "Hypothyroidism", "Asthma", "GERD", "High cholesterol"],
  older: ["High blood pressure", "Type 2 diabetes", "High cholesterol", "Osteoarthritis", "Atrial fibrillation", "Chronic kidney disease (stage 2)", "Osteoporosis"],
}

export const reasons = {
  sick: ["Fever and cough", "Sore throat", "Ear pain", "Sinus pressure", "Stomach bug", "Rash", "Flu symptoms", "Pink eye", "UTI symptoms", "Back pain"],
  sickChild: ["Fever and cough", "Ear pain", "Sore throat", "Rash", "Stomach bug", "Cold symptoms"],
  annual: ["Annual physical", "Yearly checkup"],
  wellChild: ["Well-child visit", "School physical", "Sports physical"],
  followUp: ["Blood pressure follow-up", "Diabetes check-in", "Medication review", "Lab results review", "Follow-up after sick visit", "Thyroid follow-up"],
  newPatient: ["New patient visit", "Establish care"],
  vaccine: ["Flu shot", "Tdap booster", "Shingles vaccine", "COVID-19 booster", "Travel vaccines"],
  vaccineChild: ["Flu shot", "Childhood vaccines", "HPV vaccine", "Tdap booster"],
  lab: ["Fasting blood work", "Lab draw", "A1c check", "Lipid panel"],
  specialist: {
    cardiology: ["Chest pain evaluation", "Heart rhythm check", "Blood pressure management", "Echocardiogram review", "Cholesterol consult"],
    dermatology: ["Skin check", "Acne follow-up", "Mole evaluation", "Eczema flare", "Psoriasis follow-up"],
    orthopedics: ["Knee pain", "Shoulder pain", "Ankle sprain", "Back pain consult", "Post-op check", "Hip pain"],
    "womens-health": ["Annual well-woman exam", "Prenatal visit", "Birth control consult", "Menopause consult", "Pelvic pain"],
    pediatrics: ["Developmental check", "Asthma follow-up", "Growth check"],
    "family-medicine": ["Medication review"],
  } as Record<string, string[]>,
}

export const denialReasons = ["Missing referral", "Out of network", "Duplicate claim", "Coverage ended", "Prior authorization required", "Incorrect member ID"]

/** Self-pay prices by visit type (also the "billed" amount on claims). */
export const selfPay = { sick: 95, video: 65, annual: 180, "new-patient": 180, specialist: 175, "follow-up": 95, lab: 45, vaccine: 35, xray: 85 }

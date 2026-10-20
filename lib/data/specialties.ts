// Dummy content for a fictional clinic. Swap `image` in when real photos exist.

export type Specialty = {
  id: string
  name: string
  summary: string
  commonVisits: string[]
  doctorCount: number
  nextAvailable: string
  href: string
  /** Photo path. Until real photos exist, `placeholder` is shown instead. */
  image?: string
  imageAlt: string
  /** CSS background for the placeholder photo. */
  placeholder: string
}

export const specialtiesLabel = "Our specialties"
export const specialtiesHeading = "Care for every part of your life"
export const specialtiesIntro =
  "From checkups to specialist care, our doctors work together so you get the right care in one place."

export const specialtiesCopy = {
  tabsLabel: "Specialties",
  play: "Play specialties slideshow",
  pause: "Pause specialties slideshow",
  commonVisits: "Common visits",
  nextAvailable: "Next available",
  doctorCount: (count: number) => `${count} doctors`,
  book: "Book a visit",
  learnMore: "Learn more",
  bookHref: (specialtyId: string) => `/book?specialty=${specialtyId}`,
}

export const specialties: Specialty[] = [
  {
    id: "family-medicine",
    name: "Family medicine",
    summary: "Everyday care for every age, from checkups to chronic conditions.",
    commonVisits: ["Annual physicals", "Colds and flu", "Blood pressure"],
    doctorCount: 24,
    nextAvailable: "Today",
    href: "/services#family-medicine",
    image: "/images/specialties/family-medicine.webp",
    imageAlt: "A smiling doctor in blue scrubs reviewing notes with an older patient",
    placeholder: "linear-gradient(160deg, #b9a998 0%, #7d6d5f 100%)",
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    summary: "Gentle, expert care for babies, kids, and teens.",
    commonVisits: ["Well-child visits", "Vaccines", "Ear infections"],
    doctorCount: 14,
    nextAvailable: "Today",
    href: "/services#pediatrics",
    image: "/images/specialties/pediatrics.webp",
    imageAlt: "Three smiling clinicians in scrubs holding a newborn baby",
    placeholder: "linear-gradient(160deg, #c4b49a 0%, #8c7a5c 100%)",
  },
  {
    id: "womens-health",
    name: "Women’s health",
    summary: "Care through every stage, from first visits to menopause.",
    commonVisits: ["Annual exams", "Prenatal care", "Birth control"],
    doctorCount: 11,
    nextAvailable: "Tomorrow",
    href: "/services#womens-health",
    image: "/images/specialties/womens-health.webp",
    imageAlt: "A smiling woman with curly hair and hoop earrings, in warm light",
    placeholder: "linear-gradient(160deg, #c2aaa6 0%, #8a6a66 100%)",
  },
  {
    id: "dermatology",
    name: "Dermatology",
    summary: "Expert care for skin, hair, and nails.",
    commonVisits: ["Skin checks", "Acne", "Eczema"],
    doctorCount: 8,
    nextAvailable: "Thu",
    href: "/services#dermatology",
    image: "/images/specialties/dermatology.webp",
    imageAlt: "A smiling woman in a white headband touching her clear skin",
    placeholder: "linear-gradient(160deg, #b3aec2 0%, #6c6783 100%)",
  },
  {
    id: "cardiology",
    name: "Cardiology",
    summary: "Heart care that’s personal, preventive, and close to home.",
    commonVisits: ["Heart checkups", "High cholesterol", "ECG"],
    doctorCount: 9,
    nextAvailable: "Fri",
    href: "/services#cardiology",
    image: "/images/specialties/cardiology.webp",
    imageAlt: "A smiling older woman with white hair outdoors among autumn leaves",
    placeholder: "linear-gradient(160deg, #a9b7b0 0%, #63766d 100%)",
  },
  {
    id: "orthopedics",
    name: "Orthopedics",
    summary: "Treatment for bones, joints, and sports injuries.",
    commonVisits: ["Knee and back pain", "Sprains", "Fractures"],
    doctorCount: 10,
    nextAvailable: "Tomorrow",
    href: "/services#orthopedics",
    image: "/images/specialties/orthopedics.webp",
    imageAlt: "An older man in a hat smiling as he rolls up his trousers to paddle at the beach",
    placeholder: "linear-gradient(160deg, #a7b3c2 0%, #627083 100%)",
  },
]

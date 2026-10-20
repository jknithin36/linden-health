// Dummy data for a fictional clinic. Institutions below are invented and must not
// be swapped for real university, hospital or company names or logos.

export type TrustDoctor = {
  id: string
  name: string
  /** Photo path. Until real photos exist, `gradient` is shown instead. */
  avatar?: string
  /** CSS background for the placeholder avatar. */
  gradient: string
}

export type TrustInstitution = {
  id: string
  name: string
  style: "serif" | "crest" | "monogram" | "seal" | "leaf"
  line1: string
  line2?: string
}

/** Accessible name for the strip (it has no visible heading). */
export const trustLabel = "Our doctors’ training"

export const trustHeadline =
  "Care from doctors trained at leading medical schools"

export const trustDoctors: TrustDoctor[] = [
  {
    id: "dr-chen",
    avatar: "/images/doctors/dr-chen.webp",
    name: "Dr. Emily Chen",
    gradient: "linear-gradient(135deg, #f4d6c6 0%, #d99a7e 100%)",
  },
  {
    id: "dr-patel",
    avatar: "/images/doctors/dr-patel.webp",
    name: "Dr. Arjun Patel",
    gradient: "linear-gradient(135deg, #cfe0d6 0%, #7fa592 100%)",
  },
  {
    id: "dr-brooks",
    avatar: "/images/doctors/dr-brooks.webp",
    name: "Dr. Michael Brooks",
    gradient: "linear-gradient(135deg, #d6dcea 0%, #8a98b8 100%)",
  },
]

export const trustInstitutions: TrustInstitution[] = [
  { id: "westbrook", name: "Westbrook University", style: "serif", line1: "Westbrook" },
  { id: "halden", name: "Halden Medical School", style: "crest", line1: "HALDEN", line2: "MEDICAL SCHOOL" },
  { id: "ucaz", name: "UCAZ Health", style: "monogram", line1: "UCAZ" },
  { id: "marlow", name: "Marlow College of Medicine", style: "seal", line1: "MARLOW", line2: "COLLEGE OF MEDICINE" },
  { id: "ridgeview", name: "Ridgeview Children’s", style: "leaf", line1: "Ridgeview", line2: "CHILDREN’S" },
]

const normalise = (name: string) => name.replace(/[’']/g, "'").toLowerCase()

/** Looks up an institution's wordmark by its full name, e.g. a doctor's `trainedAt`. */
export function institutionByName(name: string): TrustInstitution | undefined {
  return trustInstitutions.find((i) => normalise(i.name) === normalise(name))
}

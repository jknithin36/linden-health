import { Suspense } from "react"
import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { doctorsDirectory } from "@/lib/data/doctors"
import { DoctorFinder, DoctorFinderWithParams } from "@/components/doctors/doctor-finder"

export const metadata: Metadata = {
  title: `Find a doctor · ${site.name}`,
  description: doctorsDirectory.intro,
}

export default function FindADoctorPage() {
  // The fallback is the full page without insurance filtering, so it prerenders.
  return (
    <Suspense fallback={<DoctorFinder />}>
      <DoctorFinderWithParams />
    </Suspense>
  )
}

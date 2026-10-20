import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { DoctorsPage } from "@/components/admin/doctors/doctors-page"

const c = adminCopy.pages.doctors
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminDoctorsPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <DoctorsPage />
    </Suspense>
  )
}

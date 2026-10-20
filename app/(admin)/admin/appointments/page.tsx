import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { AppointmentsPage } from "@/components/admin/appointments-page"

const c = adminCopy.pages.appointments
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminAppointmentsPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <AppointmentsPage />
    </Suspense>
  )
}

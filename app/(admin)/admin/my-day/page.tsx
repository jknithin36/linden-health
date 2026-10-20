import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { MyDayPage } from "@/components/admin/doctor/my-day-page"

const c = adminCopy.pages["my-day"]
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminMyDayPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={5} table={true} />}>
      <MyDayPage />
    </Suspense>
  )
}

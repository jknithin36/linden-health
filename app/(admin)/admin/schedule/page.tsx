import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { SchedulePage } from "@/components/admin/schedule/schedule-page"

const c = adminCopy.pages.schedule
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminSchedulePage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <SchedulePage />
    </Suspense>
  )
}

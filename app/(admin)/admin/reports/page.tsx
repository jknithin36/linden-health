import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { ReportsPage } from "@/components/admin/reports/reports-page"

const c = adminCopy.pages.reports
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={5} table={false} />}>
      <ReportsPage />
    </Suspense>
  )
}

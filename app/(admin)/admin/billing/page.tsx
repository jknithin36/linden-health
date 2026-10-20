import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { BillingPage } from "@/components/admin/billing/billing-page"

const c = adminCopy.pages.billing
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminBillingPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={4} />}>
      <BillingPage />
    </Suspense>
  )
}

import { Suspense } from "react"
import type { Metadata } from "next"

import { visitsCopy } from "@/lib/data/visits"
import { VisitsPage, VisitsPageWithParams } from "@/components/portal/visits/visits-page"

export const metadata: Metadata = { title: visitsCopy.heading, description: visitsCopy.intro }

export default function PortalVisitsPage() {
  return (
    <Suspense fallback={<VisitsPage />}>
      <VisitsPageWithParams />
    </Suspense>
  )
}

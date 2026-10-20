import { Suspense } from "react"
import type { Metadata } from "next"

import { familyCopy } from "@/lib/data/family"
import { FamilyPage, FamilyPageWithParams } from "@/components/portal/family/family-page"

export const metadata: Metadata = { title: familyCopy.heading, description: familyCopy.intro }

export default function PortalFamilyPage() {
  return (
    <Suspense fallback={<FamilyPage />}>
      <FamilyPageWithParams />
    </Suspense>
  )
}

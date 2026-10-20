import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { SettingsPage } from "@/components/admin/settings/settings-page"

const c = adminCopy.pages.settings
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <SettingsPage />
    </Suspense>
  )
}

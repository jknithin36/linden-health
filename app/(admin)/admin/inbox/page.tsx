import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { InboxPage } from "@/components/admin/doctor/inbox/inbox-page"

const c = adminCopy.pages.inbox
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminInboxPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} table={true} />}>
      <InboxPage />
    </Suspense>
  )
}

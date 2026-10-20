import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { MessagesPage } from "@/components/admin/messages/messages-page"

const c = adminCopy.pages.messages
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <MessagesPage />
    </Suspense>
  )
}

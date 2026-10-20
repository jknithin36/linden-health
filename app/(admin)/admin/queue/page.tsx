import { Suspense } from "react"
import type { Metadata } from "next"

import { adminCopy } from "@/lib/data/admin"
import { PageSkeleton } from "@/components/admin/skeletons"
import { QueuePage } from "@/components/admin/queue/queue-page"

const c = adminCopy.pages.queue
export const metadata: Metadata = { title: c.title, description: c.description }

export default function AdminQueuePage() {
  return (
    <Suspense fallback={<PageSkeleton cards={4} table={false} />}>
      <QueuePage />
    </Suspense>
  )
}

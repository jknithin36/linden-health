import { Suspense } from "react"
import type { Metadata } from "next"

import { sectionById } from "@/lib/data/portal"
import { messagesCopy } from "@/lib/data/messages"
import { MessagesPage, MessagesPageWithParams } from "@/components/portal/messages/messages-page"

export const metadata: Metadata = { title: messagesCopy.heading, description: sectionById("messages").description }

export default function PortalMessagesPage() {
  return (
    <Suspense fallback={<MessagesPage />}>
      <MessagesPageWithParams />
    </Suspense>
  )
}

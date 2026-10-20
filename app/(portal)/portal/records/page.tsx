import type { Metadata } from "next"

import { recordsCopy } from "@/lib/data/records"
import { RecordsPage } from "@/components/portal/records/records-page"

export const metadata: Metadata = { title: recordsCopy.heading, description: recordsCopy.intro }

export default function PortalRecordsPage() {
  return <RecordsPage />
}

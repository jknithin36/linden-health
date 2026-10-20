import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { sectionById } from "@/lib/data/portal"
import { PortalOverview } from "@/components/portal/overview"

const overview = sectionById("overview")

// The layout's title template only reaches child segments, so this page sets its full title.
export const metadata: Metadata = { title: `${overview.label} · ${site.name}`, description: overview.description }

export default function PortalOverviewPage() {
  return <PortalOverview />
}

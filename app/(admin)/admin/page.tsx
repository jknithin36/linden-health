import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { adminCopy } from "@/lib/data/admin"
import { OverviewPage } from "@/components/admin/overview-page"

const c = adminCopy.pages.overview
// The layout's title template only reaches child segments, so this page sets its full title.
export const metadata: Metadata = { title: `${c.title} · Admin · ${site.name}`, description: c.description }

export default function AdminOverviewPage() {
  return <OverviewPage />
}

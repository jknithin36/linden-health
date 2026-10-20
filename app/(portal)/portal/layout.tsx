import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { PortalShell } from "@/components/portal/portal-shell"

export const metadata: Metadata = {
  title: { template: `%s · ${site.name}`, default: `Patient portal · ${site.name}` },
  robots: { index: false },
}

/** Patient portal: its own sidebar layout, without the marketing navbar and footer. */
export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return <PortalShell>{children}</PortalShell>
}

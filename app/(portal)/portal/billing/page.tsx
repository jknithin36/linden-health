import type { Metadata } from "next"

import { billingCopy } from "@/lib/data/billing"
import { BillingPage } from "@/components/portal/billing/billing-page"

export const metadata: Metadata = { title: billingCopy.heading, description: billingCopy.intro }

export default function PortalBillingPage() {
  return <BillingPage />
}

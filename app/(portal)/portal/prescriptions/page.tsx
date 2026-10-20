import type { Metadata } from "next"

import { prescriptionsCopy } from "@/lib/data/prescriptions"
import { PrescriptionsPage } from "@/components/portal/prescriptions/prescriptions-page"

export const metadata: Metadata = { title: prescriptionsCopy.heading, description: prescriptionsCopy.intro }

export default function PortalPrescriptionsPage() {
  return <PrescriptionsPage />
}

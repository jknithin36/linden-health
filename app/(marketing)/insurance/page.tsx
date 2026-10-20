import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { insuranceHeading, insuranceIntro } from "@/lib/data/insurance"
import { InsurancePage } from "@/components/insurance/insurance-page"

export const metadata: Metadata = {
  title: `Insurance · ${site.name}`,
  description: `${insuranceHeading}. ${insuranceIntro}`,
}

export default function Page() {
  return <InsurancePage />
}

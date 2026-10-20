import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { servicesCopy } from "@/lib/data/services"
import { ServicesPage } from "@/components/services/services-page"

export const metadata: Metadata = {
  title: `Services · ${site.name}`,
  description: servicesCopy.intro,
}

export default function Page() {
  return <ServicesPage />
}

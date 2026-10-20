import type { Metadata } from "next"

import { resultsCopy } from "@/lib/data/results"
import { ResultsList } from "@/components/portal/results/results-list"

export const metadata: Metadata = { title: resultsCopy.heading, description: resultsCopy.intro }

export default function PortalResultsPage() {
  return <ResultsList />
}

import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { personById } from "@/lib/data/portal"
import { resultById, results } from "@/lib/data/results"
import { ResultDetail } from "@/components/portal/results/result-detail"

export function generateStaticParams() {
  return results.map((r) => ({ id: r.id }))
}

export async function generateMetadata({ params }: PageProps<"/portal/results/[id]">): Promise<Metadata> {
  const result = resultById((await params).id)
  return { title: result ? `${result.title} · ${personById(result.personId).firstName}` : undefined }
}

async function Detail({ params }: { params: PageProps<"/portal/results/[id]">["params"] }) {
  const result = resultById((await params).id)
  if (!result) notFound()
  return <ResultDetail result={result} />
}

export default function PortalResultPage({ params }: PageProps<"/portal/results/[id]">) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  )
}

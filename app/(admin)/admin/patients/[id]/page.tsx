import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { patientById } from "@/lib/admin/data"
import { PageSkeleton } from "@/components/admin/skeletons"
import { PatientDetailPage } from "@/components/admin/patient-detail/patient-detail"

export function generateStaticParams() {
  return [{ id: "p-sarah" }]
}

/** Patients added in this browser tab ("p-new-…") only exist client-side, so let those through. */
const known = (id: string) => patientById.has(id) || id.startsWith("p-new-")

export async function generateMetadata({ params }: PageProps<"/admin/patients/[id]">): Promise<Metadata> {
  const p = patientById.get((await params).id)
  return { title: p ? `${p.name} · Patients` : "Patient", description: p ? `${p.name}’s chart: visits, results, medications and billing.` : undefined }
}

async function Detail({ params }: { params: PageProps<"/admin/patients/[id]">["params"] }) {
  const { id } = await params
  if (!known(id)) notFound()
  return <PatientDetailPage id={id} />
}

export default function AdminPatientPage({ params }: PageProps<"/admin/patients/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton cards={3} table={false} />}>
      <Detail params={params} />
    </Suspense>
  )
}

import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { doctorById, doctors } from "@/lib/admin/data"
import { PageSkeleton } from "@/components/admin/skeletons"
import { DoctorDetail } from "@/components/admin/doctors/doctor-detail"

export function generateStaticParams() {
  return [{ id: doctors[0].id }]
}

export async function generateMetadata({ params }: PageProps<"/admin/doctors/[id]">): Promise<Metadata> {
  const { id } = await params
  const d = doctorById.get(id)
  return { title: d ? d.name : "Doctor not found", description: d ? `${d.specialty} · hours, time off and utilization` : undefined }
}

async function DoctorContent({ params }: { params: PageProps<"/admin/doctors/[id]">["params"] }) {
  const { id } = await params
  if (!doctorById.get(id)) notFound()
  return <DoctorDetail id={id} />
}

export default function AdminDoctorPage({ params }: PageProps<"/admin/doctors/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton cards={3} table={false} />}>
      <DoctorContent params={params} />
    </Suspense>
  )
}

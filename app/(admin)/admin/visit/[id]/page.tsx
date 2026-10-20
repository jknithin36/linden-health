import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { adminCopy } from "@/lib/data/admin"
import { appointmentById, appointments, patientById } from "@/lib/admin/data"
import { PageSkeleton } from "@/components/admin/skeletons"
import { VisitPage } from "@/components/admin/doctor/visit/visit-page"

const c = adminCopy.pages.visit

/** Robert Hayes's 2:00 PM visit today, prebuilt at build time. */
export function generateStaticParams() {
  const hayes = appointments.find((a) => a.patientId === "p-hayes" && a.start === "2026-10-19T14:00")
  return hayes ? [{ id: hayes.id }] : []
}

/** Appointments booked in this browser tab ("a-new-…") only exist client-side, so let those through. */
const known = (id: string) => appointmentById.has(id) || id.startsWith("a-new-")

export async function generateMetadata({ params }: PageProps<"/admin/visit/[id]">): Promise<Metadata> {
  const a = appointmentById.get((await params).id)
  const p = a ? patientById.get(a.patientId) : undefined
  return { title: p ? `${p.name} · ${c.title}` : c.title, description: c.description }
}

async function Visit({ params }: { params: PageProps<"/admin/visit/[id]">["params"] }) {
  const { id } = await params
  if (!known(id)) notFound()
  return <VisitPage id={id} />
}

export default function AdminVisitPage({ params }: PageProps<"/admin/visit/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton cards={0} table={false} />}>
      <Visit params={params} />
    </Suspense>
  )
}

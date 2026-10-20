import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { cn } from "@/lib/utils"
import { container, pageTop } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { doctorBySlug, doctors } from "@/lib/data/doctors"
import { doctorProfiles } from "@/lib/data/doctor-profiles"
import { DoctorProfile } from "@/components/doctors/doctor-profile"

/** Prerender every doctor's profile at build time. */
export function generateStaticParams() {
  return doctors.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: PageProps<"/doctors/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const doctor = doctorBySlug(slug)
  if (!doctor) return { title: site.name }
  return {
    title: `${doctor.name}, ${doctor.credentials} · ${doctor.specialty} · ${site.name}`,
    description: doctorProfiles[doctor.id]?.bio ?? doctor.quote,
  }
}

/** Same outline as the profile, so navigation shows the page shape instantly. */
function ProfileSkeleton() {
  const block = "animate-pulse rounded-[20px] bg-neutral-100"
  return (
    <main aria-busy="true" className={cn(container, pageTop, "pb-16")}>
      <div className={cn(block, "h-4 w-56 rounded-full")} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:items-end">
          <div className={cn(block, "aspect-4/5 rounded-[28px]")} />
          <div className="flex flex-col gap-3">
            <div className={cn(block, "h-6 w-64 rounded-full")} />
            <div className={cn(block, "h-12 w-full max-w-md")} />
            <div className={cn(block, "h-5 w-80 rounded-full")} />
          </div>
        </div>
        <div className={cn(block, "hidden h-[640px] rounded-[28px] lg:block")} />
      </div>
    </main>
  )
}

async function Profile({ params }: Pick<PageProps<"/doctors/[slug]">, "params">) {
  const { slug } = await params
  const doctor = doctorBySlug(slug)
  // Unknown slugs get the branded 404 (dynamicParams isn't available with Cache Components).
  if (!doctor || !doctorProfiles[doctor.id]) notFound()
  return <DoctorProfile doctorId={doctor.id} />
}

export default function DoctorPage({ params }: PageProps<"/doctors/[slug]">) {
  // URL data is read inside Suspense so the shared page shell can show instantly on navigation.
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile params={params} />
    </Suspense>
  )
}

import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { panel } from "@/lib/styles"
import { hero } from "@/lib/data/hero"
import { Button } from "@/components/ui/button"
import { TrustStrip } from "@/components/home/trust-strip"
import { HowItWorks } from "@/components/home/how-it-works"
import { Specialties } from "@/components/home/specialties"
import { DoctorSpotlight } from "@/components/home/doctor-spotlight"
import { Stories } from "@/components/home/stories"
import { Insurance } from "@/components/home/insurance"
import { SelfPay } from "@/components/home/self-pay"

export default function Home() {
  return (
    <main className="flex flex-col gap-4 pb-4">
      {/* Hero: rounded card inset 16px from the screen edges */}
      <section
        aria-labelledby="hero-heading"
        className={cn(panel, "relative flex min-h-[calc(100svh-88px-16px)] overflow-hidden bg-neutral-800")}
      >
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          preload
          sizes="(min-width: 1024px) calc(100vw - 32px), 100vw"
          className="object-cover object-top"
        />
        {/* Black gradients so the white copy stays legible */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute inset-0 hidden bg-linear-to-r from-black/60 from-0% via-black/25 via-35% to-transparent to-60% sm:block" />
          <div className="absolute inset-0 bg-linear-to-t from-black/55 from-0% via-black/15 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 from-0% via-black/55 via-45% to-transparent to-75% sm:hidden" />
        </div>

        {/* Inner width lines the copy up with the navbar links */}
        <div className="relative mx-auto flex w-full max-w-[1408px] flex-col px-6 pt-16 pb-8 sm:px-10 lg:pb-10">
          <div className="flex flex-1 flex-col justify-end gap-6 sm:justify-center sm:py-10 lg:-mt-6">
            <p className="flex items-center gap-2 text-white text-caption">
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4" />
              {hero.eyebrow}
            </p>

            <div className="flex flex-col gap-4">
              <h1 id="hero-heading" className="max-w-[12em] text-white text-display">
                {hero.heading[0]} <br className="max-sm:hidden" />
                {hero.heading[1]}
              </h1>
              <p className="max-w-md text-white/90 text-body">{hero.intro}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="inverse" size="xl" nativeButton={false} render={<Link href={hero.primary.href} />}>
                {hero.primary.label}
              </Button>
              <Button variant="glass" size="xl" nativeButton={false} render={<Link href={hero.secondary.href} />}>
                {hero.secondary.label}
              </Button>
            </div>
          </div>

          <ul className="hidden divide-x divide-white/20 sm:flex">
            {hero.highlights.map((item) => (
              <li key={item.title} className="flex flex-col gap-0.5 px-6 first:pl-0 text-caption">
                <span className="text-white">{item.title}</span>
                <span className="text-white/65">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TrustStrip />
      <HowItWorks />
      <Specialties />
      <DoctorSpotlight />
      <Stories />
      <Insurance />
      <SelfPay />
    </main>
  )
}

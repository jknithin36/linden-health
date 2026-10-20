import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { glass } from "@/lib/styles"
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
      {/*
        Hero. Phones: a rounded photo card with a glass chip, then the copy on white (the same
        layout as the stories and specialties sections). Tablet and up: copy over a full-bleed
        photo in a rounded card inset 16px from the screen edges.
      */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex flex-col px-6 pt-2 md:mx-4 md:min-h-[calc(100svh-88px-16px)] md:flex-row md:overflow-hidden md:rounded-[32px] md:bg-neutral-800 md:px-0 md:pt-0"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-neutral-200 md:absolute md:inset-0 md:aspect-auto md:rounded-none md:bg-transparent">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            preload
            sizes="(min-width: 768px) calc(100vw - 32px), calc(100vw - 48px)"
            className="object-cover object-top"
          />
          {/* Black gradients so the white copy stays legible (tablet and up) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute inset-0 bg-linear-to-r from-black/60 from-0% via-black/25 via-35% to-transparent to-60%" />
            <div className="absolute inset-0 bg-linear-to-t from-black/55 from-0% via-black/15 via-30% to-transparent to-50%" />
          </div>
          {/* Phones: the eyebrow as a glass chip on the photo */}
          <p className={cn(glass, "absolute bottom-3 left-3 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-caption md:hidden")}>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-3.5" />
            </span>
            <span className="truncate">{hero.eyebrow}</span>
          </p>
        </div>

        {/* Inner width lines the copy up with the navbar links */}
        <div className="relative mx-auto flex w-full max-w-[1408px] flex-col pt-6 md:px-10 md:pt-16 md:pb-8 lg:pb-10">
          <div className="flex flex-1 flex-col gap-5 md:justify-center md:gap-6 md:py-10 lg:-mt-6">
            <p className="hidden items-center gap-2 text-white md:flex text-caption">
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4" />
              {hero.eyebrow}
            </p>

            <div className="flex flex-col gap-3 md:gap-4">
              <h1 id="hero-heading" className="max-w-[12em] text-neutral-950 md:text-white text-display">
                {hero.heading[0]} <br className="max-md:hidden" />
                {hero.heading[1]}
              </h1>
              <p className="max-w-md text-neutral-500 md:text-white/90 text-body">{hero.intro}</p>
            </div>

            {/* Phones: solid and outline buttons on white */}
            <div className="mt-1 flex items-center gap-2 md:hidden">
              <Button size="xl" nativeButton={false} render={<Link href={hero.primary.href} />} className="flex-1">
                {hero.primary.label}
              </Button>
              <Button variant="outline" size="xl" nativeButton={false} render={<Link href={hero.secondary.href} />} className="flex-1">
                {hero.secondary.label}
              </Button>
            </div>
            {/* Tablet and up: white and glass buttons on the photo */}
            <div className="mt-4 hidden flex-wrap items-center gap-3 md:flex">
              <Button variant="inverse" size="xl" nativeButton={false} render={<Link href={hero.primary.href} />}>
                {hero.primary.label}
              </Button>
              <Button variant="glass" size="xl" nativeButton={false} render={<Link href={hero.secondary.href} />}>
                {hero.secondary.label}
              </Button>
            </div>
          </div>

          {/* Phones: a plain list with hairline dividers. Tablet and up: one row on the photo. */}
          <ul className="mt-6 divide-y divide-neutral-100 border-y border-neutral-100 md:mt-0 md:flex md:divide-x md:divide-y-0 md:divide-white/20 md:border-0">
            {hero.highlights.map((item) => (
              <li key={item.title} className="flex items-baseline justify-between gap-3 py-3 text-caption md:flex-col md:justify-start md:gap-0.5 md:px-6 md:py-0 md:first:pl-0">
                <span className="text-neutral-950 md:text-white">{item.title}</span>
                <span className="text-right text-neutral-500 md:text-left md:text-white/65">{item.detail}</span>
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

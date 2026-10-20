import type { Metadata } from "next"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { container, focusRing, pageTop } from "@/lib/styles"
import { notFoundCopy as copy } from "@/lib/data/site"
import { SiteFrame } from "@/components/site/site-frame"

export const metadata: Metadata = { title: copy.title }

export default function NotFound() {
  return (
    <SiteFrame>
      <main className={cn(container, pageTop, "pb-16 md:pb-24")}>
        <p className="text-neutral-500 tabular-nums text-caption">{copy.label}</p>
        <h1 className="mt-3 max-w-[12em] text-balance text-neutral-950 text-display">{copy.heading}</h1>
        <p className="mt-5 max-w-lg text-pretty text-neutral-500 text-lead">{copy.body}</p>

        <ul className="mt-12 grid border-t border-neutral-200 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {copy.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn("group flex items-center justify-between gap-4 border-b border-neutral-200 py-5", focusRing.dark)}
              >
                <span>
                  <span className="block text-neutral-950 text-lead">{link.label}</span>
                  <span className="block text-neutral-500 text-caption">{link.hint}</span>
                </span>
                <HugeiconsIcon aria-hidden="true"
                  icon={ArrowRight01Icon}
                  strokeWidth={1.8}
                  className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-950"
                />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </SiteFrame>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { container, pageTop } from "@/lib/styles"
import { routeErrorCopy as copy } from "@/lib/data/site"
import { Button } from "@/components/ui/button"

/** Error boundary body for the public pages (their error.tsx files re-export it). */
export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  React.useEffect(() => {
    // Send this to your error reporting service.
    console.error(error)
  }, [error])

  return (
    <main className={cn(container, pageTop, "flex-1 pb-16 md:pb-24")}>
      <p className="text-neutral-500 text-caption">{copy.label}</p>
      <h1 className="mt-3 max-w-[12em] text-balance text-neutral-950 text-display">{copy.heading}</h1>
      <p className="mt-5 max-w-lg text-pretty text-neutral-500 text-lead">{copy.body}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="xl" onClick={() => retry()}>
          {copy.retry}
        </Button>
        <Button variant="outline" size="xl" nativeButton={false} render={<Link href={copy.home.href} />}>
          {copy.home.label}
        </Button>
      </div>
    </main>
  )
}

"use client"

import Link from "next/link"

import { portalCopy } from "@/lib/data/portal"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/portal/status-parts"

/** Shared error boundary body for every portal page; the sidebar and top bar stay in place. */
export default function PortalRouteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const c = portalCopy.error
  return (
    <EmptyState>
      <h1 className="text-neutral-950 text-title">{c.title}</h1>
      <p className="mt-2 max-w-md">{c.text}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Button size="lg" className="rounded-full px-5 text-caption" onClick={retry}>
          {c.retry}
        </Button>
        <Button nativeButton={false} render={<Link href={c.back.href} />} size="lg" variant="outline" className="rounded-full px-5 text-caption">
          {c.back.label}
        </Button>
      </div>
    </EmptyState>
  )
}

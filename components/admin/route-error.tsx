"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { adminCopy } from "@/lib/data/admin"
import { ErrorState } from "@/components/admin/ui"

/** Shared error boundary body for every admin route (error.tsx files re-export it). */
export default function AdminRouteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <ErrorState title={adminCopy.error.title} text={adminCopy.error.text} onRetry={retry} />
      <Link href="/admin" className={cn("rounded-sm text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-950 text-caption", focusRing.dark)}>
        {adminCopy.error.back}
      </Link>
    </div>
  )
}

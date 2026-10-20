"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockIcon } from "@hugeicons/core-free-icons"

import { useSession } from "@/lib/session-client"
import { useMounted } from "@/hooks/use-mounted"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/** True only for the admin role. Front desk gets read-only controls (doctors can't open settings). */
export function useIsAdmin() {
  const role = useSession()?.role
  const mounted = useMounted()
  return !mounted || role === "admin"
}

/**
 * Wraps a disabled control in a focusable span with a tooltip saying why it's disabled
 * (disabled buttons don't receive pointer or focus events themselves).
 */
export function Locked({ locked, reason, children, className }: { locked: boolean; reason: string; children: React.ReactNode; className?: string }) {
  if (!locked) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className={className ?? "inline-flex cursor-not-allowed rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"} />}>
        {children}
        <span className="sr-only">{reason}</span>
      </TooltipTrigger>
      <TooltipContent>
        <HugeiconsIcon icon={LockIcon} strokeWidth={1.8} className="size-3.5" />
        {reason}
      </TooltipContent>
    </Tooltip>
  )
}

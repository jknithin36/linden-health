"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { portalCopy, sectionForPath } from "@/lib/data/portal"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PortalSidebar } from "@/components/portal/portal-sidebar"

/** Portal frame: a flat white layout, the sidebar divided from the page by a single hairline.
 * Collapsing the sidebar shrinks it to a 64px icon rail with tooltips. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={150}>
      <SidebarProvider
        className="bg-white [--sidebar:var(--color-white)]"
        style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
      >
        <PortalSidebar />
        <SidebarInset className="min-w-0 bg-white">
          <PortalTopbar />
          {/* Fills whatever the sidebar leaves, so the page widens when the sidebar collapses (capped for very wide screens). */}
          <div id="main" tabIndex={-1} className="w-full max-w-[1600px] flex-1 px-5 pt-8 pb-16 outline-none md:px-10 md:pt-10">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function PortalTopbar() {
  const section = sectionForPath(usePathname())
  return (
    <header data-portal-topbar className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200/70 bg-white/90 px-3 backdrop-blur-md md:px-6">
      <SidebarTrigger aria-label={portalCopy.toggle} className="size-10 rounded-lg text-neutral-500 md:size-9 hover:bg-neutral-100 hover:text-neutral-950 [&_svg]:size-[18px]" />
      <span aria-hidden="true" className="h-5 w-px bg-neutral-200" />
      <p className="min-w-0 flex-1 truncate text-neutral-950 text-body">{section.label}</p>
      {/* Pages with their own "Book a visit" in the header skip the top bar one. */}
      {section.id !== "overview" && section.id !== "visits" && (
        <Button nativeButton={false} render={<Link href={portalCopy.book.href} />} className="h-9 rounded-full px-4 text-caption">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          {portalCopy.book.label}
        </Button>
      )}
    </header>
  )
}

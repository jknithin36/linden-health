"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  File01Icon,
  Logout01Icon,
  Medicine02Icon,
  Message01Icon,
  Settings01Icon,
  TestTube01Icon,
  UnfoldMoreIcon,
  UserGroupIcon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { portalCopy, portalNav, portalUser, sectionForPath, type PortalBadge, type PortalBadgeTone, type PortalIcon, type PortalSection } from "@/lib/data/portal"
import { LindenMark } from "@/components/site/icons"
import { signInAndGo } from "@/lib/session-client"
import { useUnseenResultCount } from "@/lib/seen-results"
import { useUnreadThreadCount } from "@/lib/read-messages"
import { usePayments } from "@/lib/payments"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const icons: Record<PortalIcon, IconSvgElement> = {
  overview: DashboardSquare01Icon,
  visits: Calendar03Icon,
  results: TestTube01Icon,
  prescriptions: Medicine02Icon,
  records: File01Icon,
  messages: Message01Icon,
  billing: CreditCardIcon,
  family: UserGroupIcon,
  settings: Settings01Icon,
}

const badgeTone: Record<PortalBadgeTone, string> = {
  new: "bg-emerald-50 px-2 text-emerald-700",
  count: "min-w-5 bg-neutral-950 px-1.5 text-white peer-data-active/menu-button:text-white peer-hover/menu-button:text-white",
  due: "bg-amber-50 px-2 text-amber-800",
}

/** The same badges, shrunk to a dot on the icon when the sidebar is collapsed to its icon rail.
 * Rail-only styles are written as literal `group-data-[collapsible=icon]:` classes so Tailwind can see them.
 *
 * Collapsing keeps every icon, the logo and the avatar at the same x position, so the rail just slides
 * shut over them: labels fade and clip instead of jumping, and nothing re-centres mid-animation. */
const dotTone: Record<PortalBadgeTone, string> = {
  new: "bg-emerald-500",
  count: "bg-neutral-950",
  due: "bg-amber-500",
}

/** Shared look for every nav row: quiet by default, a soft grey fill when active. No borders or shadows. */
const navButton = cn(
  // 40px rows in the phone sheet (touch), 36px on desktop.
  "relative h-10 gap-3 rounded-lg px-2.5 text-neutral-600 transition-colors md:h-9 [&_svg]:size-[18px]",
  "group-data-[collapsible=icon]:h-9! group-data-[collapsible=icon]:w-9! group-data-[collapsible=icon]:px-2.5!",
  "hover:bg-neutral-100/70 hover:text-neutral-950 active:bg-neutral-100",
  "data-active:bg-neutral-100 data-active:text-neutral-950",
  "focus-visible:ring-2 focus-visible:ring-neutral-950"
)

export function PortalSidebar() {
  const pathname = usePathname()
  const active = sectionForPath(pathname)
  const { isMobile, setOpenMobile, state } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  const unseen = useUnseenResultCount()
  const unreadThreads = useUnreadThreadCount()
  const { remaining } = usePayments()
  // Results, Messages and Billing badges follow what this visitor has opened, read or paid.
  const live: Partial<Record<PortalIcon, Omit<PortalBadge, "tone"> | null>> = {
    results: unseen ? portalCopy.badges.results(unseen) : null,
    messages: unreadThreads ? portalCopy.badges.messages(unreadThreads) : null,
    billing: remaining ? portalCopy.badges.billing(remaining) : null,
  }
  const badgeFor = (nav: PortalSection): PortalBadge | null => {
    const text = nav.badge && live[nav.id]
    return nav.badge && text ? { ...text, tone: nav.badge } : null
  }
  // On phones the sidebar is a sheet: close it once a link is chosen.
  const closeOnMobile = () => isMobile && setOpenMobile(false)

  return (
    <Sidebar variant="sidebar" collapsible="icon" aria-label={portalCopy.navLabel} className="border-neutral-200/70">
      <SidebarHeader className="h-16 shrink-0 justify-center border-b border-neutral-200/70 px-[18px]">
        <Link
          href="/portal"
          aria-label={portalCopy.homeLabel}
          onClick={closeOnMobile}
          className={cn("relative flex h-7 items-center self-start rounded-sm", focusRing.dark)}
        >
          <Image src={site.logo.dark} alt="" width={site.logo.width} height={site.logo.height} preload className="h-6 w-auto transition-opacity duration-100 ease-out group-data-[collapsible=icon]:opacity-0" />
          <LindenMark className="absolute top-0 left-0 size-7 opacity-0 transition-opacity duration-150 ease-in group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:delay-100" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1.5 pt-2">
        {portalNav.map((group, i) => (
          <SidebarGroup key={group.label ?? i} className="py-2">
            {group.label && <SidebarGroupLabel className="h-7 px-2.5 text-neutral-400 text-caption">{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const badge = badgeFor(item)
                  const isActive = item.id === active.id
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} aria-current={isActive ? "page" : undefined} onClick={closeOnMobile} />}
                        tooltip={badge ? `${item.label} · ${badge.label}` : item.label}
                        className={cn(navButton, "text-body")}
                      >
                        <HugeiconsIcon icon={icons[item.icon]} strokeWidth={1.7} />
                        {badge && (
                          <span
                            aria-hidden="true"
                            className={cn("absolute top-2 right-2 size-2 rounded-full opacity-0 ring-2 ring-white transition-opacity duration-200 group-data-[collapsible=icon]:opacity-100", dotTone[badge.tone])}
                          />
                        )}
                        <span className="whitespace-nowrap transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">{item.label}</span>
                        {badge && <span className="sr-only">{`, ${badge.srLabel}`}</span>}
                      </SidebarMenuButton>
                      {badge && (
                        <SidebarMenuBadge
                          aria-hidden="true"
                          className={cn("top-1/2! right-2 h-5 -translate-y-1/2 rounded-full text-micro", badgeTone[badge.tone])}
                        >
                          {badge.label}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200/70 p-2">
        <AccountMenu onNavigate={closeOnMobile} collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  )
}

function AccountMenu({ onNavigate, collapsed }: { onNavigate: () => void; collapsed: boolean }) {
  const a = portalCopy.account
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={a.label}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none",
          "overflow-hidden",
          "hover:bg-neutral-100/70 focus-visible:ring-2 focus-visible:ring-neutral-950 data-popup-open:bg-neutral-100"
        )}
      >
        <Image src={portalUser.avatar} alt="" width={64} height={64} className="size-8 shrink-0 rounded-full bg-violet-100 object-cover" />
        <span className="min-w-0 flex-1 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">
          <span className="block truncate text-neutral-950 text-body">{portalUser.name}</span>
          <span className="block truncate text-neutral-500 text-caption">{portalUser.email}</span>
        </span>
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={1.8} className="size-4 shrink-0 text-neutral-400 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        sideOffset={8}
        className="w-(--anchor-width) min-w-56 rounded-2xl p-1.5"
      >
        <DropdownMenuItem render={<Link href={a.settings.href} onClick={onNavigate} />} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
          <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.7} className="size-4" />
          {a.settings.label}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={a.website.href} />} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={1.7} className="size-4" />
          {a.website.label}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem onClick={() => signInAndGo(null, a.logout.href)} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.7} className="size-4" />
          {a.logout.label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

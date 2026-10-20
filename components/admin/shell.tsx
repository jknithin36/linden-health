"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Analytics01Icon,
  ArrowUpRight01Icon,
  Calendar03Icon,
  DashboardSquare01Icon,
  Invoice01Icon,
  Logout01Icon,
  Message01Icon,
  QueueIcon,
  Search01Icon,
  Settings01Icon,
  Stethoscope02Icon,
  TableIcon,
  UnfoldMoreIcon,
  UserIcon,
  UserMultiple02Icon,
  Location01Icon,
  Tick02Icon,
  CalendarCheckIn01Icon,
  InboxIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { adminCopy } from "@/lib/data/admin"
import { activeNavItem, doctorNav, navFor, type DashboardNavId } from "@/lib/nav/dashboard"
import { canAccess, sessionUsers, type Session, type SessionRole } from "@/lib/session"
import { signInAndGo, useSession } from "@/lib/session-client"
import { inboxNeedsReview } from "@/lib/admin/doctor"
import { fmtDate, fmtTime, TODAY } from "@/lib/admin/format"
import { allAppointments, allRefills, allThreads, clinics, getClinicSync, getDoctorSync, getPatientSync, getStaffSync, globalSearch } from "@/lib/admin/queries"
import { setClinic } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import { LindenMark } from "@/components/site/icons"
import { useMounted } from "@/hooks/use-mounted"
import { Avatar, notify, patientPhoto } from "@/components/admin/ui"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const icons: Record<DashboardNavId, IconSvgElement> = {
  overview: DashboardSquare01Icon,
  schedule: Calendar03Icon,
  queue: QueueIcon,
  appointments: TableIcon,
  patients: UserMultiple02Icon,
  doctors: Stethoscope02Icon,
  messages: Message01Icon,
  billing: Invoice01Icon,
  reports: Analytics01Icon,
  settings: Settings01Icon,
  "my-day": CalendarCheckIn01Icon,
  inbox: InboxIcon,
  "my-patients": UserIcon,
  "my-schedule": Clock01Icon,
  "my-messages": Message01Icon,
}


const navButton = cn(
  "relative h-9 gap-3 rounded-lg px-2.5 text-neutral-600 transition-colors [&_svg]:size-[18px]",
  "group-data-[collapsible=icon]:h-9! group-data-[collapsible=icon]:w-9! group-data-[collapsible=icon]:px-2.5!",
  "hover:bg-neutral-100/70 hover:text-neutral-950 active:bg-neutral-100",
  "data-active:bg-neutral-100 data-active:text-neutral-950",
  "focus-visible:ring-2 focus-visible:ring-neutral-950"
)

/**
 * Admin frame: same flat sidebar as the patient portal, a top bar with clinic and search, and the demo footer.
 * The sidebar comes from the layout, which reads the session cookie on the server and picks the role's nav.
 */
export function AdminShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const session = useSession()
  const pathname = usePathname()
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <TooltipProvider delay={150}>
      <DeniedNotice pathname={pathname} />
      <SidebarProvider className="bg-white [--sidebar:var(--color-white)]" style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
        {sidebar}
        {/* SidebarInset is the page's <main> landmark; #main (the root layout's skip-link target) skips past the top bar. */}
        <SidebarInset className="min-w-0 bg-white">
          <AdminTopbar onSearch={() => setSearchOpen(true)} role={session?.role ?? null} />
          <div id="main" tabIndex={-1} className="flex w-full max-w-[1600px] flex-1 flex-col px-5 pt-8 pb-10 outline-none md:px-8 md:pt-9">
            <div className="flex-1">{children}</div>
            <p className="mt-14 text-neutral-400 text-micro">{session?.role === "doctor" ? adminCopy.doctorFooter : adminCopy.footer}</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
    </TooltipProvider>
  )
}

/** The proxy sends a role away from pages it can't open with ?denied=1; say so once, then tidy the URL. */
function DeniedNotice({ pathname }: { pathname: string }) {
  React.useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("denied") !== "1") return
    notify.error(adminCopy.denied)
    url.searchParams.delete("denied")
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
  }, [pathname])
  return null
}

function useNavCounts(session: Session | null) {
  const mounted = useMounted()
  useAdminState((s) => s.version)
  if (!mounted || !session) return {} as Partial<Record<DashboardNavId, number>>
  if (session.role === "doctor") {
    return {
      inbox: inboxNeedsReview(session.doctorId),
      "my-messages": allThreads().filter((t) => t.assignedToId === session.staffId && t.unread).length,
    } as Partial<Record<DashboardNavId, number>>
  }
  const waiting = allAppointments().filter((a) => a.start.startsWith(TODAY) && (a.status === "arrived" || a.status === "checked-in" || a.status === "waiting")).length
  const unread = allThreads().filter((t) => t.unread).length + allRefills().filter((r) => r.status === "new").length
  return { queue: waiting, messages: unread } as Partial<Record<DashboardNavId, number>>
}

/**
 * Placeholder while the session streams in (and for the first client render): a plain block the
 * width of the sidebar, hidden on phones. It renders the same on server and client, so the
 * sidebar never mismatches on hydration (the real one switches to a sheet on mobile).
 */
export function AdminSidebarSkeleton() {
  return (
    <div aria-hidden="true" className="hidden w-(--sidebar-width) shrink-0 border-r border-neutral-200/70 md:block">
      <div className="flex h-16 items-center border-b border-neutral-200/70 px-[18px]">
        <Image src={site.logo.dark} alt="" width={site.logo.width} height={site.logo.height} preload className="h-6 w-auto" />
      </div>
      <div className="flex flex-col gap-2 px-3.5 pt-5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function AdminSidebar({ session }: { session: Session | null }) {
  const mounted = useMounted()
  if (!mounted) return <AdminSidebarSkeleton />
  return <AdminSidebarInner session={session} />
}

function AdminSidebarInner({ session }: { session: Session | null }) {
  const pathname = usePathname()
  const groups = navFor(session?.role ?? null)
  const active = activeNavItem(groups, pathname)
  const { isMobile, setOpenMobile, state } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  const counts = useNavCounts(session)
  const closeOnMobile = () => isMobile && setOpenMobile(false)
  const home = session?.home ?? "/admin"
  const doctor = session?.doctorId ? getDoctorSync(session.doctorId) : null

  return (
    <Sidebar variant="sidebar" collapsible="icon" aria-label={adminCopy.navLabel} className="border-neutral-200/70">
      <SidebarHeader className="h-16 shrink-0 justify-center border-b border-neutral-200/70 px-[18px]">
        <Link href={home} aria-label={adminCopy.homeLabel} onClick={closeOnMobile} className={cn("relative flex h-7 items-center gap-2 self-start rounded-sm", focusRing.dark)}>
          <Image src={site.logo.dark} alt="" width={site.logo.width} height={site.logo.height} preload className="h-6 w-auto transition-opacity duration-100 ease-out group-data-[collapsible=icon]:opacity-0" />
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 whitespace-nowrap text-neutral-600 transition-opacity duration-100 group-data-[collapsible=icon]:opacity-0 text-micro">{doctor ? "Doctor" : "Admin"}</span>
          <LindenMark className="absolute top-0 left-0 size-7 opacity-0 transition-opacity duration-150 ease-in group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:delay-100" />
        </Link>
      </SidebarHeader>

      {doctor && (
        <div className="flex items-center gap-3 border-b border-neutral-200/70 px-[14px] py-3.5">
          <Avatar name={doctor.name} id={doctor.id} src={doctor.avatar} eager className="size-9" />
          <span className="min-w-0 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">
            <span className="block truncate text-neutral-950 text-body">
              {doctor.name}, {doctor.credential}
            </span>
            <span className="block truncate text-neutral-500 text-micro">
              {doctor.specialty} · {getClinicSync(doctor.clinicIds[0]).name}
            </span>
          </span>
        </div>
      )}

      <SidebarContent className="gap-0 px-1.5 pt-2">
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? i} className="py-1.5">
            {group.label && <SidebarGroupLabel className="h-7 px-2.5 text-neutral-400 text-caption">{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const isActive = item.id === active?.id
                  const n = counts[item.id]
                  const what = item.id === "queue" ? "waiting" : item.id === "inbox" ? "to review" : "unread"
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} aria-current={isActive ? "page" : undefined} onClick={closeOnMobile} />}
                        tooltip={n ? `${item.label} · ${n}` : item.label}
                        className={cn(navButton, "text-body")}
                      >
                        <HugeiconsIcon icon={icons[item.id]} strokeWidth={1.7} aria-hidden="true" />
                        {!!n && <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-neutral-950 opacity-0 ring-2 ring-white transition-opacity duration-200 group-data-[collapsible=icon]:opacity-100" />}
                        <span className="whitespace-nowrap transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">{item.label}</span>
                        {!!n && <span className="sr-only">{`, ${n} ${what}`}</span>}
                      </SidebarMenuButton>
                      {!!n && (
                        <SidebarMenuBadge aria-hidden="true" className="top-1/2! right-2 h-5 min-w-5 -translate-y-1/2 rounded-full bg-neutral-950 px-1.5 text-white tabular-nums peer-hover/menu-button:text-white peer-data-active/menu-button:text-white text-micro">
                          {n}
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
        <AccountMenu session={session} collapsed={collapsed} onNavigate={closeOnMobile} />
      </SidebarFooter>
    </Sidebar>
  )
}

function AccountMenu({ session, collapsed, onNavigate }: { session: Session | null; collapsed: boolean; onNavigate: () => void }) {
  const a = adminCopy.account
  const role = session?.role ?? "admin"
  const me = getStaffSync(session?.staffId ?? "s-taylor")!
  const doctor = session?.doctorId ? getDoctorSync(session.doctorId) : null
  const switchTo = (next: SessionRole) => signInAndGo(next, sessionUsers[next].home)
  const logOut = () => signInAndGo(null, a.logout.href)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={a.label}
        className="flex w-full items-center gap-3 overflow-hidden rounded-lg p-2 text-left transition-colors outline-none hover:bg-neutral-100/70 focus-visible:ring-2 focus-visible:ring-neutral-950 data-popup-open:bg-neutral-100"
      >
        <Avatar name={me.name} id={me.id} src={doctor?.avatar} />
        <span className="min-w-0 flex-1 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">
          <span className="block truncate text-neutral-950 text-body">{me.name}</span>
          <span className="block truncate text-neutral-500 text-caption">
            {adminCopy.roles.find((r) => r.value === role)?.label} · {me.title}
          </span>
        </span>
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={1.8} aria-hidden="true" className="size-4 shrink-0 text-neutral-400 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} sideOffset={8} className="w-(--anchor-width) min-w-60 rounded-2xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 text-neutral-400 text-micro">{a.role}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={role} onValueChange={(v) => switchTo(v as SessionRole)}>
            {adminCopy.roles.map((r) => (
              <DropdownMenuRadioItem key={r.value} value={r.value} className="rounded-xl px-2.5 py-1.5 text-caption">
                <span className="flex flex-col">
                  {r.label}
                  <span className="text-neutral-400 text-micro">{sessionUsers[r.value as SessionRole].name}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        {role !== "doctor" && (
          <DropdownMenuItem render={<Link href="/admin/settings" onClick={onNavigate} />} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
            Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href={a.portal.href} />} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
          <HugeiconsIcon icon={UserIcon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
          {a.portal.label}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={a.website.href} />} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
          {a.website.label}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem onClick={logOut} className="gap-2.5 rounded-xl px-2.5 py-2 text-body">
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.7} aria-hidden="true" className="size-4" />
          {a.logout.label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminTopbar({ onSearch, role }: { onSearch: () => void; role: SessionRole | null }) {
  const section = activeNavItem(navFor(role), usePathname())
  const clinic = useAdminState((s) => s.clinic)
  const label = clinic === "all" ? adminCopy.allClinics : clinics.find((c) => c.id === clinic)!.short
  return (
    <header data-print-hide className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200/70 bg-white/90 px-3 backdrop-blur-md md:px-6">
      <SidebarTrigger aria-label={adminCopy.toggle} className="size-9 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 [&_svg]:size-[18px]" />
      <span aria-hidden="true" className="h-5 w-px bg-neutral-200" />
      <p className="hidden min-w-0 truncate text-neutral-950 sm:block text-body">{section?.label ?? ""}</p>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onSearch}
          aria-label={`${adminCopy.search.label} (${adminCopy.search.shortcut})`}
          className="flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 text-neutral-500 transition-colors outline-none hover:border-neutral-300 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-950 md:w-72 text-caption"
        >
          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4" />
          <span className="hidden flex-1 text-left md:block">{adminCopy.search.label}</span>
          <Kbd className="hidden md:inline-flex">{adminCopy.search.shortcut}</Kbd>
        </button>

        {/* Doctors have no clinic switcher. Until the session is read (first render) it holds its space invisibly, so it neither flashes for doctors nor pops in for staff. */}
        {role !== "doctor" && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${adminCopy.clinicLabel}: ${label}`}
            aria-hidden={role ? undefined : true}
            className={cn("flex h-9 items-center gap-2 rounded-full bg-neutral-100 px-3.5 text-neutral-800 transition-colors outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-950 data-popup-open:bg-neutral-200 text-caption", !role && "invisible")}
          >
            <HugeiconsIcon icon={Location01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-neutral-500" />
            <span className="max-sm:sr-only">{label}</span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={1.8} aria-hidden="true" className="size-3.5 text-neutral-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2.5 text-neutral-400 text-micro">{adminCopy.clinicLabel}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={clinic} onValueChange={(v) => setClinic(v as typeof clinic)}>
                <DropdownMenuRadioItem value="all" className="rounded-xl px-2.5 py-2 text-caption">
                  {adminCopy.allClinics}
                </DropdownMenuRadioItem>
                {clinics.map((c) => (
                  <DropdownMenuRadioItem key={c.id} value={c.id} className="rounded-xl px-2.5 py-2 text-caption">
                    <span className="flex flex-col">
                      {c.name}
                      <span className="text-neutral-400 text-micro">{c.rooms} rooms</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>
    </header>
  )
}

/* ------------------------------ Command palette ---------------------------- */

type SearchResult = Awaited<ReturnType<typeof globalSearch>>

/** Doctor pages for the palette (the admin page list is for admin and front desk). */
const doctorPages = doctorNav.flatMap((g) => g.items).map((i) => ({ label: i.label, href: i.href }))

function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const session = useSession()
  const [q, setQ] = React.useState("")
  const [raw, setRes] = React.useState<SearchResult | null>(null)
  // Only offer what this role can open: doctors don't see claims, the doctor directory or admin-only pages,
  // and their appointment results are their own visits (opened in the visit note, not the admin table).
  const role = session?.role ?? "admin"
  const doctor = role === "doctor"
  const res: SearchResult | null = raw && {
    ...raw,
    appointments: doctor ? raw.appointments.filter((a) => a.doctorId === session?.doctorId) : raw.appointments,
    claims: canAccess(role, "/admin/billing") ? raw.claims : [],
    doctors: canAccess(role, "/admin/doctors") ? raw.doctors : [],
    pages: doctor ? doctorPages.filter((p) => !q.trim() || p.label.toLowerCase().includes(q.trim().toLowerCase())) : raw.pages.filter((p) => canAccess(role, p.href)),
  }

  React.useEffect(() => {
    if (!open) return
    let live = true
    const t = setTimeout(() => globalSearch(q).then((r) => live && setRes(r)), 150)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [q, open])

  const go = (href: string) => {
    onOpenChange(false)
    setQ("")
    router.push(href)
  }

  const item = "gap-3 rounded-xl px-3 py-2 text-caption"
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={adminCopy.search.label} description={adminCopy.search.placeholder} className="sm:max-w-xl">
      {/* Results come from the query, so cmdk's own filtering is off. */}
      <Command shouldFilter={false} className="rounded-none p-1">
        <CommandInput value={q} onValueChange={setQ} placeholder={adminCopy.search.placeholder} className="text-caption" />
        <CommandList className="max-h-96 p-1.5">
          <CommandEmpty className="px-6 py-10 text-neutral-500 text-caption">{adminCopy.search.empty}</CommandEmpty>
          {res?.patients.length ? (
            <CommandGroup heading="Patients">
              {res.patients.map((p) => (
                <CommandItem key={p.id} value={`patient-${p.id}`} onSelect={() => go(`/admin/patients/${p.id}`)} className={item}>
                  <Avatar name={p.name} id={p.id} src={patientPhoto(p)} className="size-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-neutral-950">{p.name}</span>
                    <span className="block truncate text-neutral-500 tabular-nums text-micro">
                      {p.mrn} · DOB {p.dob.slice(5, 7)}/{p.dob.slice(8, 10)}/{p.dob.slice(0, 4)} · {p.phone}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {res?.appointments.length ? (
            <CommandGroup heading="Appointments">
              {res.appointments.map((a) => (
                <CommandItem key={a.id} value={`appt-${a.id}`} onSelect={() => go(doctor ? `/admin/visit/${a.id}` : `/admin/appointments?open=${a.id}`)} className={item}>
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.7} aria-hidden="true" className="size-4 text-neutral-500" />
                  <span className="min-w-0 flex-1 truncate">
                    {getPatientSync(a.patientId)?.name} <span className="text-neutral-500">· {fmtDate(a.start)} · {fmtTime(a.start)} · {a.reason}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {res?.claims.length ? (
            <CommandGroup heading="Claims">
              {res.claims.map((c) => (
                <CommandItem key={c.id} value={`claim-${c.id}`} onSelect={() => go(`/admin/billing?q=${c.claimNumber}`)} className={item}>
                  <HugeiconsIcon icon={Invoice01Icon} strokeWidth={1.7} aria-hidden="true" className="size-4 text-neutral-500" />
                  <span className="tabular-nums">{c.claimNumber}</span>
                  <span className="text-neutral-500 capitalize">{c.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {res?.doctors.length ? (
            <CommandGroup heading="Doctors">
              {res.doctors.map((d) => (
                <CommandItem key={d.id} value={`doctor-${d.id}`} onSelect={() => go(`/admin/doctors/${d.id}`)} className={item}>
                  <Avatar name={d.name} id={d.id} src={d.avatar} className="size-7" />
                  <span className="truncate">{d.name}</span>
                  <span className="truncate text-neutral-500">{d.specialty}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {res?.pages.length ? (
            <CommandGroup heading="Pages">
              {res.pages.map((p) => (
                <CommandItem key={p.href} value={`page-${p.href}`} onSelect={() => go(p.href)} className={item}>
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={1.7} aria-hidden="true" className="size-4 text-neutral-300" />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

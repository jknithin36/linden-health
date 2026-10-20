import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CreditCardIcon,
  InjectionIcon,
  Location01Icon,
  Medicine02Icon,
  Navigation03Icon,
  StethoscopeIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import {
  overviewCopy as copy,
  personById,
  portalToday,
  portalUser,
  recentResults,
  tasks,
  upcomingVisit as visit,
  type Tone,
} from "@/lib/data/portal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FamilyStrip } from "@/components/portal/family-strip"
import { Greeting } from "@/components/portal/greeting"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { MessagesPanel } from "@/components/portal/messages-panel"
import { BillingPanel } from "@/components/portal/billing-panel"
import { HealthSnapshot } from "@/components/portal/health-snapshot"
import { HalfDot } from "@/components/portal/status-parts"
import { panel } from "@/components/portal/styles"

/* ----------------------------------------------------------------------------
 * Shared pieces
 * ------------------------------------------------------------------------- */


function Panel({
  id,
  title,
  aside,
  className,
  children,
}: {
  id: string
  title: React.ReactNode
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className={cn(panel, "p-5 md:p-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={id} className="text-neutral-950 text-body">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center gap-1 rounded-sm text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}
    >
      {children}
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="size-3.5" />
    </Link>
  )
}

function Initials({ children, className }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700 text-caption", className)}>
      {children}
    </span>
  )
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")

const dot: Record<Tone, string> = { attention: "bg-amber-500", normal: "bg-neutral-300" }

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function PortalOverview() {
  return (
    <div className="flex flex-col gap-6">
      <Header />
      <div className="grid gap-6 lg:grid-cols-12">
        {/* The last panel in each column grows, so both columns end on the same line. */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8 [&>*:last-child]:flex-1">
          <UpNext />
          <NeedsAttention />
          <RecentResults />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4 [&>*:last-child]:flex-1">
          <BillingPanel />
          <MessagesPanel />
          <HealthSnapshot />
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-balance text-neutral-950 text-heading">
          <span aria-hidden="true" className="mr-3 inline-block origin-[70%_80%] motion-safe:animate-wave">
            👋
          </span>
          <Greeting name={portalUser.firstName} />
        </h1>
        <p className="mt-2 text-pretty text-neutral-500 text-body">
          {portalToday.label} · {copy.intro}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <FamilyStrip />
        <Button nativeButton={false} render={<Link href={copy.book.href} />} size="lg" className="rounded-full px-5 text-caption">
          {copy.book.label}
        </Button>
      </div>
    </header>
  )
}

/* ---------------------------------- Up next --------------------------------- */

const statusIcon = {
  done: <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4 text-emerald-600" />,
  pending: <HalfDot className="size-3.5" />,
  info: <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-4 text-neutral-400" />,
}

function UpNext() {
  return (
    <section aria-labelledby="up-next" className={cn(panel, "overflow-hidden")}>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-neutral-500 text-caption">{copy.upNext.heading}</span>
          <Badge className="h-6 gap-1.5 bg-emerald-50 px-2.5 text-emerald-800">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} data-icon="inline-start" />
            {visit.label} · {visit.when}
          </Badge>
        </div>
        <h2 id="up-next" className="mt-3 text-neutral-950 text-title">
          {visit.title}
        </h2>
        <p className="mt-1 text-neutral-600 text-body">
          {visit.date} · {visit.time} · {visit.duration}
        </p>

        <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2">
          <Link href={visit.doctor.href} className={cn("flex items-center gap-3 rounded-lg", focusRing.dark)}>
            {visit.doctor.image ? (
              <Image src={visit.doctor.image} alt="" width={80} height={96} className="size-10 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />
            ) : (
              <Initials>{initialsOf(visit.doctor.name)}</Initials>
            )}
            <span className="min-w-0">
              <span className="block text-neutral-950 text-body">{`${visit.doctor.name}, ${visit.doctor.credentials}`}</span>
              <span className="block text-neutral-500 text-caption">{visit.doctor.specialty}</span>
            </span>
          </Link>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={1.7} className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-neutral-950 text-body">{visit.location.name}</span>
              <span className="block text-neutral-500 text-caption">{visit.location.address}</span>
            </span>
          </div>
        </div>

        <dl className="mt-5 flex flex-wrap items-center gap-2.5">
          <dt className="text-neutral-500 text-caption">{copy.upNext.reasonLabel}</dt>
          <dd>
            <Badge className="h-6 gap-1.5 bg-neutral-100 px-2.5 text-neutral-800">
              <HugeiconsIcon icon={StethoscopeIcon} strokeWidth={1.8} data-icon="inline-start" />
              {visit.reason}
            </Badge>
          </dd>
        </dl>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {visit.status.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-neutral-700 text-caption">
              {statusIcon[s.tone]}
              {s.label}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button nativeButton={false} render={<Link href={visit.actions.forms.href} />} size="lg" className="rounded-full px-5 text-caption">
            {visit.actions.forms.label}
          </Button>
          <Button nativeButton={false} render={<Link href={visit.actions.reschedule.href} />} size="lg" variant="outline" className="rounded-full px-5 text-caption">
            {visit.actions.reschedule.label}
          </Button>
          <Button
            nativeButton={false}
            render={<a href={visit.location.directions} target="_blank" rel="noreferrer" />}
            size="lg"
            variant="ghost"
            className="rounded-full px-4 text-caption"
          >
            <HugeiconsIcon icon={Navigation03Icon} strokeWidth={1.8} data-icon="inline-start" />
            {visit.actions.directions.label}
          </Button>
        </div>
      </div>
      <p className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-3.5 text-neutral-600 text-caption md:px-6">{visit.note}</p>
    </section>
  )
}

/* ---------------------------- Needs your attention -------------------------- */

const taskIcon: Record<(typeof tasks)[number]["icon"], IconSvgElement> = {
  forms: Task01Icon,
  refill: Medicine02Icon,
  vaccine: InjectionIcon,
  bill: CreditCardIcon,
}

function NeedsAttention() {
  const c = copy.attention
  return (
    <Panel id="needs-attention" title={c.heading} aside={<PanelLink href={c.href}>{c.viewAll(tasks.length)}</PanelLink>}>
      {/* One line per task. On phones "For" and "Due" fold under the task name. */}
      <Table className="mt-3">
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            <TableHead className="h-9 pl-0 text-neutral-400 text-caption">{c.columns.task}</TableHead>
            <TableHead className="hidden h-9 px-5 text-neutral-400 text-caption sm:table-cell">{c.columns.person}</TableHead>
            <TableHead className="hidden h-9 px-5 text-neutral-400 text-caption sm:table-cell">{c.columns.due}</TableHead>
            <TableHead className="h-9 pr-0 text-right text-neutral-400 text-caption">
              <span className="sr-only">{c.columns.action}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const person = personById(t.personId)
            const when = (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", dot[t.tone])} />
                <span className="sr-only">{t.tone === "attention" ? c.dueSoon : c.later}: </span>
                {t.due}
              </span>
            )
            return (
              <TableRow key={t.id} className="border-neutral-100 hover:bg-neutral-50/70">
                <TableCell className="w-full py-2.5 pl-0 whitespace-normal">
                  <span className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                      <HugeiconsIcon icon={taskIcon[t.icon]} strokeWidth={1.7} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-neutral-950 text-body">{t.title}</span>
                      <span className="flex flex-wrap items-center gap-x-1.5 text-neutral-500 text-caption sm:hidden">
                        {person.firstName} · {when}
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className="hidden px-5 py-2.5 sm:table-cell">
                  <span className="flex items-center gap-2 text-neutral-700 text-caption">
                    <PersonAvatar person={person} className="size-6" />
                    {person.firstName}
                  </span>
                </TableCell>
                <TableCell className="hidden px-5 py-2.5 text-neutral-600 text-caption sm:table-cell">{when}</TableCell>
                <TableCell className="py-2.5 pr-0 text-right">
                  <Button nativeButton={false} render={<Link href={t.action.href} />} variant="outline" size="sm" className="rounded-full px-3 text-caption">
                    {t.action.label}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Panel>
  )
}

/* ------------------------------ Recent results ------------------------------ */

function RecentResults() {
  const r = recentResults
  const c = copy.results
  const person = personById(r.personId)
  const outOfRange = r.total - r.inRange
  return (
    <Panel id="recent-results" title={c.heading} aside={<PanelLink href={c.view.href}>{c.view.label}</PanelLink>}>
      {/* Report header */}
      {/* The badge drops under the title on narrow screens instead of squeezing it. */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 basis-60 items-center gap-3">
          <PersonAvatar person={person} className="size-10" />
          <div className="min-w-0">
            <p className="text-neutral-950 text-title">{r.title}</p>
            <p className="text-neutral-500 text-caption">
              {person.firstName} · {r.date}
            </p>
          </div>
        </div>
        <Badge className="h-6 shrink-0 gap-1.5 bg-emerald-50 px-2.5 text-emerald-800">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} data-icon="inline-start" />
          {r.reviewedBy}
        </Badge>
      </div>

      {/* In range: one segment per test */}
      <div className="mt-6">
        <p className="text-neutral-950 text-body">{c.inRange(r.inRange, r.total)}</p>
        <div role="img" aria-label={c.inRange(r.inRange, r.total)} className="mt-2.5 flex gap-1">
          {Array.from({ length: r.total }, (_, i) => (
            <span key={i} className={cn("h-2 flex-1 rounded-full", i < r.inRange ? "bg-emerald-400" : "bg-amber-400")} />
          ))}
        </div>
      </div>

      {/* Flagged tests, each with a range strip */}
      <h3 className="mt-7 text-neutral-500 text-caption">{c.flaggedHeading(outOfRange)}</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {r.flagged.map((f) => (
          <li key={f.test} className="rounded-xl border border-neutral-200/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-neutral-600 text-caption">{f.test}</p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-micro", flagTone[f.status].chip)}>{f.status}</span>
            </div>
            <p className="mt-1 text-neutral-950 tabular-nums text-title">
              {f.value}
              <span className="text-neutral-400 text-caption"> {f.unit}</span>
            </p>
            <RangeStrip flag={f} />
            <p className="mt-2 text-neutral-400 text-micro">
              {c.normalRange} · {f.range}
            </p>
          </li>
        ))}
      </ul>

      {/* Doctor's note */}
      <figure className="mt-5 flex gap-3 rounded-xl bg-neutral-50 p-4">
        {r.noteImage && <Image src={r.noteImage} alt="" width={72} height={86} className="size-9 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />}
        <div className="min-w-0">
          <figcaption className="text-neutral-500 text-caption">
            {c.noteLabel} · {r.noteBy}
          </figcaption>
          <blockquote className="mt-1 text-pretty text-neutral-800 text-body">“{r.note}”</blockquote>
        </div>
      </figure>
    </Panel>
  )
}

const flagTone = {
  High: { chip: "bg-red-50 text-red-700", marker: "bg-red-500" },
  Low: { chip: "bg-amber-50 text-amber-800", marker: "bg-amber-500" },
} as const

/** Normal band shaded on a track, with a marker where this result falls. */
function RangeStrip({ flag }: { flag: (typeof recentResults.flagged)[number] }) {
  const [min, max] = flag.scale
  const pct = (n: number) => `${((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100}%`
  return (
    <div role="img" aria-label={copy.results.position(flag.test, `${flag.value} ${flag.unit}`, flag.range)} className="relative mt-3 h-2 rounded-full bg-neutral-100">
      <span
        className="absolute inset-y-0 rounded-full bg-emerald-200"
        style={{ left: pct(flag.normal[0]), width: `calc(${pct(flag.normal[1])} - ${pct(flag.normal[0])})` }}
      />
      <span
        className={cn("absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-white", flagTone[flag.status].marker)}
        style={{ left: pct(flag.value) }}
      />
    </div>
  )
}

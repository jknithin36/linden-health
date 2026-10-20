"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { personById } from "@/lib/data/portal"
import { visitDoctor } from "@/lib/data/visits"
import { allTests, flaggedCount, results, RESULTS_TODAY, resultsCopy as copy, type LabResult, type ResultType } from "@/lib/data/results"
import { useSeenResults } from "@/lib/seen-results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilterSelect } from "@/components/site/filter-select"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { PersonFilter, SegmentedFilter, type PersonFilterValue } from "@/components/portal/person-filter"
import { EmptyState } from "@/components/portal/status-parts"
import { panel } from "@/components/portal/styles"

const DAY = 86_400_000
const href = (r: LabResult) => `/portal/results/${r.id}`

function Status({ result, isNew }: { result: LabResult; isNew: boolean }) {
  const flagged = flaggedCount(result)
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {isNew && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-sky-800 text-micro">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-sky-500" />
          {copy.status.new}
        </span>
      )}
      <span className={cn("rounded-full px-2 py-0.5 whitespace-nowrap text-micro", flagged ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800")}>
        {flagged ? copy.status.attention(flagged) : copy.status.normal}
      </span>
    </span>
  )
}

export function ResultsList() {
  const router = useRouter()
  const opened = useSeenResults()
  const [person, setPerson] = React.useState<PersonFilterValue>("all")
  const [type, setType] = React.useState<"all" | ResultType>("all")
  const [range, setRange] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const f = copy.filters

  const q = query.trim().toLowerCase()
  const days = f.dates.find((d) => d.value === range)?.days ?? null
  const today = new Date(RESULTS_TODAY).getTime()
  const rows = results
    .filter((r) => (person === "all" || r.personId === person) && (type === "all" || r.type === type))
    .filter((r) => days === null || today - new Date(r.iso).getTime() <= days * DAY)
    .map((r) => ({ result: r, matches: q ? allTests(r).filter((t) => t.name.toLowerCase().includes(q)).map((t) => t.name) : [] }))
    .filter(({ result, matches }) => !q || matches.length > 0 || result.title.toLowerCase().includes(q))

  const clear = () => {
    setPerson("all")
    setType("all")
    setRange("all")
    setQuery("")
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
        <p className="mt-2 text-pretty text-neutral-500 text-body">{copy.intro}</p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <PersonFilter value={person} onValueChange={setPerson} label={f.person} allLabel={f.allFamily} />
          <label className="relative block w-full lg:w-80">
            <span className="sr-only">{f.search}</span>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={f.searchPlaceholder}
              className="h-11 rounded-full border-neutral-200 bg-white pr-4 pl-10 hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 text-body"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedFilter value={type} onValueChange={setType} options={f.types} label={f.type} />
          <FilterSelect ariaLabel={f.dateLabel} value={range} onValueChange={setRange} options={f.dates} className="h-10 data-[size=default]:h-10 sm:min-w-40" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState>
          <p>{copy.empty.text}</p>
          <Button variant="outline" size="lg" className="mt-4 rounded-full px-5 text-caption" onClick={clear}>
            {copy.empty.clear}
          </Button>
        </EmptyState>
      ) : (
        <div className={cn(panel, "px-5 py-2 md:px-6")}>
          {/* Desktop table: the whole row opens the result */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow className="border-neutral-100 hover:bg-transparent">
                {[copy.columns.date, copy.columns.patient, copy.columns.test, copy.columns.orderedBy, copy.columns.status].map((h, i) => (
                  <TableHead key={h} className={cn("h-11 text-neutral-400 text-caption", i === 0 && "pl-0")}>
                    {h}
                  </TableHead>
                ))}
                <TableHead className="h-11 w-6 pr-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ result: r, matches }) => {
                const p = personById(r.personId)
                const isNew = !!r.isNew && !opened.has(r.id)
                return (
                  <TableRow key={r.id} onClick={() => router.push(href(r))} className="cursor-pointer border-neutral-100 hover:bg-neutral-50/70">
                    <TableCell className="py-3.5 pl-0 text-neutral-600 tabular-nums text-caption">{r.date}</TableCell>
                    <TableCell className="py-3.5">
                      <span className="flex items-center gap-2 text-neutral-950 text-caption">
                        <PersonAvatar person={p} className="size-6" />
                        {p.firstName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 whitespace-normal">
                      <Link
                        href={href(r)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={copy.open(r.title, p.firstName)}
                        className={cn("rounded-sm text-neutral-950 hover:underline underline-offset-4 text-body", focusRing.dark)}
                      >
                        {r.title}
                      </Link>
                      <span className="text-neutral-400 text-caption"> · {copy.testCount(allTests(r).length)}</span>
                      {matches.length > 0 && <span className="block text-neutral-500 text-micro">{copy.matches(matches)}</span>}
                    </TableCell>
                    <TableCell className="py-3.5 text-neutral-600 text-caption">{visitDoctor(r.orderedBy).name}</TableCell>
                    <TableCell className="py-3.5">
                      <Status result={r} isNew={isNew} />
                    </TableCell>
                    <TableCell className="py-3.5 pr-0">
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="size-4 text-neutral-300" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Phones: a stacked list of links */}
          <ul className="divide-y divide-neutral-100 md:hidden">
            {rows.map(({ result: r, matches }) => {
              const p = personById(r.personId)
              return (
                <li key={r.id}>
                  <Link href={href(r)} className={cn("-mx-2 flex items-start gap-3 rounded-xl px-2 py-4", focusRing.dark)}>
                    <PersonAvatar person={p} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-neutral-950 text-body">{r.title}</span>
                      <span className="block text-neutral-500 text-caption">
                        {p.firstName} · {r.date} · {visitDoctor(r.orderedBy).short}
                      </span>
                      {matches.length > 0 && <span className="block text-neutral-500 text-micro">{copy.matches(matches)}</span>}
                      <span className="mt-2 block">
                        <Status result={r} isNew={!!r.isNew && !opened.has(r.id)} />
                      </span>
                    </span>
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="mt-1 size-4 shrink-0 text-neutral-300" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

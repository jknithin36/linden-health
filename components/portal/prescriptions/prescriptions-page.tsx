"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, CheckmarkCircle02Icon, Clock01Icon, Location01Icon, Medicine02Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { personById } from "@/lib/data/portal"
import { visitDoctor } from "@/lib/data/visits"
import { activeMeds, allergies, pastMeds, pharmacies, prescriptionsCopy as copy, type ActiveMed, type PastMed } from "@/lib/data/prescriptions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { PersonFilter, type PersonFilterValue } from "@/components/portal/person-filter"
import { MedDetailSheet, PharmacySheet, RefillSheet, RefillSteps, type DetailTarget } from "@/components/portal/prescriptions/rx-dialogs"
import { EmptyState as Empty, HalfDot } from "@/components/portal/status-parts"
import { panel } from "@/components/portal/styles"
import { hasAllergies } from "@/lib/data/records"
const l = copy.labels

export function PrescriptionsPage() {
  const [person, setPerson] = React.useState<PersonFilterValue>("all")
  const [pharmacyId, setPharmacyId] = React.useState(pharmacies[0].id)
  const [requested, setRequested] = React.useState<string[]>([])
  const [askedAgain, setAskedAgain] = React.useState<string[]>([])
  const [refilling, setRefilling] = React.useState<ActiveMed | null>(null)
  const [details, setDetails] = React.useState<DetailTarget | null>(null)
  const [pharmacyOpen, setPharmacyOpen] = React.useState(false)
  const pharmacy = pharmacies.find((p) => p.id === pharmacyId) ?? pharmacies[0]

  const mine = <T extends { personId: string }>(list: T[]) => list.filter((m) => person === "all" || m.personId === person)
  const active = mine(activeMeds)
  const past = mine(pastMeds)
  const refillable = activeMeds.filter((m) => m.refillable)
  const alert = active.find((m) => m.dueSoon && !requested.includes(m.id))

  const openRefill = (id?: string) => setRefilling(activeMeds.find((m) => m.id === (id ?? refillable[0]?.id)) ?? null)
  const asDetail = (m: ActiveMed | PastMed): DetailTarget => ({
    medId: m.id,
    personId: m.personId,
    name: "form" in m ? `${m.name} ${m.form}` : m.name,
    doctorSlug: m.doctorSlug,
    detail: m.detail,
    refillable: "refillable" in m && !!m.refillable && !requested.includes(m.id),
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
          <p className="mt-2 text-pretty text-neutral-500 text-body">{copy.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button size="lg" className="rounded-full px-5 text-caption" onClick={() => openRefill()}>
            {copy.requestRefill}
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-5 text-caption" onClick={() => setPharmacyOpen(true)}>
            <HugeiconsIcon icon={Location01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {copy.changePharmacy}
          </Button>
        </div>
      </header>

      <PersonFilter value={person} onValueChange={setPerson} label={copy.filters.person} allLabel={copy.filters.allFamily} />

      {alert && (
        <div role="status" className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.8} className="size-[18px]" />
          </span>
          <p className="flex-1 text-pretty text-body">{copy.alert.text(personById(alert.personId).firstName, alert.short, alert.supply.daysLeft)}</p>
          <Button size="lg" className="shrink-0 self-start rounded-full px-5 text-caption sm:self-center" onClick={() => openRefill(alert.id)}>
            {copy.alert.action}
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Tabs defaultValue="active" className="min-w-0 gap-5 lg:col-span-8">
          <TabsList className="h-10 w-full justify-start bg-neutral-100 sm:w-fit">
            {(["active", "past"] as const).map((t) => (
              <TabsTrigger key={t} value={t} className="h-full flex-1 gap-1.5 rounded-full px-4 text-caption sm:flex-none">
                {copy.tabs[t]}
                <span className="text-neutral-400 tabular-nums">{(t === "active" ? active : past).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="active" className="flex flex-col gap-4">
            {active.length ? (
              active.map((m) => (
                <MedCard
                  key={m.id}
                  med={m}
                  pharmacy={pharmacy.short}
                  requested={requested.includes(m.id)}
                  onRefill={() => openRefill(m.id)}
                  onDetails={() => setDetails(asDetail(m))}
                />
              ))
            ) : (
              <Empty>{copy.empty.active}</Empty>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length ? (
              <PastList meds={past} askedAgain={askedAgain} onAgain={(id) => setAskedAgain((a) => [...a, id])} onDetails={(m) => setDetails(asDetail(m))} />
            ) : (
              <Empty>{copy.empty.past}</Empty>
            )}
          </TabsContent>
        </Tabs>

        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <section aria-labelledby="pharmacy" className={cn(panel, "p-5 md:p-6")}>
            <h2 id="pharmacy" className="text-neutral-500 text-caption">
              {copy.pharmacy.title}
            </h2>
            <p className="mt-2 text-neutral-950 text-title">{pharmacy.name}</p>
            <p className="mt-1 text-neutral-600 text-caption">{pharmacy.address}</p>
            <p className="text-neutral-600 text-caption">{pharmacy.phone}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800 text-micro">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-3" />
              {pharmacy.hours}
            </p>
            <Button variant="outline" size="lg" className="mt-5 w-full rounded-full text-caption" onClick={() => setPharmacyOpen(true)}>
              {copy.changePharmacy}
            </Button>
          </section>

          <section aria-labelledby="allergies" className={cn(panel, "p-5 md:p-6")}>
            <h2 id="allergies" className="text-neutral-950 text-body">
              {copy.allergies.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {allergies.map((a) => {
                const p = personById(a.personId)
                const has = hasAllergies(a.text)
                return (
                  <li key={a.personId} className="flex items-center gap-3">
                    <PersonAvatar person={p} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-neutral-500 text-micro">{p.firstName}</span>
                      <span className={cn("block text-body", has ? "text-red-700" : "text-neutral-700")}>{a.text}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-pretty text-neutral-400 text-micro">{copy.allergies.note}</p>
            <Link href={copy.allergies.update.href} className={cn("mt-3 inline-block rounded-sm text-neutral-950 underline underline-offset-4 hover:no-underline text-caption", focusRing.dark)}>
              {copy.allergies.update.label}
            </Link>
          </section>
        </aside>
      </div>

      <RefillSheet
        med={refilling}
        pharmacy={pharmacy}
        onPharmacy={setPharmacyId}
        onOpenChange={(open) => !open && setRefilling(null)}
        onSent={(id) => setRequested((r) => (r.includes(id) ? r : [...r, id]))}
      />
      <MedDetailSheet
        med={details}
        onOpenChange={(open) => !open && setDetails(null)}
        onRefill={(id) => {
          setDetails(null)
          openRefill(id)
        }}
      />
      <PharmacySheet open={pharmacyOpen} onOpenChange={setPharmacyOpen} current={pharmacy} onSave={setPharmacyId} />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-28 shrink-0 text-neutral-400 text-caption">{label}</dt>
      <dd className="min-w-0 text-neutral-800 text-caption">{children}</dd>
    </div>
  )
}

function MedCard({
  med,
  pharmacy,
  requested,
  onRefill,
  onDetails,
}: {
  med: ActiveMed
  pharmacy: string
  requested: boolean
  onRefill: () => void
  onDetails: () => void
}) {
  const person = personById(med.personId)
  const doc = visitDoctor(med.doctorSlug)
  const titleId = `${med.id}-title`
  const low = med.supply.daysLeft <= 7
  const status = requested ? "requested" : med.dueSoon ? "dueSoon" : "active"
  return (
    <article aria-labelledby={titleId} className={cn(panel, "p-5 md:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600">
            <HugeiconsIcon icon={Medicine02Icon} strokeWidth={1.7} className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-neutral-950 text-title">
              {med.name} <span className="text-neutral-400 text-body">{med.form}</span>
            </h2>
            <p className="flex items-center gap-1.5 text-neutral-600 text-caption">
              <PersonAvatar person={person} className="size-5" />
              {person.firstName}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "h-6 gap-1.5 px-2.5",
            status === "dueSoon" ? "bg-amber-50 text-amber-800" : status === "requested" ? "bg-sky-50 text-sky-800" : "bg-emerald-50 text-emerald-800"
          )}
        >
          {status === "dueSoon" ? (
            <HalfDot className="size-2.5" />
          ) : status === "requested" ? (
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} data-icon="inline-start" />
          ) : (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} data-icon="inline-start" />
          )}
          {copy.status[status]}
        </Badge>
      </div>

      <p className="mt-4 text-pretty text-neutral-950 text-body">{med.instructions}</p>

      {/* Supply */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-caption">
          <span className="text-neutral-500">{l.supply}</span>
          <span className={low ? "text-amber-800" : "text-neutral-700"}>{med.supply.label}</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${l.supply}: ${med.supply.label}`}
          aria-valuenow={med.supply.daysLeft}
          aria-valuemin={0}
          aria-valuemax={med.supply.totalDays}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100"
        >
          <div className={cn("h-full rounded-full", low ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${(med.supply.daysLeft / med.supply.totalDays) * 100}%` }} />
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2 border-t border-neutral-100 pt-4">
        <Row label={l.for}>{med.reason}</Row>
        <Row label={med.byLabel}>
          {`${doc.name}, ${doc.credentials}`} · {med.started}
        </Row>
        {med.otc && <Row label={l.type}>{l.otc}</Row>}
        {med.refills && <Row label={l.refillsLeft}>{l.refills(med.refills.left, med.refills.total)}</Row>}
        {med.lastFilled && <Row label={l.lastFilled}>{med.lastFilled}</Row>}
        {med.refillable && (
          <Row label={l.pharmacy}>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={1.7} className="size-3.5 text-neutral-400" />
              {pharmacy}
            </span>
          </Row>
        )}
        {med.recheck && (
          <Row label={l.recheck}>
            {med.recheck.label} ·{" "}
            <Link href={med.recheck.action.href} className={cn("rounded-sm text-neutral-950 underline underline-offset-4 hover:no-underline", focusRing.dark)}>
              {med.recheck.action.label}
            </Link>
          </Row>
        )}
      </dl>

      {requested && (
        <div className="mt-5 rounded-xl bg-neutral-50 p-4">
          <p className="mb-3 text-neutral-500 text-caption">{copy.refill.progress}</p>
          <RefillSteps doctor={doc.short} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {med.refillable && !requested && (
          <Button size="lg" className="rounded-full px-5 text-caption" onClick={onRefill}>
            {copy.actions.refill}
          </Button>
        )}
        <Button size="lg" variant="outline" className="rounded-full px-5 text-caption" onClick={onDetails}>
          {copy.actions.details}
        </Button>
        <Button nativeButton={false} render={<Link href={copy.actions.messageHref} />} size="lg" variant="ghost" className="rounded-full px-4 text-caption">
          {copy.actions.message(doc.short)}
        </Button>
      </div>
    </article>
  )
}

function PastList({
  meds,
  askedAgain,
  onAgain,
  onDetails,
}: {
  meds: PastMed[]
  askedAgain: string[]
  onAgain: (id: string) => void
  onDetails: (m: PastMed) => void
}) {
  const p = copy.past
  const actions = (m: PastMed) =>
    askedAgain.includes(m.id) ? (
      <span role="status" className="inline-flex items-center gap-1.5 text-emerald-700 text-caption">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4" />
        {p.sent(visitDoctor(m.doctorSlug).short)}
      </span>
    ) : (
      <span className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="rounded-full px-3 text-caption" onClick={() => onDetails(m)}>
          {p.view}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-caption" onClick={() => onAgain(m.id)}>
          {p.again}
        </Button>
      </span>
    )
  return (
    <div className={cn(panel, "px-5 py-2 md:px-6")}>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            {[p.columns.medication, p.columns.patient, p.columns.dates, p.columns.reason, p.columns.status].map((h, i) => (
              <TableHead key={h} className={cn("h-11 text-neutral-400 text-caption", i === 0 && "pl-0")}>
                {h}
              </TableHead>
            ))}
            <TableHead className="h-11 pr-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {meds.map((m) => {
            const person = personById(m.personId)
            return (
              <TableRow key={m.id} className="border-neutral-100 hover:bg-neutral-50/70">
                <TableCell className="py-3.5 pl-0 whitespace-normal">
                  <span className="block text-neutral-950 text-body">{m.name}</span>
                  <span className="block text-neutral-500 text-caption">
                    {m.instructions} · {visitDoctor(m.doctorSlug).name}
                  </span>
                </TableCell>
                <TableCell className="py-3.5">
                  <span className="flex items-center gap-2 text-neutral-950 text-caption">
                    <PersonAvatar person={person} className="size-6" />
                    {person.firstName}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-neutral-600 text-caption">{m.dates}</TableCell>
                <TableCell className="py-3.5 text-neutral-600 text-caption">{m.reason}</TableCell>
                <TableCell className="py-3.5">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600 text-micro">{m.status}</span>
                </TableCell>
                <TableCell className="py-3.5 pr-0 text-right">{actions(m)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <ul className="divide-y divide-neutral-100 md:hidden">
        {meds.map((m) => {
          const person = personById(m.personId)
          return (
            <li key={m.id} className="flex flex-col gap-2.5 py-4">
              <div className="flex items-start gap-3">
                <PersonAvatar person={person} className="size-8" />
                <div className="min-w-0">
                  <p className="text-neutral-950 text-body">{m.name}</p>
                  <p className="text-neutral-500 text-caption">
                    {person.firstName} · {m.dates} · {m.reason}
                  </p>
                </div>
              </div>
              <div className="pl-11">{actions(m)}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

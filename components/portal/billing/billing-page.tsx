"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, CreditCardIcon, Download01Icon, InformationCircleIcon, PlusSignIcon, Upload01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { personById } from "@/lib/data/portal"
import { checkerPlanNames } from "@/lib/data/insurance"
import {
  amountDue,
  billingCopy as copy,
  bills,
  billTotals,
  deductible,
  dueDate,
  insurance,
  money,
  outOfPocket,
  wholeMoney as whole,
  paymentMethods as seedMethods,
  statements,
  yearToDate,
  type Bill,
  type PaymentMethod,
} from "@/lib/data/billing"
import { recordPayment, usePayments } from "@/lib/payments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanCombobox } from "@/components/insurance/plan-combobox"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { download } from "@/components/portal/download"
import { field, panel, sheetClass } from "@/components/portal/styles"

type Tab = (typeof copy.tabs)[number]["id"]

export function BillingPage() {
  const { remaining, count } = usePayments()
  const [tab, setTab] = React.useState<Tab>("overview")
  const [methods, setMethods] = React.useState(seedMethods)
  const [defaultId, setDefaultId] = React.useState(seedMethods[0].id)
  const [paying, setPaying] = React.useState<number | null>(null)
  const [billOpen, setBillOpen] = React.useState<Bill | null>(null)
  const paidAll = remaining === 0

  const ordered = [...methods].sort((a, b) => (a.id === defaultId ? -1 : b.id === defaultId ? 1 : 0))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
        <p className="mt-2 text-pretty text-neutral-500 text-body">{copy.intro}</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-6">
        <TabsList className="-mx-5 h-10 w-[calc(100%+2.5rem)] justify-start overflow-x-auto bg-transparent px-5 sm:mx-0 sm:w-fit sm:bg-neutral-100 sm:px-[3px]">
          {copy.tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 rounded-full px-4 text-caption max-sm:bg-neutral-100 max-sm:data-active:bg-neutral-950 max-sm:data-active:text-white">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <Summary remaining={remaining} />
          <section aria-labelledby="bills-due" className={cn(panel, "px-5 pt-5 pb-2 md:px-6")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="bills-due" className="text-neutral-950 text-body">
                {copy.billsDue}
              </h2>
              {!paidAll && (
                <Button size="lg" className="rounded-full px-5 text-caption" onClick={() => setPaying(remaining)}>
                  {copy.pay(money(remaining))}
                </Button>
              )}
            </div>
            {paidAll && (
              <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900 text-body">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-5 text-emerald-600" />
                {copy.billsPaid}
              </p>
            )}
            <BillsTable paidAll={paidAll} onOpen={setBillOpen} />
          </section>
          <Deductible />
        </TabsContent>

        <TabsContent value="statements">
          <Statements paidAll={paidAll} />
        </TabsContent>

        <TabsContent value="methods">
          <Methods methods={ordered} defaultId={defaultId} onDefault={setDefaultId} onAdd={(m) => setMethods((l) => [...l, m])} onRemove={(id) => setMethods((l) => l.filter((m) => m.id !== id))} />
        </TabsContent>

        <TabsContent value="insurance">
          <Insurance />
        </TabsContent>
      </Tabs>

      <BillSheet
        bill={billOpen}
        paidAll={paidAll}
        onOpenChange={(o) => !o && setBillOpen(null)}
        onPay={(n) => {
          setBillOpen(null)
          setPaying(Math.min(n, remaining))
        }}
      />
      <PaySheet
        amount={paying}
        remaining={remaining}
        count={count}
        methods={ordered}
        onOpenChange={(o) => !o && setPaying(null)}
        onAddMethod={() => {
          setPaying(null)
          setTab("methods")
        }}
      />
    </div>
  )
}

/* -------------------------------- Overview --------------------------------- */

function Summary({ remaining }: { remaining: number }) {
  const c = copy.cards
  const items = [
    { label: c.due, value: money(remaining), sub: remaining ? null : c.nothingDue, tone: remaining ? "due" : "ok" },
    { label: c.dueDate, value: remaining ? dueDate : "—", sub: remaining ? null : c.paidOn, tone: "plain" },
    { label: c.paid, value: money(yearToDate.paid + (amountDue - remaining)), sub: null, tone: "plain" },
    { label: c.insurance, value: money(yearToDate.insurance), sub: null, tone: "plain" },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className={cn("rounded-2xl p-4 md:p-5", i.tone === "due" ? "bg-amber-50" : i.tone === "ok" ? "bg-emerald-50" : "border border-neutral-200/70 bg-white")}>
          <dt className={cn("text-caption", i.tone === "due" ? "text-amber-800" : i.tone === "ok" ? "text-emerald-800" : "text-neutral-500")}>{i.label}</dt>
          <dd className="mt-1 text-neutral-950 tabular-nums text-title">{i.value}</dd>
          {i.sub && <dd className="text-emerald-800 text-caption">{i.sub}</dd>}
        </div>
      ))}
    </dl>
  )
}

function BillsTable({ paidAll, onOpen }: { paidAll: boolean; onOpen: (b: Bill) => void }) {
  const k = copy.columns
  return (
    <>
      <Table className="mt-2 hidden md:table">
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            {[k.date, k.patient, k.service].map((h, i) => (
              <TableHead key={h} className={cn("h-11 text-neutral-400 text-caption", i === 0 && "pl-0")}>
                {h}
              </TableHead>
            ))}
            {[k.total, k.insurance, k.you].map((h) => (
              <TableHead key={h} className="h-11 text-right text-neutral-400 text-caption">
                {h}
              </TableHead>
            ))}
            <TableHead className="h-11 pr-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((b) => {
            const t = billTotals(b)
            const p = personById(b.personId)
            return (
              <TableRow key={b.id} className="border-neutral-100 hover:bg-neutral-50/70">
                <TableCell className="py-3 pl-0 text-neutral-600 tabular-nums text-caption">{b.date}</TableCell>
                <TableCell className="py-3">
                  <span className="flex items-center gap-2 text-neutral-950 text-caption">
                    <PersonAvatar person={p} className="size-6" />
                    {p.firstName}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-neutral-950 text-body">{b.service}</TableCell>
                <TableCell className="py-3 text-right text-neutral-600 tabular-nums text-caption">{money(t.charge)}</TableCell>
                <TableCell className="py-3 text-right text-emerald-700 tabular-nums text-caption">−{money(t.insurance)}</TableCell>
                <TableCell className="py-3 text-right tabular-nums text-body">
                  {paidAll ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 text-micro">{copy.bill.paid}</span> : <span className="text-neutral-950">{money(t.you)}</span>}
                </TableCell>
                <TableCell className="py-3 pr-0 text-right">
                  <Button variant="outline" size="sm" className="rounded-full px-3 text-caption" onClick={() => onOpen(b)}>
                    {copy.details}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <ul className="divide-y divide-neutral-100 md:hidden">
        {bills.map((b) => {
          const t = billTotals(b)
          const p = personById(b.personId)
          return (
            <li key={b.id}>
              <button type="button" onClick={() => onOpen(b)} className={cn("flex w-full items-center gap-3 rounded-lg py-4 text-left", focusRing.dark)}>
                <PersonAvatar person={p} className="size-8" />
                <span className="min-w-0 flex-1">
                  <span className="block text-neutral-950 text-body">{b.service}</span>
                  <span className="block text-neutral-500 text-caption">
                    {p.firstName} · {b.date} · {money(t.charge)} {copy.columns.total.toLowerCase()}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-body">{paidAll ? copy.bill.paid : money(t.you)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** One spending meter: label and percent, the amount against its limit, a thin bar, and what's left. */
function Meter({ id, label, value, max, left }: { id: string; label: string; value: number; max: number; left: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <p id={id} className="text-neutral-500 text-caption">
          {label}
        </p>
        <p className="text-neutral-400 tabular-nums text-caption">{pct}%</p>
      </div>
      <p className="mt-1.5 tabular-nums">
        <span className="text-neutral-950 text-title">{whole(value)}</span> <span className="text-neutral-400 text-body">{copy.deductible.of(whole(max))}</span>
      </p>
      <div role="progressbar" aria-labelledby={id} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-valuetext={`${whole(value)} ${copy.deductible.of(whole(max))}`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-neutral-950" style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
      <p className="mt-2.5 text-neutral-500 text-caption">{left}</p>
    </div>
  )
}

function Deductible() {
  const d = copy.deductible
  return (
    <section aria-labelledby="coverage" className={panel}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5 md:px-6">
        <h2 id="coverage" className="text-neutral-950 text-body">
          {d.title}
        </h2>
        <p className="text-neutral-500 text-caption">{d.plan(insurance.name)}</p>
      </div>
      <div className="grid gap-6 px-5 py-5 md:grid-cols-2 md:gap-0 md:px-0 md:py-6 md:[&>*]:px-6 md:[&>*+*]:border-l md:[&>*+*]:border-neutral-100">
        <Meter id="meter-deductible" label={d.deductible.label} value={deductible.met} max={deductible.total} left={d.deductible.left(whole(deductible.total - deductible.met))} />
        <Meter id="meter-oop" label={d.oop.label} value={outOfPocket.spent} max={outOfPocket.max} left={d.oop.left(whole(outOfPocket.max - outOfPocket.spent))} />
      </div>
      <p className="flex items-start gap-2 border-t border-neutral-100 px-5 py-3.5 text-pretty text-neutral-500 md:px-6 text-caption">
        <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.8} className="mt-px size-4 shrink-0 text-neutral-400" />
        {d.note}
      </p>
    </section>
  )
}

/* ------------------------------- Bill + pay -------------------------------- */

function billText(b: Bill) {
  const t = billTotals(b)
  const f = copy.bill.file
  return [
    f.title(personById(b.personId).name),
    `${b.service} · ${b.date}`,
    "",
    ...b.lines.map((l) => f.line(l.label, money(l.charge), money(l.insurance), money(l.you))),
    "",
    f.total(money(t.charge), money(t.insurance), money(t.you)),
    copy.bill.claim(b.claim, b.processed),
  ].join("\n")
}

function BillSheet({ bill, paidAll, onOpenChange, onPay }: { bill: Bill | null; paidAll: boolean; onOpenChange: (o: boolean) => void; onPay: (amount: number) => void }) {
  const k = copy.bill
  const totals = bill ? billTotals(bill) : null
  return (
    <Sheet open={bill !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        {bill && totals && (
          <>
            <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
              <div className="flex items-center gap-2 text-neutral-500 text-caption">
                <PersonAvatar person={personById(bill.personId)} className="size-6" />
                {personById(bill.personId).firstName} · {bill.date}
              </div>
              <SheetTitle className="pr-8 text-neutral-950 text-title">{bill.service}</SheetTitle>
              <SheetDescription className="text-neutral-500 text-caption">{k.claim(bill.claim, bill.processed)}</SheetDescription>
            </SheetHeader>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-9 pl-0 text-neutral-400 text-caption">{k.item}</TableHead>
                    {[k.charge, k.insurance, k.you].map((h, i) => (
                      <TableHead key={h} className={cn("h-9 text-right text-neutral-400 text-caption", i === 2 && "pr-0")}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.lines.map((l) => (
                    <TableRow key={l.label} className="border-neutral-100 hover:bg-transparent">
                      <TableCell className="py-3 pl-0 whitespace-normal text-neutral-950 text-caption">{l.label}</TableCell>
                      <TableCell className="py-3 text-right text-neutral-600 tabular-nums text-caption">{money(l.charge)}</TableCell>
                      <TableCell className="py-3 text-right text-emerald-700 tabular-nums text-caption">{money(l.insurance)}</TableCell>
                      <TableCell className="py-3 pr-0 text-right text-neutral-950 tabular-nums text-caption">{money(l.you)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="border-neutral-100 bg-transparent">
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-3 pl-0 text-neutral-950 text-caption">{k.total}</TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-caption">{money(totals.charge)}</TableCell>
                    <TableCell className="py-3 text-right text-emerald-700 tabular-nums text-caption">{money(totals.insurance)}</TableCell>
                    <TableCell className="py-3 pr-0 text-right text-neutral-950 tabular-nums text-body">{money(totals.you)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div className="mt-auto flex flex-col gap-2.5 border-t border-neutral-100 p-6">
              {!paidAll && totals.you > 0 && (
                <Button size="lg" className="w-full rounded-full text-caption" onClick={() => onPay(totals.you)}>
                  {copy.pay(money(totals.you))}
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="outline" size="lg" className="rounded-full text-caption" onClick={() => download(`statement-${bill.id}.txt`, billText(bill))}>
                  <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
                  {k.download}
                </Button>
                <Button nativeButton={false} render={<Link href={k.ask.href} />} variant="outline" size="lg" className="rounded-full text-caption">
                  {k.ask.label}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PaySheet({
  amount,
  remaining,
  count,
  methods,
  onOpenChange,
  onAddMethod,
}: {
  amount: number | null
  remaining: number
  count: number
  methods: PaymentMethod[]
  onOpenChange: (o: boolean) => void
  onAddMethod: () => void
}) {
  const s = copy.paySheet
  const [mode, setMode] = React.useState<"full" | "other">("full")
  const [other, setOther] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [method, setMethod] = React.useState(methods[0]?.id ?? "")
  const [done, setDone] = React.useState<string | null>(null)
  const [last, setLast] = React.useState(amount)
  if (amount !== last) {
    setLast(amount)
    if (amount !== null) {
      setMode(amount < remaining ? "other" : "full")
      setOther(amount < remaining ? amount.toFixed(2) : "")
      setError(null)
      setMethod(methods[0]?.id ?? "")
      setDone(null)
    }
  }
  const ids = { amount: React.useId(), other: React.useId(), method: React.useId() }
  const value = mode === "full" ? remaining : Number(other)

  const pay = () => {
    if (mode === "other" && !(value >= 1 && value <= remaining)) return setError(s.otherError(money(remaining)))
    setDone(recordPayment(Math.round(value * 100) / 100, count))
  }

  return (
    <Sheet open={amount !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
          <SheetTitle className="pr-8 text-neutral-950 text-title">{s.title}</SheetTitle>
          <SheetDescription className="text-neutral-500 text-caption">
            {copy.cards.due}: {money(remaining)} · {dueDate}
          </SheetDescription>
        </SheetHeader>
        <div aria-live="polite" className="flex flex-1 flex-col gap-6 p-6">
          {done ? (
            <div className="flex flex-col items-start gap-4">
              <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-5" />
              </span>
              <p className="text-pretty text-neutral-950 text-lead">{s.success(done)}</p>
            </div>
          ) : (
            <>
              <div>
                <p id={ids.amount} className="mb-2 text-neutral-500 text-caption">
                  {s.amount}
                </p>
                <RadioGroup aria-labelledby={ids.amount} value={mode} onValueChange={(v) => setMode(v as "full" | "other")} className="gap-2">
                  {(["full", "other"] as const).map((m) => (
                    <label key={m} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-body", mode === m ? "border-neutral-950 bg-neutral-50" : "border-neutral-200")}>
                      <RadioGroupItem value={m} />
                      {m === "full" ? s.full(money(remaining)) : s.other}
                    </label>
                  ))}
                </RadioGroup>
                {mode === "other" && (
                  <div className="mt-3">
                    <label htmlFor={ids.other} className="mb-1.5 block text-neutral-600 text-caption">
                      {s.otherLabel}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400 text-body">$</span>
                      <Input
                        id={ids.other}
                        inputMode="decimal"
                        value={other}
                        aria-invalid={error ? true : undefined}
                        onChange={(e) => {
                          setOther(e.target.value.replace(/[^\d.]/g, ""))
                          setError(null)
                        }}
                        className={cn(field, "pl-8")}
                      />
                    </div>
                    {error && <p className="mt-1.5 text-red-700 text-caption">{error}</p>}
                  </div>
                )}
              </div>
              <div>
                <p id={ids.method} className="mb-2 text-neutral-500 text-caption">
                  {s.method}
                </p>
                <RadioGroup aria-labelledby={ids.method} value={method} onValueChange={(v) => setMethod(v as string)} className="gap-2">
                  {methods.map((m) => (
                    <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-body", method === m.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200")}>
                      <RadioGroupItem value={m.id} />
                      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={1.7} className="size-4 text-neutral-500" />
                      <span className="flex-1">{m.label}</span>
                      <span className="text-neutral-400 text-caption">{copy.methods.expires(m.expires)}</span>
                    </label>
                  ))}
                </RadioGroup>
                <button type="button" onClick={onAddMethod} className={cn("mt-3 inline-flex items-center gap-1.5 rounded-sm text-neutral-950 underline-offset-4 hover:underline text-caption", focusRing.dark)}>
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
                  {s.addMethod}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="border-t border-neutral-100 p-6">
          {done ? (
            <Button size="lg" variant="outline" className="w-full rounded-full text-caption" onClick={() => onOpenChange(false)}>
              {s.done}
            </Button>
          ) : (
            <Button size="lg" className="w-full rounded-full text-caption" onClick={pay}>
              {s.submit(money(mode === "full" ? remaining : Number(other) || 0))}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------- Statements -------------------------------- */

function Statements({ paidAll }: { paidAll: boolean }) {
  const k = copy.statementCols
  return (
    <div className={cn(panel, "px-5 py-2 md:px-6")}>
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            <TableHead className="h-11 pl-0 text-neutral-400 text-caption">{k.month}</TableHead>
            <TableHead className="h-11 text-right text-neutral-400 text-caption">{k.amount}</TableHead>
            <TableHead className="h-11 text-neutral-400 text-caption">{k.status}</TableHead>
            <TableHead className="h-11 pr-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((st) => {
            const due = st.status === "due" && !paidAll
            return (
              <TableRow key={st.id} className="border-neutral-100 hover:bg-neutral-50/70">
                <TableCell className="py-3 pl-0 text-neutral-950 text-body">{st.month}</TableCell>
                <TableCell className="py-3 text-right text-neutral-950 tabular-nums text-body">{money(st.amount)}</TableCell>
                <TableCell className="py-3">
                  <span className={cn("rounded-full px-2 py-0.5 whitespace-nowrap text-micro", due ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800")}>
                    {due ? st.date : st.status === "due" ? copy.cards.paidOn : st.date}
                  </span>
                </TableCell>
                <TableCell className="py-3 pr-0 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-3 text-caption"
                    onClick={() => download(`statement-${st.id}.txt`, copy.bill.file.month(st.month, money(st.amount), st.date))}
                  >
                    <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
                    <span className="max-sm:sr-only">{copy.bill.download}</span>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/* ---------------------------- Payment methods ------------------------------ */

function Methods({
  methods,
  defaultId,
  onDefault,
  onAdd,
  onRemove,
}: {
  methods: PaymentMethod[]
  defaultId: string
  onDefault: (id: string) => void
  onAdd: (m: PaymentMethod) => void
  onRemove: (id: string) => void
}) {
  const k = copy.methods
  const [adding, setAdding] = React.useState(false)
  const [autopay, setAutopay] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", number: "", expiry: "", zip: "" })
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof form, string>>>({})
  const [note, setNote] = React.useState<string | null>(null)
  const ids = { name: React.useId(), number: React.useId(), expiry: React.useId(), zip: React.useId(), autopay: React.useId() }
  const def = methods.find((m) => m.id === defaultId)

  const save = () => {
    const digits = form.number.replace(/\D/g, "")
    const next: typeof errors = {}
    if (digits.length !== 16) next.number = k.errors.number
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) next.expiry = k.errors.expiry
    if (!/^\d{5}$/.test(form.zip)) next.zip = k.errors.zip
    setErrors(next)
    if (Object.keys(next).length) return
    const last4 = digits.slice(-4)
    const m: PaymentMethod = { id: `card-${last4}`, label: k.label(k.brands[digits[0]] ?? k.genericBrand, last4), expires: form.expiry, kind: "card" }
    // Demo: a real portal would tokenize the card with the payment provider, then POST the token.
    if (methods.some((x) => x.id === m.id)) setNote(k.exists(m.label))
    else {
      onAdd(m)
      setNote(k.added(m.label))
    }
    setAdding(false)
    setForm({ name: "", number: "", expiry: "", zip: "" })
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 md:grid-cols-2">
        {methods.map((m) => (
          <li key={m.id} className={cn(panel, "flex flex-col gap-4 p-5")}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={1.7} className="size-5" />
              </span>
              {m.id === defaultId && <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-white text-micro">{k.default}</span>}
            </div>
            <div>
              <p className="text-neutral-950 text-body">{m.label}</p>
              <p className="text-neutral-500 text-caption">{k.expires(m.expires)}</p>
            </div>
            {m.id !== defaultId && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full px-3 text-caption" onClick={() => onDefault(m.id)}>
                  {k.makeDefault}
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-caption" onClick={() => onRemove(m.id)}>
                  {k.remove}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {note && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900 text-body">
          {note}
        </p>
      )}

      {adding ? (
        <section aria-labelledby="add-card" className={cn(panel, "p-5 md:p-6")}>
          <h2 id="add-card" className="text-neutral-950 text-body">
            {k.addTitle}
          </h2>
          <p className="text-neutral-400 text-micro">{k.demoNote}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["name", "number", "expiry", "zip"] as const).map((f) => (
              <div key={f} className={cn(f === "name" || f === "number" ? "sm:col-span-2" : "")}>
                <label htmlFor={ids[f]} className="mb-1.5 block text-neutral-600 text-caption">
                  {k.fields[f].label}
                </label>
                <Input
                  id={ids[f]}
                  value={form[f]}
                  inputMode={f === "name" ? "text" : "numeric"}
                  autoComplete={f === "name" ? "cc-name" : f === "number" ? "cc-number" : f === "expiry" ? "cc-exp" : "postal-code"}
                  aria-invalid={errors[f] ? true : undefined}
                  placeholder={k.fields[f].placeholder}
                  onChange={(e) => {
                    let v = e.target.value
                    if (f === "number") v = v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ")
                    if (f === "expiry") v = v.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2")
                    if (f === "zip") v = v.replace(/\D/g, "").slice(0, 5)
                    setForm((x) => ({ ...x, [f]: v }))
                    setErrors((x) => ({ ...x, [f]: undefined }))
                  }}
                  className={field}
                />
                {errors[f] && <p className="mt-1.5 text-red-700 text-caption">{errors[f]}</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2.5">
            <Button size="lg" className="rounded-full px-5 text-caption" onClick={save}>
              {k.save}
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full px-5 text-caption" onClick={() => setAdding(false)}>
              {k.cancel}
            </Button>
          </div>
        </section>
      ) : (
        <Button variant="outline" size="lg" className="self-start rounded-full px-5 text-caption" onClick={() => setAdding(true)}>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          {k.add}
        </Button>
      )}

      <div className={cn(panel, "flex items-start justify-between gap-4 p-5")}>
        <div>
          <label htmlFor={ids.autopay} className="text-neutral-950 text-body">
            {k.autopay}
          </label>
          <p className="text-pretty text-neutral-500 text-caption">{autopay && def ? k.autopayOn(def.label, dueDate) : k.autopayHint}</p>
        </div>
        <Switch id={ids.autopay} checked={autopay} onCheckedChange={setAutopay} />
      </div>
    </div>
  )
}

/* -------------------------------- Insurance -------------------------------- */

function InsuranceCard({ side }: { side: "front" | "back" }) {
  return (
    <div className="relative aspect-[1.586/1] overflow-hidden rounded-xl bg-linear-to-br from-sky-700 to-sky-900 p-4 text-white">
      {side === "front" ? (
        <div className="flex h-full flex-col justify-between">
          <p className="text-caption">{insurance.name}</p>
          <div className="text-micro">
            <p className="text-white/70">{copy.insurance.holder}</p>
            <p>{insurance.holder}</p>
            <p className="mt-1 text-white/70">{copy.insurance.member}</p>
            <p className="tabular-nums">{insurance.memberId}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between text-micro">
          <span className="block h-6 rounded bg-white/15" />
          <div>
            <p className="text-white/70">{copy.insurance.phone}</p>
            <p className="tabular-nums">{insurance.phone}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Insurance() {
  const k = copy.insurance
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [updated, setUpdated] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [plan, setPlan] = React.useState<string | null>(null)
  const [memberId, setMemberId] = React.useState("")
  const [secondary, setSecondary] = React.useState<{ plan: string; memberId: string } | null>(null)
  const ids = { plan: React.useId(), member: React.useId() }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="plan" className={cn(panel, "grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-6")}>
        <div className="flex flex-col gap-5">
          <div>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-800 text-micro">{insurance.rank}</span>
            <h2 id="plan" className="mt-2 text-neutral-950 text-title">
              {insurance.name}
            </h2>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-neutral-400 text-caption">{k.member}</dt>
              <dd className="text-neutral-950 tabular-nums text-body">{insurance.memberId}</dd>
            </div>
            <div>
              <dt className="text-neutral-400 text-caption">{k.group}</dt>
              <dd className="text-neutral-950 tabular-nums text-body">{insurance.group}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-400 text-caption">{k.covers}</dt>
              <dd className="mt-1.5 flex flex-wrap gap-2">
                {insurance.covers.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-0.5 pr-2.5 pl-0.5 text-neutral-800 text-caption">
                    <PersonAvatar person={personById(id)} className="size-6" />
                    {personById(id).firstName}
                  </span>
                ))}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-400 text-caption">{k.copays}</dt>
              <dd className="mt-1.5 grid grid-cols-3 gap-2">
                {insurance.copays.map((c) => (
                  <span key={c.label} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                    <span className="block text-neutral-500 text-micro">{c.label}</span>
                    <span className="block text-neutral-950 tabular-nums text-body">{c.amount}</span>
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {(["front", "back"] as const).map((side) => (
              <figure key={side}>
                <InsuranceCard side={side} />
                <figcaption className="mt-1.5 text-neutral-500 text-micro">{k[side]}</figcaption>
              </figure>
            ))}
          </div>
          <input ref={fileRef} type="file" aria-hidden="true" tabIndex={-1} accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files?.length && setUpdated(true)} />
          <Button variant="outline" size="sm" className="self-start rounded-full px-3 text-caption" onClick={() => fileRef.current?.click()}>
            <HugeiconsIcon icon={Upload01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {k.update}
          </Button>
          {updated && (
            <p role="status" className="text-emerald-700 text-caption">
              {k.updated}
            </p>
          )}
        </div>
      </section>

      {secondary && (
        <section className={cn(panel, "p-5 md:p-6")}>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-700 text-micro">{k.secondary}</span>
          <p className="mt-2 text-neutral-950 text-title">{secondary.plan}</p>
          <p className="text-neutral-500 text-caption">
            {k.memberId} {secondary.memberId}
          </p>
        </section>
      )}

      {adding ? (
        <section aria-labelledby="secondary" className={cn(panel, "flex flex-col gap-4 p-5 md:p-6")}>
          <h2 id="secondary" className="text-neutral-950 text-body">
            {k.secondaryTitle}
          </h2>
          <div>
            <label htmlFor={ids.plan} className="mb-1.5 block text-neutral-600 text-caption">
              {k.plan}
            </label>
            <PlanCombobox id={ids.plan} items={checkerPlanNames.filter((n) => n !== insurance.name)} value={plan} onValueChange={setPlan} placeholder={k.planPlaceholder} emptyText={k.planEmpty} />
          </div>
          <div>
            <label htmlFor={ids.member} className="mb-1.5 block text-neutral-600 text-caption">
              {k.memberId}
            </label>
            <Input id={ids.member} value={memberId} onChange={(e) => setMemberId(e.target.value)} className={field} />
          </div>
          <div className="flex gap-2.5">
            <Button
              size="lg"
              disabled={!plan || !memberId.trim()}
              className="rounded-full px-5 text-caption"
              onClick={() => {
                if (plan) setSecondary({ plan, memberId: memberId.trim() })
                setAdding(false)
              }}
            >
              {k.save}
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full px-5 text-caption" onClick={() => setAdding(false)}>
              {copy.methods.cancel}
            </Button>
          </div>
        </section>
      ) : (
        !secondary && (
          <Button variant="outline" size="lg" className="self-start rounded-full px-5 text-caption" onClick={() => setAdding(true)}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            {k.addSecondary}
          </Button>
        )
      )}
    </div>
  )
}

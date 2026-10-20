"use client"

import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { BrickWallShieldIcon, Calendar03Icon, CheckmarkCircle02Icon, SquareLock02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { billing, overviewCopy as copy, personById } from "@/lib/data/portal"
import { billingCopy, money } from "@/lib/data/billing"
import { usePayments } from "@/lib/payments"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { panel } from "@/components/portal/styles"

const splitTone: Record<(typeof billing.split)[number]["id"], string> = {
  insurance: "bg-emerald-400",
  you: "bg-orange-500",
}

/** Overview panel: amount due on the warm gradient, the insurance split, and the bills. Shows a paid state once you pay. */
export function BillingPanel() {
  const { remaining } = usePayments()
  const paid = remaining === 0
  const total = billing.split.reduce((sum, part) => sum + part.amount, 0)
  return (
    <section aria-labelledby="billing-summary" className={cn(panel, "p-5 md:p-6")}>
      <h2 id="billing-summary" className="text-neutral-950 text-body">
        {copy.billing.heading}
      </h2>
      {/* Amount due: on the warm painted gradient, since something is owed. */}
      <div className="relative isolate mt-4 overflow-hidden rounded-xl bg-orange-600 p-4 text-white">
        <Image src={billing.background} alt="" fill sizes="(min-width: 1024px) 360px, 100vw" className="-z-10 object-cover object-[50%_80%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-orange-950/25 via-orange-900/5 to-transparent" />
        <p className="text-white/85 text-caption">{billing.label}</p>
        <p className="mt-1 tabular-nums text-heading">{money(remaining)}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-white/90 text-caption">
          <HugeiconsIcon icon={paid ? CheckmarkCircle02Icon : Calendar03Icon} strokeWidth={1.8} className="size-3.5" />
          {paid ? billing.paid.label : billing.due}
        </p>
      </div>

      {/* Insurance vs. your share across these visits. */}
      <div className="mt-5">
        <div
          role="img"
          aria-label={billing.split.map((p) => `${p.label} ${money(p.amount)}`).join(", ")}
          className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        >
          {billing.split.map((p) => (
            <span key={p.id} className={cn("h-full first:rounded-l-full last:rounded-r-full", splitTone[p.id])} style={{ width: `${(p.amount / total) * 100}%` }} />
          ))}
        </div>
        <ul aria-hidden="true" className="mt-2.5 flex justify-between gap-3 text-caption">
          {billing.split.map((p) => (
            <li key={p.id} className="flex items-center gap-1.5 text-neutral-500">
              <span className={cn("size-2 rounded-full", splitTone[p.id])} />
              {p.label}
              <span className="text-neutral-950 tabular-nums">{money(p.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {billing.items.map((item) => {
          const person = personById(item.personId)
          return (
            <li key={item.id} className="flex items-center gap-3">
              <PersonAvatar person={person} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-neutral-950 text-body">{item.label}</span>
                <span className="block text-neutral-500 text-caption">
                  {person.firstName} · {item.date}
                </span>
              </span>
              {paid ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 text-micro">{billingCopy.bill.paid}</span>
              ) : (
                <span className="shrink-0 text-neutral-950 tabular-nums text-body">{money(item.amount)}</span>
              )}
            </li>
          )
        })}
      </ul>

      <p className="mt-5 flex gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-pretty text-emerald-900 text-caption">
        <HugeiconsIcon icon={BrickWallShieldIcon} strokeWidth={1.8} className="mt-px size-4 shrink-0 text-emerald-600" />
        {billing.insuranceNote}
      </p>

      <Button nativeButton={false} render={<Link href={billing.pay.href} />} size="lg" variant={paid ? "outline" : "default"} className="mt-4 w-full rounded-full text-caption">
        {paid ? billing.paid.view : billingCopy.pay(money(remaining))}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-neutral-400 text-micro">
        <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={1.8} className="size-3" />
        {billing.securedBy}
      </p>
    </section>
  )
}

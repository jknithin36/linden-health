"use client"

import * as React from "react"
import { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { settingsCopy } from "@/lib/data/admin-settings"
import { fmtMoney } from "@/lib/admin/format"
import { allServices, defaultPrice } from "@/lib/admin/queries"
import { setPrice } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import type { Service } from "@/lib/admin/types"
import { useMounted } from "@/hooks/use-mounted"
import { notify, panel, TableSkeleton, touchTarget } from "@/components/admin/ui"
import { inputCls } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Locked, useIsAdmin } from "@/components/admin/settings/locked"

const t = settingsCopy.services
const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, t.invalid)
  .refine((v) => Number(v) >= 1 && Number(v) <= 2000, t.invalid)

function PriceCell({ s, editable }: { s: Service; editable: boolean }) {
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState("")
  const base = defaultPrice(s.id)
  const changed = base !== undefined && base !== s.selfPay

  const start = () => {
    setValue(s.selfPay.toFixed(2))
    setError("")
    setEditing(true)
  }
  const save = () => {
    const r = priceSchema.safeParse(value)
    if (!r.success) return setError(r.error.issues[0]?.message ?? t.invalid)
    const n = Math.round(Number(r.data) * 100) / 100
    if (n !== s.selfPay) {
      setPrice(s.id, n)
      notify.success(t.saved(s.name, fmtMoney(n)))
    }
    setEditing(false)
  }

  if (editing)
    return (
      <form
        noValidate
        className="flex flex-col items-end gap-1"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="flex items-center gap-1.5">
          <label htmlFor={`price-${s.id}`} className="sr-only">
            {s.name} price
          </label>
          <span className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400 text-caption">
              $
            </span>
            <Input
              id={`price-${s.id}`}
              autoFocus
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                setValue(e.target.value.replace(/[^\d.]/g, ""))
                setError("")
              }}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `price-${s.id}-err` : undefined}
              className={cn(inputCls, "h-9 w-28 pl-6 text-right tabular-nums")}
            />
          </span>
          <Button type="submit" size="sm" className="h-9 rounded-full px-3.5 text-caption">
            {t.save}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-9 rounded-full px-3 text-caption" onClick={() => setEditing(false)}>
            {t.cancel}
          </Button>
        </div>
        {error && (
          <p id={`price-${s.id}-err`} role="alert" className="text-red-700 text-micro">
            {error}
          </p>
        )}
      </form>
    )

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-right">
        <span className="block text-neutral-950 tabular-nums text-caption">{fmtMoney(s.selfPay)}</span>
        {changed && <span className="block text-neutral-400 tabular-nums text-micro">was {fmtMoney(base)}</span>}
      </span>
      <Locked locked={!editable} reason={settingsCopy.locks.prices}>
        <Button variant="ghost" size="icon" className={cn("size-8 rounded-full text-neutral-500", touchTarget)} disabled={!editable} onClick={start} aria-label={`${t.edit}: ${s.name}`}>
          <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.8} />
        </Button>
      </Locked>
    </div>
  )
}

export function ServicesTab() {
  const mounted = useMounted()
  useAdminState((s) => s.version)
  const editable = useIsAdmin()
  const rows = mounted ? allServices() : []
  return (
    <section aria-labelledby="services-h" className={panel}>
      <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-4 py-4 md:px-5">
        <h2 id="services-h" className="text-neutral-950 text-body">
          {t.title}
        </h2>
        <p className="text-neutral-500 text-caption">{t.subtitle}</p>
        {!editable && <p className="mt-2 w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600 text-micro">{settingsCopy.locks.prices}</p>}
      </div>
      {!mounted ? (
        <TableSkeleton rows={9} cols={5} />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-neutral-100 md:hidden">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 px-4 py-3.5">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-neutral-950 text-body">{s.name}</span>
                    <span className="block text-neutral-500 tabular-nums text-micro">
                      {s.code} · {s.category} · {s.durationMin} min
                    </span>
                  </span>
                </span>
                <PriceCell s={s} editable={editable} />
              </li>
            ))}
          </ul>
          <div className="relative overflow-x-auto max-md:hidden">
            <table className="w-full text-caption">
              <thead className="text-neutral-500 text-micro">
                <tr className="border-b border-neutral-100">
                  <th scope="col" className="px-5 py-3 text-left font-regular">Service</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Code</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Category</th>
                  <th scope="col" className="px-4 py-3 text-right font-regular">Duration</th>
                  <th scope="col" className="px-5 py-3 text-right font-regular">Self-pay price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 text-neutral-950 text-body">{s.name}</td>
                    <td className="px-4 py-3 text-neutral-500 tabular-nums">{s.code}</td>
                    <td className="px-4 py-3">{s.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.durationMin} min</td>
                    <td className="px-5 py-2">
                      <PriceCell s={s} editable={editable} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

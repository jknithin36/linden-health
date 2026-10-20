"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Call02Icon, DoorIcon, Location01Icon, Mail01Icon, Doctor01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { settingsCopy } from "@/lib/data/admin-settings"
import { fmtClock, TODAY, weekday, weekdayNames as dayNames, weekOrder as order } from "@/lib/admin/format"
import { allDoctors, clinics } from "@/lib/admin/queries"
import { ClinicBadge, panel } from "@/components/admin/ui"

export function ClinicsTab() {
  const t = settingsCopy.clinics
  const today = weekday(TODAY)
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {clinics.map((c) => {
        const providers = allDoctors().filter((d) => d.clinicIds.includes(c.id) && d.status === "active").length
        return (
          <section key={c.id} aria-labelledby={`clinic-${c.id}`} className={cn(panel, "flex flex-col")}>
            <div className="flex flex-col gap-3 border-b border-neutral-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 id={`clinic-${c.id}`} className="text-neutral-950 text-body">
                  {c.name}
                </h2>
                <ClinicBadge id={c.id} />
              </div>
              <ul className="flex flex-col gap-2 text-neutral-700 text-caption">
                <li className="flex items-start gap-2">
                  <HugeiconsIcon icon={Location01Icon} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  {c.address}
                </li>
                <li className="flex items-center gap-2 tabular-nums">
                  <HugeiconsIcon icon={Call02Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 shrink-0 text-neutral-400" />
                  <a href={`tel:${c.phone.replace(/\D/g, "")}`} className={cn("rounded-sm hover:underline", focusRing.dark)}>
                    {c.phone}
                  </a>
                </li>
                <li className="flex min-w-0 items-center gap-2">
                  <HugeiconsIcon icon={Mail01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 shrink-0 text-neutral-400" />
                  <span className="truncate">{c.email}</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 text-neutral-700 text-micro">
                  <HugeiconsIcon icon={DoorIcon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
                  {t.rooms(c.rooms)}
                </span>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 text-neutral-700 text-micro">
                  <HugeiconsIcon icon={Doctor01Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
                  {t.providers(providers)}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-neutral-400 text-micro">{t.hours}</h3>
              <dl className="mt-2 flex flex-col">
                {order.map((i) => {
                  const h = c.hours[i]
                  return (
                    <div key={i} className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-caption", i === today && "bg-neutral-50")}>
                      <dt className={cn(i === today ? "text-neutral-950" : "text-neutral-600")}>
                        {dayNames[i]}
                        {i === today && <span className="ml-1.5 text-neutral-400 text-micro">Today</span>}
                      </dt>
                      <dd className={cn("tabular-nums", h ? "text-neutral-950" : "text-neutral-400")}>
                        {h ? `${fmtClock(h.open)} – ${fmtClock(h.close)}` : t.closed}
                        {h?.videoOnly && <span className="ml-1.5 rounded-full bg-sky-50 px-1.5 py-0.5 text-sky-800 text-micro">{t.videoOnly}</span>}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </section>
        )
      })}
    </div>
  )
}

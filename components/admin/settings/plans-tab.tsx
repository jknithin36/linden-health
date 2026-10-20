"use client"

import { Shield01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { settingsCopy } from "@/lib/data/admin-settings"
import { categoryLabel } from "@/lib/data/admin-billing"
import { adminCopy } from "@/lib/data/admin"
import { allPlans, clinics, getClinicSync } from "@/lib/admin/queries"
import { setPlanActive } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import { useMounted } from "@/hooks/use-mounted"
import { useUrlState } from "@/components/admin/hooks"
import { FacetFilter, SearchInput } from "@/components/admin/data-table"
import { EmptyState, notify, panel, TableSkeleton } from "@/components/admin/ui"
import { Switch } from "@/components/ui/switch"

const t = settingsCopy.plans
const categoryOptions = Object.entries(categoryLabel).map(([value, label]) => ({ value, label }))

export function PlansTab() {
  const mounted = useMounted()
  useAdminState((s) => s.version)
  const url = useUrlState()
  const q = url.get("q").trim().toLowerCase()
  const cats = url.getList("category")
  const all = mounted ? allPlans() : []
  const matching = all.filter((p) => !q || p.name.toLowerCase().includes(q) || p.planTypes.some((x) => x.toLowerCase().includes(q)))
  const counts = Object.fromEntries(categoryOptions.map((o) => [o.value, matching.filter((p) => p.category === o.value).length]))
  const rows = matching.filter((p) => !cats.length || cats.includes(p.category))
  const active = all.filter((p) => p.active).length

  return (
    <section aria-labelledby="plans-h" className={panel}>
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <h2 id="plans-h" className="text-neutral-950 text-body">
            {t.title}
          </h2>
          <p className="text-neutral-500 tabular-nums text-caption">{mounted ? t.active(active, all.length) : " "}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={url.get("q")} onChange={(v) => url.set({ q: v })} placeholder={t.search} />
          <FacetFilter title="Category" options={categoryOptions} selected={cats} onChange={(v) => url.set({ category: v })} counts={counts} />
        </div>
      </div>
      {!mounted ? (
        <TableSkeleton rows={8} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Shield01Icon} title={t.empty.title} text={t.empty.text} />
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3 md:px-5">
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-body", p.active ? "text-neutral-950" : "text-neutral-500")}>{p.name}</p>
                <p className="flex flex-wrap gap-x-2 text-neutral-500 text-micro">
                  <span>{categoryLabel[p.category]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{p.planTypes.join(", ")}</span>
                  <span aria-hidden="true">·</span>
                  <span>{p.coverage.length === clinics.length ? adminCopy.allClinics : p.coverage.map((c) => getClinicSync(c).short).join(", ")}</span>
                </p>
              </div>
              <span className={cn("hidden text-micro sm:inline", p.active ? "text-emerald-700" : "text-neutral-400")}>{p.active ? t.accepted : t.notAccepted}</span>
              <Switch
                checked={p.active}
                aria-label={`Accept ${p.name}`}
                onCheckedChange={(v) => {
                  setPlanActive(p.id, !!v)
                  notify.success(v ? t.on(p.name) : t.off(p.name))
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

"use client"

import { MedicineBottle01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { messagesCopy as m } from "@/lib/data/admin-messages"
import { relative } from "@/lib/admin/format"
import { getDoctorSync, getPatientSync } from "@/lib/admin/queries"
import type { RefillRequest } from "@/lib/admin/types"
import { setRefillStatus } from "@/lib/admin/actions"
import { EmptyState, notify, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const rank: Record<RefillRequest["status"], number> = { new: 0, routed: 1, approved: 2, denied: 3 }

export function RefillList({ rows, selectedPatient, onSelectPatient }: { rows: RefillRequest[] | null; selectedPatient: string | null; onSelectPatient: (id: string) => void }) {
  if (!rows)
    return (
      <div aria-hidden="true" className="flex flex-col gap-3 p-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  if (!rows.length) return <EmptyState icon={MedicineBottle01Icon} title={m.refills.empty} />
  const sorted = [...rows].sort((a, b) => rank[a.status] - rank[b.status] || (a.createdAt < b.createdAt ? 1 : -1))
  const act = (r: RefillRequest, s: RefillRequest["status"]) => notify.success(setRefillStatus(r, s))
  return (
    <ul aria-label="Refill requests">
      {sorted.map((r) => {
        const p = getPatientSync(r.patientId)
        const open = r.status === "new" || r.status === "routed"
        return (
          <li key={r.id} className={cn("flex flex-col gap-2 border-b border-neutral-100 px-3 py-3", selectedPatient === r.patientId && "bg-neutral-50")}>
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => onSelectPatient(r.patientId)} className="min-w-0 rounded-md text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-neutral-950">
                <span className="block truncate text-neutral-950 text-caption">
                  {r.medication} {r.dose}
                </span>
                <span className="block truncate text-neutral-500 text-micro">
                  {p?.name} · {getDoctorSync(r.doctorId)?.name}
                </span>
              </button>
              <StatusBadge kind="refill" status={r.status} />
            </div>
            {r.note && <p className="rounded-lg bg-neutral-50 px-2.5 py-1.5 text-neutral-600 text-micro">“{r.note}”</p>}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="basis-full text-neutral-400 text-micro">
                {m.refills.requested} {relative(r.createdAt)}
              </span>
              {open && (
                <>
                  {r.status === "new" && (
                    <Button size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-micro" onClick={() => act(r, "routed")}>
                      {m.refills.route}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-red-700 text-micro" onClick={() => act(r, "denied")}>
                    {m.refills.deny}
                  </Button>
                  <Button size="sm" className="h-7 rounded-full px-2.5 text-micro" onClick={() => act(r, "approved")}>
                    {m.refills.approve}
                  </Button>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

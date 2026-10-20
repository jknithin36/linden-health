"use client"

import { chartCopy } from "@/lib/data/admin-patients"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import { activeMeds } from "@/lib/data/prescriptions"
import { fmtDate, fmtDateLong, relative } from "@/lib/admin/format"
import { getDoctorSync } from "@/lib/admin/queries"
import { setRefillStatus } from "@/lib/admin/actions"
import type { Medication, Patient, RefillRequest } from "@/lib/admin/types"
import { notify, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { MiniTable, Muted, Section, td } from "@/components/admin/patient-detail/shared"

const c = chartCopy.meds
const d = doctorChartCopy.meds

export function MedicationsTab({ patient, meds, refills }: { patient: Patient; meds: Medication[]; refills: RefillRequest[] }) {
  // The list itself comes from the store (medicationsFor), so approved refills and signed
  // prescriptions show up here. The Mitchells also get their portal's instructions and reason.
  const portal = patient.portalId ? activeMeds.filter((m) => m.personId === patient.portalId) : []
  const portalFor = (m: Medication) => portal.find((x) => x.short.toLowerCase() === m.name.toLowerCase() || x.name.toLowerCase().startsWith(m.name.toLowerCase()))
  const active = meds.filter((m) => m.status === "active")
  const sorted = [...refills].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Section title={c.active} className="lg:col-span-2" flush>
        {active.length ? (
          <ul className="flex flex-col divide-y divide-neutral-100 border-t border-neutral-100">
            {active.map((m) => {
              const pm = portalFor(m)
              const doc = getDoctorSync(m.prescriberId)
              return (
                <li key={m.id} className="px-5 py-3.5">
                  <p className="text-neutral-950 text-caption">
                    {m.name} {m.dose}
                  </p>
                  <p className="mt-0.5 text-pretty text-neutral-500 text-micro">{pm?.instructions ?? m.frequency}</p>
                  <p className="mt-1.5 text-neutral-500 text-micro">
                    {pm?.reason ? `${pm.reason} · ` : ""}
                    {doc ? `${pm?.byLabel ?? d.prescribedBy} ${doc.name} · ` : ""}
                    {d.started} {fmtDateLong(m.startedAt)}
                    {pm?.otc ? " · Over the counter" : ""}
                  </p>
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 tabular-nums text-micro">
                    <span className="text-neutral-700">
                      {d.lastFilled} {fmtDateLong(m.lastFilledAt)}
                    </span>
                    <span className={m.refillsLeft === 0 ? "text-amber-800" : "text-neutral-700"}>{d.refillsLeft(m.refillsLeft)}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        ) : (
          <Muted className="px-5 pb-5">{c.noActive}</Muted>
        )}
      </Section>

      <Section title={c.refills} className="lg:col-span-3" flush>
        {sorted.length ? (
          <MiniTable label={c.refills} head={[{ label: "Medication" }, { label: "Requested" }, { label: "Provider" }, { label: "Status" }, { label: "Actions", align: "right" }]}>
            {sorted.map((r) => {
              const open = r.status === "new" || r.status === "routed"
              return (
                <tr key={r.id}>
                  <td className={td}>
                    <span className="block text-neutral-950">
                      {r.medication} {r.dose}
                    </span>
                    {r.note && <span className="block text-neutral-500 text-micro">{r.note}</span>}
                  </td>
                  <td className={td}>
                    <span className="block whitespace-nowrap tabular-nums">{fmtDate(r.createdAt)}</span>
                    <span className="block text-neutral-400 text-micro">{relative(r.createdAt)}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{getDoctorSync(r.doctorId)?.name}</td>
                  <td className={td}>
                    <StatusBadge kind="refill" status={r.status} />
                  </td>
                  <td className={`${td} text-right`}>
                    {open && (
                      <span className="inline-flex gap-1.5">
                        <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-caption" onClick={() => notify.success(setRefillStatus(r, "denied"))} aria-label={`${c.deny} ${r.medication}`}>
                          {c.deny}
                        </Button>
                        <Button size="sm" className="h-8 rounded-full px-3 text-caption" onClick={() => notify.success(setRefillStatus(r, "approved"))} aria-label={`${c.approve} ${r.medication}`}>
                          {c.approve}
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </MiniTable>
        ) : (
          <Muted className="px-5 pb-5">{c.noRefills}</Muted>
        )}
      </Section>
    </div>
  )
}

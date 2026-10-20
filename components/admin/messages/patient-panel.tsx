"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Calendar03Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { messagesCopy as m } from "@/lib/data/admin-messages"
import { flaggedCount } from "@/lib/data/results"
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/admin/format"
import { allStaff, getDoctorSync, getPatientDetail } from "@/lib/admin/queries"
import { updateThread } from "@/lib/admin/actions"
import type { MessageThread } from "@/lib/admin/types"
import { useQuery } from "@/components/admin/hooks"
import { NewAppointmentDialog, SelectInput } from "@/components/admin/forms"
import { DetailSkeleton, ErrorState, notify, PatientCell, statusLabel, touchTarget } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-neutral-100 px-4 py-3.5">
      <h3 className="text-neutral-400 text-micro">{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  )
}

export function PatientPanel({ patientId, thread, onBack }: { patientId: string | null; thread: MessageThread | null; onBack: () => void }) {
  const { data, error, retry } = useQuery(() => (patientId ? getPatientDetail(patientId) : Promise.resolve(null)), [patientId])
  const [booking, setBooking] = React.useState(false)
  const staff = allStaff().filter((s) => s.status === "active")
  const detail = data && data.patient.id === patientId ? data : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3 md:px-4">
        <Button variant="ghost" size="icon-sm" aria-label={m.back} className={cn("rounded-full xl:hidden", touchTarget)} onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} />
        </Button>
        <h2 className="text-neutral-950 text-body">{m.context.title}</h2>
      </header>
      {!patientId ? (
        <p className="px-4 py-6 text-neutral-500 text-caption">{m.noThread.text}</p>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : !detail ? (
        <DetailSkeleton />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4">
            <PatientCell patient={detail.patient} />
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/patients/${detail.patient.id}`} />} className="w-fit rounded-full px-3 text-caption">
              {m.context.openChart}
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={1.8} data-icon="inline-end" />
            </Button>
          </div>

          <Section title={m.context.next}>
            {detail.next ? (
              <p className="text-neutral-950 text-caption">
                {fmtDateTime(detail.next.start)}
                <span className="block text-neutral-500 text-micro">{getDoctorSync(detail.next.doctorId)?.name} · {detail.next.reason}</span>
              </p>
            ) : (
              <p className="text-neutral-500 text-caption">{m.context.none}</p>
            )}
          </Section>

          <Section title={m.context.balance}>
            <p className={cn("tabular-nums text-caption", detail.patient.balance > 0 ? "text-amber-800" : "text-neutral-950")}>
              {fmtMoney(detail.patient.balance)}
              {detail.patient.balance > 0 && <span className="text-neutral-500"> · due</span>}
            </p>
          </Section>

          <Section title={m.context.allergies}>
            {detail.patient.allergies.length ? (
              <ul className="flex flex-wrap gap-1">
                {detail.patient.allergies.map((a) => (
                  <li key={a} className="inline-flex h-6 items-center rounded-full bg-red-50 px-2.5 text-red-700 text-micro">
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-caption">{m.context.noAllergies}</p>
            )}
          </Section>

          <Section title={m.context.results}>
            {detail.results.length ? (
              <ul className="flex flex-col gap-1.5">
                {detail.results.slice(0, 3).map((r) => {
                  const flagged = flaggedCount(r as Parameters<typeof flaggedCount>[0])
                  return (
                    <li key={r.id} className="flex items-baseline justify-between gap-2 text-caption">
                      <span className="min-w-0 truncate text-neutral-950">{r.title}</span>
                      <span className="shrink-0 text-neutral-500 tabular-nums text-micro">
                        {flagged > 0 && <span className="mr-1.5 text-amber-800">{flagged} flagged</span>}
                        {fmtDate(r.iso)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-neutral-500 text-caption">{m.context.noResults}</p>
            )}
          </Section>

          {thread && (
            <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="msg-assign" className="text-neutral-400 text-micro">
                  {m.context.assign}
                </label>
                <SelectInput
                  id="msg-assign"
                  value={thread.assignedToId}
                  onChange={(v) => {
                    updateThread(thread.id, { assignedToId: v })
                    notify.success(`Assigned to ${staff.find((s) => s.id === v)?.name}`)
                  }}
                  options={staff.map((s) => ({ value: s.id, label: `${s.name} · ${s.title}` }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="msg-status" className="text-neutral-400 text-micro">
                  {m.context.status}
                </label>
                <SelectInput
                  id="msg-status"
                  value={thread.status}
                  onChange={(v) => {
                    updateThread(thread.id, { status: v as MessageThread["status"] })
                    notify.success(`Marked as ${statusLabel("thread", v).toLowerCase()}`)
                  }}
                  options={(["open", "waiting", "closed"] as const).map((s) => ({ value: s, label: statusLabel("thread", s) }))}
                />
              </div>
            </div>
          )}
          <div className="px-4 py-4">
            <Button className="h-10 w-full rounded-full px-4 text-caption" onClick={() => setBooking(true)}>
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} data-icon="inline-start" />
              {m.context.book}
            </Button>
          </div>
        </div>
      )}
      <NewAppointmentDialog open={booking} onOpenChange={setBooking} defaults={patientId ? { patientId } : undefined} />
    </div>
  )
}

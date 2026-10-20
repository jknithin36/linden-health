"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { dayOf, fmtDateLong, fmtDateTime, fmtMoney, fmtTime, NOW, TODAY } from "@/lib/admin/format"
import { focusRing } from "@/lib/styles"
import { appointmentTimeline, getAppointmentSync, getClinicSync, getPatientSync, getPlanSync } from "@/lib/admin/queries"
import { setAppointmentStatus } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import { CancelDialog, RescheduleDialog, visitTypeLabel } from "@/components/admin/forms"
import { ConfirmDialog, DetailSheet, DoctorCell, KeyValue, notify, PatientCell, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"

/** Side sheet with an appointment's details, its check-in timeline, and the next actions. */
export function AppointmentSheet({ id, onOpenChange }: { id: string | null; onOpenChange: (open: boolean) => void }) {
  useAdminState((s) => s.version)
  const a = id ? getAppointmentSync(id) : undefined
  const [dialog, setDialog] = React.useState<null | "cancel" | "reschedule" | "no-show">(null)
  const p = a ? getPatientSync(a.patientId) : undefined

  const active = a && !["cancelled", "late-cancel", "no-show", "completed"].includes(a.status)
  const isToday = a && dayOf(a.start) === TODAY
  const canCheckIn = a && isToday && (a.status === "scheduled" || a.status === "confirmed" || a.status === "arrived")
  const canNoShow = a && isToday && a.start < NOW && (a.status === "scheduled" || a.status === "confirmed")
  const future = a && a.start > NOW

  const act = (msg: string) => notify.success(msg)

  return (
    <>
      <DetailSheet
        open={!!a}
        onOpenChange={onOpenChange}
        title={a ? `${fmtDateLong(a.start)} · ${fmtTime(a.start)}` : "Appointment"}
        description={a ? `${visitTypeLabel(a.visitType)} · ${a.durationMin} min · ${a.id.toUpperCase()}` : undefined}
        footer={
          a &&
          (canCheckIn || (a.status === "scheduled" && future) || canNoShow || (active && future)) && (
            <>
              {canCheckIn && (
                <Button className="h-10 rounded-full px-5 text-caption" onClick={() => act(setAppointmentStatus(a.id, "checked-in"))}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} data-icon="inline-start" />
                  Check in
                </Button>
              )}
              {a.status === "scheduled" && future && (
                <Button variant="outline" className="h-10 rounded-full px-5 text-caption" onClick={() => act(setAppointmentStatus(a.id, "confirmed"))}>
                  Mark confirmed
                </Button>
              )}
              {canNoShow && (
                <Button variant="outline" className="h-10 rounded-full px-5 text-caption" onClick={() => setDialog("no-show")}>
                  Mark no-show
                </Button>
              )}
              {active && future && (
                <>
                  <Button variant="outline" className="h-10 rounded-full px-5 text-caption" onClick={() => setDialog("reschedule")}>
                    Reschedule
                  </Button>
                  <Button variant="ghost" className="h-10 rounded-full px-4 text-red-700 hover:bg-red-50 hover:text-red-800 text-caption" onClick={() => setDialog("cancel")}>
                    Cancel visit
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {a && p && (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-3">
              <PatientCell patient={p} />
              <StatusBadge kind="appointment" status={a.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <KeyValue label="Provider" className="col-span-2">
                <DoctorCell id={a.doctorId} />
              </KeyValue>
              <KeyValue label="Where">
                {a.type === "video" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-sky-600" />
                    Video visit
                  </span>
                ) : (
                  <>
                    {getClinicSync(a.clinicId).name}
                    {a.room ? ` · Room ${a.room}` : ""}
                  </>
                )}
              </KeyValue>
              <KeyValue label="Booked">
                {fmtDateTime(a.bookedAt)} · <span className="capitalize">{a.source}</span>
              </KeyValue>
              <KeyValue label="Reason" className="col-span-2">
                {a.reason}
              </KeyValue>
              <KeyValue label="Insurance">
                {p.insurance ? getPlanSync(p.insurance.planId)?.name : "Self-pay"}
                <StatusBadge kind="insurance" status={a.insuranceVerified ? "verified" : "not-verified"} className="mt-1 flex w-fit" />
              </KeyValue>
              <KeyValue label="Forms">
                <StatusBadge kind="forms" status={a.formsDone ? "done" : "pending"} className="flex w-fit" />
              </KeyValue>
              <KeyValue label="Copay">{fmtMoney(a.copay)}</KeyValue>
              <KeyValue label="Phone">{p.phone}</KeyValue>
            </dl>

            {p.allergies.length > 0 && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-red-800 text-caption">
                <span className="text-red-700">Allergies:</span> {p.allergies.join(", ")}
              </p>
            )}

            <section aria-labelledby="timeline-h">
              <h3 id="timeline-h" className="text-neutral-950 text-caption">
                Timeline
              </h3>
              <ol className="mt-3 flex flex-col">
                {appointmentTimeline(a).map((s, i, list) => (
                  <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < list.length - 1 && <span aria-hidden="true" className={cn("absolute top-4 left-[5px] h-full w-px", s.done && list[i + 1].done ? "bg-neutral-950" : "bg-neutral-200")} />}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative mt-1 size-[11px] shrink-0 rounded-full border-2",
                        s.done ? (s.id === "cancelled" || s.id === "no-show" ? "border-red-500 bg-red-500" : "border-neutral-950 bg-neutral-950") : "border-neutral-300 bg-white",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 justify-between gap-3">
                      <span className={cn("text-caption", s.done ? "text-neutral-950" : "text-neutral-400")}>{s.label}</span>
                      {s.at && <span className="text-neutral-500 tabular-nums text-micro">{dayOf(s.at) === TODAY ? fmtTime(s.at) : fmtDateTime(s.at)}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href={`/admin/messages?patient=${p.id}`} className={cn("rounded-sm text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950 text-caption", focusRing.dark)}>
                Message {p.firstName}
              </Link>
              <Link href={`/admin/patients/${p.id}`} className={cn("self-start rounded-sm text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950 text-caption", focusRing.dark)}>
                Open {p.firstName}’s chart
              </Link>
            </div>
          </div>
        )}
      </DetailSheet>
      {a && dialog === "cancel" && <CancelDialog appointment={a} open onOpenChange={(o) => !o && setDialog(null)} />}
      {a && dialog === "reschedule" && <RescheduleDialog appointment={a} open onOpenChange={(o) => !o && setDialog(null)} />}
      {a && (
        <ConfirmDialog
          open={dialog === "no-show"}
          onOpenChange={(o) => !o && setDialog(null)}
          title="Mark as a no-show?"
          description={`${p?.name} hasn’t arrived for ${fmtTime(a.start)}. They’ll get a text offering to rebook.`}
          confirmLabel="Mark no-show"
          destructive
          onConfirm={() => notify.success(setAppointmentStatus(a.id, "no-show"))}
        />
      )}
    </>
  )
}

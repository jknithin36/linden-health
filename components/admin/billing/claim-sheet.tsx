"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Legal01Icon, Refresh01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { billingCopy } from "@/lib/data/admin-billing"
import { fmtDate, fmtDateLong, fmtDateTime, fmtMoney } from "@/lib/admin/format"
import { focusRing } from "@/lib/styles"
import { claimTimeline, currentUser, getAppointmentSync, getClaimSync, getPatientSync, getPlanSync } from "@/lib/admin/queries"
import { addClaimNote, updateClaims, writeOffClaim } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import { useMounted } from "@/hooks/use-mounted"
import { visitTypeLabel } from "@/components/admin/forms"
import { ConfirmDialog, DetailSheet, KeyValue, notify, PatientCell, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ClaimSheet({ id, onOpenChange }: { id: string | null; onOpenChange: (open: boolean) => void }) {
  const mounted = useMounted()
  const notes = useAdminState((s) => (id ? s.claimNotes[id] : undefined))
  useAdminState((s) => s.version)
  const c = mounted && id ? getClaimSync(id) : undefined
  const p = c ? getPatientSync(c.patientId) : undefined
  const appt = c ? getAppointmentSync(c.appointmentId) : undefined
  const plan = c ? getPlanSync(c.planId) : undefined
  const [note, setNote] = React.useState("")
  const [noteError, setNoteError] = React.useState("")
  const [confirm, setConfirm] = React.useState(false)
  const t = billingCopy.claimSheet

  const canResubmit = c && (c.status === "denied" || c.status === "draft" || c.status === "appealed")
  const canAppeal = c && c.status === "denied"
  const canWriteOff = c && c.patientResponsibility > 0
  const allowed = c ? c.lines.reduce((s, l) => s + l.allowed, 0) : 0

  const submitNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!c) return
    const v = note.trim()
    if (v.length < 3) return setNoteError("Write at least 3 characters.")
    if (v.length > 500) return setNoteError("Keep notes under 500 characters.")
    notify.success(addClaimNote(c.id, `${currentUser().name} · ${v}`))
    setNote("")
    setNoteError("")
  }

  return (
    <>
      <DetailSheet
        open={!!c}
        onOpenChange={onOpenChange}
        wide
        title={c ? c.claimNumber : "Claim"}
        description={c ? `${plan?.name ?? "Plan"} · service ${fmtDateLong(c.serviceDate)}` : undefined}
        footer={
          c &&
          (canResubmit || canAppeal || canWriteOff) && (
            <>
              {canResubmit && (
                <Button className="h-10 rounded-full px-5 text-caption" onClick={() => notify.success(updateClaims([c.id], "submitted"))}>
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={1.8} data-icon="inline-start" />
                  {t.resubmit}
                </Button>
              )}
              {canAppeal && (
                <Button variant="outline" className="h-10 rounded-full px-5 text-caption" onClick={() => notify.success(updateClaims([c.id], "appealed"))}>
                  <HugeiconsIcon icon={Legal01Icon} strokeWidth={1.8} data-icon="inline-start" />
                  {t.appeal}
                </Button>
              )}
              {canWriteOff && (
                <Button variant="ghost" className="h-10 rounded-full px-4 text-red-700 hover:bg-red-50 hover:text-red-800 text-caption" onClick={() => setConfirm(true)}>
                  {t.writeOff} {fmtMoney(c.patientResponsibility)}
                </Button>
              )}
            </>
          )
        }
      >
        {c && p && (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-3">
              <PatientCell patient={p} />
              <StatusBadge kind="claim" status={c.status} />
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KeyValue label="Billed">
                <span className="tabular-nums">{fmtMoney(c.amountBilled)}</span>
              </KeyValue>
              <KeyValue label="Insurance paid">
                <span className="tabular-nums">{fmtMoney(c.amountPaid)}</span>
              </KeyValue>
              <KeyValue label="Patient owes">
                <span className={cn("tabular-nums", c.patientResponsibility > 0 && "text-amber-800")}>{fmtMoney(c.patientResponsibility)}</span>
              </KeyValue>
              <KeyValue label="Member ID">{p.insurance?.memberId ?? "—"}</KeyValue>
              <KeyValue label="Visit">{appt ? `${visitTypeLabel(appt.visitType)} · ${fmtDate(appt.start)}` : fmtDate(c.serviceDate)}</KeyValue>
              <KeyValue label="Submitted">{c.status === "draft" ? "Not yet" : fmtDateTime(c.submittedAt)}</KeyValue>
            </dl>

            <section aria-labelledby="claim-lines-h">
              <h3 id="claim-lines-h" className="text-neutral-950 text-caption">
                {t.lines}
              </h3>
              <div className="relative mt-3 overflow-x-auto rounded-xl border border-neutral-200/70">
                <table className="w-full text-caption">
                  <thead className="bg-neutral-50 text-neutral-500 text-micro">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-regular">Code</th>
                      <th scope="col" className="px-3 py-2 text-left font-regular">Service</th>
                      <th scope="col" className="px-3 py-2 text-right font-regular">Billed</th>
                      <th scope="col" className="px-3 py-2 text-right font-regular">Allowed</th>
                      <th scope="col" className="px-3 py-2 text-right font-regular">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {c.lines.map((l, i) => (
                      <tr key={`${l.code}-${i}`}>
                        <td className="px-3 py-2.5 text-neutral-500 tabular-nums">{l.code}</td>
                        <td className="px-3 py-2.5 text-neutral-950">{l.label}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(l.billed)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(l.allowed)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtMoney(l.paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="claim-payer-h">
              <h3 id="claim-payer-h" className="text-neutral-950 text-caption">
                {t.payer}
              </h3>
              {c.status === "draft" || c.status === "submitted" || c.status === "pending" ? (
                <p className="mt-2 text-neutral-500 text-caption">{t.noPayer}</p>
              ) : (
                <div className={cn("mt-3 rounded-xl px-3.5 py-3 text-caption", c.status === "paid" ? "bg-emerald-50 text-emerald-900" : c.status === "denied" ? "bg-red-50 text-red-800" : "bg-sky-50 text-sky-900")}>
                  {c.status === "paid" && (
                    <p>
                      Allowed {fmtMoney(allowed)}, paid {fmtMoney(c.amountPaid)}. Patient responsibility {fmtMoney(c.patientResponsibility)} (copay and coinsurance).
                    </p>
                  )}
                  {c.status === "denied" && <p>Denied on {fmtDate(c.updatedAt)}: {c.denialReason ?? "No reason given"}. Fix the issue and resubmit, or file an appeal.</p>}
                  {c.status === "appealed" && <p>Appeal under review{c.denialReason ? ` (original denial: ${c.denialReason})` : ""}. Payers usually respond within 30 days.</p>}
                </div>
              )}
            </section>

            <section aria-labelledby="claim-timeline-h">
              <h3 id="claim-timeline-h" className="text-neutral-950 text-caption">
                {t.timeline}
              </h3>
              <ol className="mt-3 flex flex-col">
                {claimTimeline(c).map((s, i, list) => (
                  <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < list.length - 1 && <span aria-hidden="true" className={cn("absolute top-4 left-1.25 h-full w-px", s.tone !== "todo" && list[i + 1].tone !== "todo" ? "bg-neutral-950" : "bg-neutral-200")} />}
                    <span aria-hidden="true" className={cn("relative mt-1 size-2.75 shrink-0 rounded-full border-2", s.tone === "red" ? "border-red-500 bg-red-500" : s.tone === "todo" ? "border-neutral-300 bg-white" : "border-neutral-950 bg-neutral-950")} />
                    <div className="flex min-w-0 flex-1 justify-between gap-3">
                      <span className={cn("text-caption", s.tone === "todo" ? "text-neutral-400" : s.tone === "red" ? "text-red-700" : "text-neutral-950")}>
                        {s.label}
                        {s.by && <span className="block text-neutral-500 text-micro">{s.by}</span>}
                      </span>
                      {s.at && <span className="shrink-0 text-neutral-500 tabular-nums text-micro">{s.at.length > 10 ? fmtDateTime(s.at) : fmtDate(s.at)}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="claim-notes-h">
              <h3 id="claim-notes-h" className="text-neutral-950 text-caption">
                {t.notes}
              </h3>
              {notes?.length ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {notes.map((n, i) => {
                    const [who, ...rest] = n.split(" · ")
                    return (
                      <li key={i} className="rounded-xl bg-amber-50/70 px-3.5 py-2.5 text-neutral-900 text-caption">
                        {rest.length ? (
                          <>
                            <span className="block text-amber-900 text-micro">{who}</span>
                            {rest.join(" · ")}
                          </>
                        ) : (
                          n
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-neutral-500 text-caption">{t.notesEmpty}</p>
              )}
              <form onSubmit={submitNote} noValidate className="mt-3 flex flex-col gap-2">
                <label htmlFor="claim-note" className="sr-only">
                  {t.notes}
                </label>
                <Textarea
                  id="claim-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  aria-invalid={!!noteError || undefined}
                  className="min-h-20 rounded-xl border-neutral-200 shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 aria-invalid:border-red-500 text-caption"
                />
                {noteError && <p role="alert" className="text-red-700 text-micro">{noteError}</p>}
                <Button type="submit" variant="outline" className="h-9 self-end rounded-full px-4 text-caption">
                  {t.addNote}
                </Button>
              </form>
            </section>

            <Link href={`/admin/patients/${p.id}`} className={cn("self-start rounded-sm text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950 text-caption", focusRing.dark)}>
              Open {p.firstName}’s chart
            </Link>
          </div>
        )}
      </DetailSheet>
      {c && p && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t.writeOffTitle}
          description={t.writeOffText(fmtMoney(c.patientResponsibility), p.name)}
          confirmLabel={t.writeOff}
          destructive
          onConfirm={() => notify.success(writeOffClaim(c.id, c.patientResponsibility, c.patientId))}
        />
      )}
    </>
  )
}

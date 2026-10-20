"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { inboxCopy } from "@/lib/data/admin-doctor"
import { addDays, fmtDate, fmtDateLong, TODAY } from "@/lib/admin/format"
import { allRefills } from "@/lib/admin/queries"
import { approveRefill, denyRefill, labPanelsFor, lastCompletedVisit, medicationsFor, refillNeedsVisit, testFlag, type InboxRow } from "@/lib/admin/doctor"
import { FormRow, SelectInput } from "@/components/admin/forms"
import { KeyValue, notify } from "@/components/admin/ui"
import { RangeTrack, rangeText } from "@/components/admin/doctor/inbox/result-detail"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const c = inboxCopy.refill
const btn = "h-10 rounded-full px-4 text-caption"

/** Which lab matters for which medication. */
const labFor: Record<string, RegExp> = { Metformin: /a1c/i, Levothyroxine: /tsh/i, Atorvastatin: /lipid/i }

const approveSchema = z.object({ quantity: z.enum(["30", "90"]), refills: z.enum(["0", "1", "2", "3", "4", "5"]) })
const denySchema = z.object({ reason: z.string().trim().min(5, c.reasonMin).max(300) })

function ApproveDialog({ open, onOpenChange, label, onApprove, suggest90 }: { open: boolean; onOpenChange: (o: boolean) => void; label: string; onApprove: (q: number, r: number) => void; suggest90: boolean }) {
  const { control, handleSubmit, reset } = useForm<z.infer<typeof approveSchema>>({ resolver: zodResolver(approveSchema), defaultValues: { quantity: suggest90 ? "90" : "30", refills: "1" } })
  React.useEffect(() => {
    if (open) reset({ quantity: suggest90 ? "90" : "30", refills: "1" })
  }, [open, reset, suggest90])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-950 text-title">{c.approveTitle}</DialogTitle>
          <DialogDescription className="text-neutral-500 text-body">{label}</DialogDescription>
        </DialogHeader>
        <form id="approve-refill" onSubmit={handleSubmit((v) => onApprove(Number(v.quantity), Number(v.refills)))} className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormRow label={c.quantity} htmlFor="rf-qty">
                <SelectInput id="rf-qty" value={field.value} onChange={field.onChange} options={[{ value: "30", label: "30 tablets" }, { value: "90", label: "90 tablets" }]} />
              </FormRow>
            )}
          />
          <Controller
            control={control}
            name="refills"
            render={({ field }) => (
              <FormRow label={c.refills} htmlFor="rf-refills">
                <SelectInput id="rf-refills" value={field.value} onChange={field.onChange} options={["0", "1", "2", "3", "4", "5"].map((n) => ({ value: n, label: n === "1" ? "1 refill" : `${n} refills` }))} />
              </FormRow>
            )}
          />
        </form>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" className={btn} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="approve-refill" className={btn}>
            {c.approve}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DenyDialog({ open, onOpenChange, label, onDeny }: { open: boolean; onOpenChange: (o: boolean) => void; label: string; onDeny: (reason: string) => void }) {
  const { register, handleSubmit, reset, formState } = useForm<z.infer<typeof denySchema>>({ resolver: zodResolver(denySchema), defaultValues: { reason: "" } })
  React.useEffect(() => {
    if (open) reset({ reason: "" })
  }, [open, reset])
  const err = formState.errors.reason?.message
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-950 text-title">{c.denyTitle}</DialogTitle>
          <DialogDescription className="text-neutral-500 text-body">{label}</DialogDescription>
        </DialogHeader>
        <form id="deny-refill" onSubmit={handleSubmit((v) => onDeny(v.reason))}>
          <FormRow label={c.reason} htmlFor="rf-reason" error={err}>
            <Textarea
              id="rf-reason"
              {...register("reason")}
              aria-invalid={!!err || undefined}
              placeholder={c.reasonPlaceholder}
              className="min-h-24 border-neutral-200 bg-white shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 aria-invalid:border-red-500 text-caption md:text-caption"
            />
          </FormRow>
        </form>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" className={btn} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="deny-refill" className={`${btn} bg-red-600 text-white hover:bg-red-700`}>
            {c.deny}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RefillDetail({ item }: { item: InboxRow }) {
  const [dialog, setDialog] = React.useState<"approve" | "deny" | null>(null)
  const r = allRefills().find((x) => x.id === item.refId)
  if (!r) return null
  const done = item.status === "done"
  const med = medicationsFor(r.patientId).find((m) => m.name === r.medication)
  const last = lastCompletedVisit(r.patientId, addDays(TODAY, 1))
  const re = labFor[r.medication]
  const labs = re ? labPanelsFor(r.patientId).filter((l) => re.test(l.title)).slice(0, 1) : []
  const label = `${r.medication} ${r.dose}`
  // The patient’s own words (decisions are recorded on the inbox item, so the note stays as sent).
  const patientNote = r.note

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-neutral-400 text-micro">{c.medication}</p>
        <p className="text-neutral-950 text-title">{label}</p>
        {med ? <p className="text-neutral-500 text-caption">{med.frequency}</p> : <p className="text-amber-800 text-caption">{c.notOnList}</p>}
        {patientNote && <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 text-neutral-700 text-caption">“{patientNote}”</p>}
      </div>

      <dl className="grid grid-cols-2 gap-4 border-y border-neutral-100 py-4 sm:grid-cols-3">
        <KeyValue label={c.lastFilled}>{med ? `${fmtDateLong(med.lastFilledAt)}` : "—"}</KeyValue>
        <KeyValue label={c.refillsLeft}>{med ? med.refillsLeft : "—"}</KeyValue>
        <KeyValue label={c.lastVisit} className="col-span-2 sm:col-span-1">
          {last ? `${fmtDate(last.start)} · ${last.reason}` : "—"}
        </KeyValue>
      </dl>

      <div>
        <h3 className="text-neutral-950 text-body">{c.labs}</h3>
        {labs.length === 0 ? (
          <p className="mt-1 text-neutral-500 text-caption">{c.noLabs}</p>
        ) : (
          labs.map((l) => (
            <div key={l.id} className="mt-2">
              <p className="text-neutral-500 text-caption">
                {l.title} · {fmtDateLong(l.collectedAt)}
              </p>
              <ul className="mt-1 flex flex-col">
                {l.tests.map((t) => {
                  const f = testFlag(t)
                  return (
                    <li key={t.name} className="border-b border-neutral-100 py-3 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-neutral-950 text-caption">{t.name}</span>
                        <span className="text-neutral-950 tabular-nums text-caption">
                          {t.value} {t.unit} <span className={f === "normal" ? "text-emerald-700" : f === "high" ? "text-red-700" : "text-amber-800"}>· {f === "normal" ? "Normal" : f === "high" ? "High" : "Low"}</span>
                        </span>
                      </div>
                      <div className="mt-2">
                        <RangeTrack test={t} />
                      </div>
                      <p className="mt-1.5 text-neutral-500 tabular-nums text-micro">
                        Normal: {rangeText(t)}
                        {t.history.at(-1) ? ` · Previous ${t.history.at(-1)!.value} ${t.unit} (${fmtDate(t.history.at(-1)!.date)})` : ""}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className={btn} disabled={done} onClick={() => setDialog("approve")}>
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />
          {c.approve}
        </Button>
        <Button variant="outline" className={btn} disabled={done} onClick={() => setDialog("deny")}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
          {c.deny}
        </Button>
        <Button
          variant="outline"
          className={btn}
          disabled={done}
          onClick={() => {
            const undo = refillNeedsVisit(item.id, r.id)
            notify.undo("Booking link sent to the patient", undo)
          }}
        >
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
          {c.needsVisit}
        </Button>
      </div>

      <ApproveDialog
        open={dialog === "approve"}
        onOpenChange={(o) => setDialog(o ? "approve" : null)}
        label={label}
        suggest90={/90/.test(patientNote ?? "")}
        onApprove={(q, n) => {
          const undo = approveRefill(item.id, r.id, q, n)
          setDialog(null)
          notify.undo(`${r.medication} refill approved`, undo, `${q} tablets · ${n} refill${n === 1 ? "" : "s"}`)
        }}
      />
      <DenyDialog
        open={dialog === "deny"}
        onOpenChange={(o) => setDialog(o ? "deny" : null)}
        label={label}
        onDeny={(reason) => {
          const undo = denyRefill(item.id, r.id, reason)
          setDialog(null)
          notify.undo(`${r.medication} refill denied`, undo)
        }}
      />
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowLeft01Icon, CreditCardIcon, Message01Icon, PencilEdit02Icon, PlusSignIcon, StethoscopeIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { chartCopy as copy } from "@/lib/data/admin-patients"
import { ageText, fmtDateNumeric, fmtMoney } from "@/lib/admin/format"
import { getClinicSync, getDoctorSync, getPlanSync } from "@/lib/admin/queries"
import type { Patient } from "@/lib/admin/types"
import { Avatar, KeyValue, panel, patientPhoto, StatusBadge } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { EditPatientDialog } from "@/components/admin/patient-detail/edit-patient-dialog"

const btn = "h-10 rounded-full px-4 text-caption"

export function BackLink() {
  return (
    <Link href="/admin/patients" className={cn("inline-flex w-fit items-center gap-1 rounded-full text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}>
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} className="size-4" />
      {copy.back}
    </Link>
  )
}

/** A doctor's visit action for today's appointment (Start visit / Open visit / Sign note). */
export type VisitAction = { label: string; onClick: () => void }

/** `onPay` is left out for doctors, who don't take payments. */
export function PatientHeader({ patient: p, onBook, onPay, visit }: { patient: Patient; onBook: () => void; onPay?: () => void; visit?: VisitAction | null }) {
  const [editing, setEditing] = React.useState(false)
  const plan = p.insurance ? getPlanSync(p.insurance.planId) : null
  const doctor = getDoctorSync(p.primaryDoctorId)
  const l = copy.labels

  return (
    <header className={cn(panel, "flex flex-col")}>
      <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar name={p.name} id={p.id} src={patientPhoto(p)} eager className="size-14 text-body md:size-16" />
          <div className="min-w-0">
            <h1 className="text-neutral-950 text-page">{p.name}</h1>
            <p className="mt-1 text-neutral-500 tabular-nums text-caption">
              {ageText(p.dob)} · {p.sex === "F" ? "Female" : "Male"} · MRN {p.mrn}
            </p>
            {(p.flags.length > 0 || p.allergies.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {p.allergies.map((a) => (
                  <span key={a} className="inline-flex h-6 items-center gap-1 rounded-full bg-red-50 px-2.5 text-red-700 text-micro">
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="size-3" />
                    <span className="sr-only">Allergy: </span>
                    {a}
                  </span>
                ))}
                {p.flags.map((f) => (
                  <StatusBadge key={f} kind="flag" status={f} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {visit && (
            <Button className={btn} onClick={visit.onClick}>
              <HugeiconsIcon icon={StethoscopeIcon} strokeWidth={1.8} data-icon="inline-start" />
              {visit.label}
            </Button>
          )}
          <Button className={btn} variant={visit ? "outline" : "default"} onClick={onBook}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            {copy.actions.book}
          </Button>
          <Button variant="outline" className={btn} nativeButton={false} render={<Link href={`/admin/messages?patient=${p.id}`} />}>
            <HugeiconsIcon icon={Message01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {copy.actions.message}
          </Button>
          <Button variant="outline" className={btn} onClick={() => setEditing(true)}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.8} data-icon="inline-start" />
            {copy.actions.edit}
          </Button>
          {onPay && p.balance > 0 && (
            <Button variant="outline" className={btn} onClick={onPay}>
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={1.8} data-icon="inline-start" />
              {copy.actions.pay} · {fmtMoney(p.balance)}
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-neutral-100 px-5 py-4 md:px-6 lg:grid-cols-6">
        <KeyValue label={l.dob}>
          <span className="tabular-nums">{fmtDateNumeric(p.dob)}</span>
        </KeyValue>
        <KeyValue label={l.phone}>
          <a href={`tel:${p.phone.replace(/\D/g, "")}`} className={cn("rounded-sm tabular-nums hover:underline", focusRing.dark)}>
            {p.phone}
          </a>
        </KeyValue>
        <KeyValue label={l.email} className="min-w-0">
          <a href={`mailto:${p.email}`} className={cn("block truncate rounded-sm hover:underline", focusRing.dark)}>
            {p.email}
          </a>
        </KeyValue>
        <KeyValue label={l.insurance} className="min-w-0">
          {plan && p.insurance ? (
            <>
              <span className="block truncate">
                {plan.name} {p.insurance.planType}
              </span>
              <span className="block text-neutral-500 tabular-nums text-micro">{p.insurance.memberId}</span>
            </>
          ) : (
            l.selfPay
          )}
        </KeyValue>
        <KeyValue label={l.primary} className="min-w-0">
          <span className="block truncate">{doctor?.name}</span>
          <span className="block text-neutral-500 text-micro">{doctor?.specialty}</span>
        </KeyValue>
        <KeyValue label={l.clinic}>
          <span className="block">{getClinicSync(p.preferredClinicId).short}</span>
          <span className="block text-neutral-500 text-micro">
            {p.address}
          </span>
        </KeyValue>
      </dl>
      {p.allergies.length === 0 && <p className="sr-only">{l.noAllergies}</p>}

      <EditPatientDialog patient={p} open={editing} onOpenChange={setEditing} />
    </header>
  )
}

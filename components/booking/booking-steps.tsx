"use client"

import * as React from "react"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon, StarIcon, Tick02Icon, UserAdd01Icon, Video01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chip, portraitBackdrop } from "@/lib/styles"
import { bookingAccount, bookingCopy as copy } from "@/lib/data/booking"
import { checkerPlanNames } from "@/lib/data/insurance"
import { locationName } from "@/lib/data/site"
import { SlotPicker } from "@/components/doctors/slot-picker"
import { DateField, TextField } from "@/components/auth/auth-parts"
import { PlanCombobox } from "@/components/insurance/plan-combobox"
import { Media } from "@/components/site/media"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  availabilityForState,
  careById,
  careOptions,
  clinicsFor,
  doctorsFor,
  findDoctor,
  formatDob,
  detailsFor,
  memberFor,
  slotLabelFor,
  sortForPerson,
  whereFor,
  type BookingState,
  type DetailErrors,
  type Details,
  type Format,
} from "@/components/booking/booking-model"

type StepProps = { state: BookingState; set: (patch: Partial<BookingState>) => void; errors: DetailErrors }

/* ------------------------------- Shared pieces ----------------------------- */

/**
 * A selectable card backed by a real radio input, so arrow keys move between options and screen
 * readers announce "radio, 2 of 12". The whole card is the label.
 */
function OptionCard({ name, value, checked, onSelect, children, className }: { name: string; value: string; checked: boolean; onSelect: () => void; children: React.ReactNode; className?: string }) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer rounded-2xl border bg-white p-4 transition-colors",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-950 has-[:focus-visible]:ring-offset-2",
        checked ? "border-neutral-950 shadow-[inset_0_0_0_1px_var(--color-neutral-950)]" : "border-neutral-200 hover:border-neutral-400",
        className
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      {children}
      <span aria-hidden="true" className={cn("absolute top-3.5 right-3.5 grid size-5 place-items-center rounded-full border transition-colors", checked ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white text-transparent")}>
        <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2.6} className="size-3" />
      </span>
    </label>
  )
}

function Chips<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string; disabled?: boolean }[] }) {
  const id = React.useId()
  return (
    <div>
      <p id={id} className="mb-2.5 text-neutral-600 text-caption">
        {label}
      </p>
      <ToggleGroup
        aria-labelledby={id}
        value={[value]}
        onValueChange={(v: string[]) => {
          const next = v[v.length - 1] as T | undefined
          if (next) onChange(next)
        }}
        className="flex-wrap"
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.id} value={o.id} disabled={o.disabled} className={cn(chip, "text-caption disabled:opacity-40")}>
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/** Who the visit is for: the people on the signed-in account, or someone else. */
function PersonPicker({ state, set }: Pick<StepProps, "state" | "set">) {
  const c = copy.care
  const choose = (person: BookingState["person"]) => set({ person, details: detailsFor(person, state.details), doctorId: null, slot: null })
  return (
    <fieldset>
      <legend className="mb-2.5 text-neutral-600 text-caption">{c.forLabel}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {bookingAccount.family.map((m) => (
          <OptionCard key={m.id} name="person" value={m.id} checked={state.person === m.id} onSelect={() => choose(m.id)} className="p-3">
            <span className="flex min-w-0 items-center gap-2.5 pr-5 sm:flex-col sm:items-start">
              <Image src={m.avatar} alt="" width={80} height={80} className="size-9 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />
              <span className="min-w-0">
                <span className="block truncate text-neutral-950 text-caption">{m.firstName}</span>
                <span className="block truncate text-neutral-500 text-micro">{bookingAccount.relation(m)}</span>
              </span>
            </span>
          </OptionCard>
        ))}
        <OptionCard name="person" value="other" checked={state.person === "other"} onSelect={() => choose("other")} className="p-3">
          <span className="flex min-w-0 items-center gap-2.5 pr-5 sm:flex-col sm:items-start">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500">
              <HugeiconsIcon aria-hidden="true" icon={UserAdd01Icon} strokeWidth={1.8} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-neutral-950 text-caption">{c.someoneElse.label}</span>
              <span className="block truncate text-neutral-500 text-micro">{c.someoneElse.hint}</span>
            </span>
          </span>
        </OptionCard>
      </div>
    </fieldset>
  )
}

/* --------------------------------- 1 · Care -------------------------------- */

export function CareStep({ state, set, errors }: StepProps) {
  const care = careById(state.care)
  const c = copy.care
  const groups = [
    { id: "specialty", label: c.groups.specialties, items: careOptions.filter((o) => o.kind === "specialty") },
    { id: "service", label: c.groups.services, items: careOptions.filter((o) => o.kind === "service") },
  ]
  return (
    <div className="flex flex-col gap-8">
      <Field data-invalid={errors.care ? true : undefined} className="gap-2">
        <FieldLabel htmlFor="book-care" className="text-neutral-600 text-caption">
          {c.careLabel}
        </FieldLabel>
        <Select
          items={careOptions.map((o) => ({ value: o.id, label: o.label }))}
          value={state.care}
          onValueChange={(id: string | null) => {
            const o = careById(id)
            if (!o) return
            set({
              care: o.id,
              doctorId: null,
              slot: null,
              ...(o.inPersonOnly ? { format: "in-person" as Format } : {}),
              ...(o.locations && !o.locations.includes(state.clinic) ? { clinic: "all" } : {}),
            })
          }}
        >
          <SelectTrigger
            id="book-care"
            aria-invalid={errors.care ? true : undefined}
            className={cn(
              "h-12 w-full justify-between rounded-xl border-neutral-200 bg-white px-4 shadow-none hover:border-neutral-300 data-[size=default]:h-12 text-body",
              "focus-visible:border-neutral-950 focus-visible:ring-0 data-popup-open:border-neutral-950 aria-invalid:border-red-500 [&_svg]:text-neutral-400"
            )}
          >
            <SelectValue placeholder={c.carePlaceholder} />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} sideOffset={6} className="max-h-80 min-w-(--anchor-width) rounded-2xl bg-white p-1.5">
            {groups.map((g, i) => (
              <SelectGroup key={g.id} className={cn(i > 0 && "mt-1 border-t border-neutral-100 pt-1")}>
                <SelectLabel className="px-3 pt-2 pb-1 text-neutral-400 text-micro">{g.label}</SelectLabel>
                {g.items.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="rounded-lg px-3 py-2.5 text-neutral-800 text-body">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {care ? <p className="text-pretty text-neutral-500 text-caption">{care.summary}</p> : null}
        {errors.care && <FieldError className="text-caption">{errors.care}</FieldError>}
      </Field>

      <div className="flex flex-col gap-6">
        <div>
          <Chips<Format> label={c.formatLabel} value={state.format} onChange={(format) => set({ format, slot: null })} options={c.formats.map((f) => ({ id: f.id as Format, label: f.label, disabled: f.id === "video" && !!care?.inPersonOnly }))} />
          <p className="mt-2 text-neutral-500 text-caption">{care?.inPersonOnly ? c.inPersonOnly : c.formats.find((f) => f.id === state.format)?.hint}</p>
        </div>
        <PersonPicker state={state} set={set} />
        <Field className="gap-2">
          <FieldLabel htmlFor="book-reason" className="text-neutral-600 text-caption">
            {c.reasonLabel}
          </FieldLabel>
          <Textarea
            id="book-reason"
            value={state.reason}
            maxLength={c.reasonMax}
            onChange={(e) => set({ reason: e.target.value })}
            placeholder={c.reasonPlaceholder}
            rows={3}
            className="min-h-24 rounded-xl border-neutral-200 bg-white px-4 py-3 shadow-none hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 text-body"
          />
          <p className="text-right text-neutral-400 tabular-nums text-micro">
            {state.reason.length}/{c.reasonMax}
          </p>
        </Field>
      </div>
    </div>
  )
}

/* -------------------------------- 2 · Doctor ------------------------------- */

export function DoctorStep({ state, set }: StepProps) {
  const d = copy.doctor
  const care = careById(state.care)
  const list = sortForPerson(doctorsFor(state), state.person)
  const member = memberFor(state.person)
  const clinics = clinicsFor(state.care)
  const anyNext = availabilityForState(null).flatMap((x) => x.slots)[0]?.label
  return (
    <div className="flex flex-col gap-6">
      {state.format === "in-person" ? (
        <Chips label={d.clinicLabel} value={state.clinic} onChange={(clinic) => set({ clinic, doctorId: null, slot: null })} options={[...(clinics.length > 1 ? [{ id: "all", label: d.allClinics }] : []), ...clinics.map((l) => ({ id: l, label: l }))]} />
      ) : (
        <p className="flex items-start gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-neutral-600 text-caption">
          <HugeiconsIcon aria-hidden="true" icon={Video01Icon} strokeWidth={1.8} className="mt-px size-4 shrink-0" />
          {d.videoNote}
        </p>
      )}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="sr-only">{copy.steps[1].title}</legend>
        <OptionCard name="doctor" value="any" checked={state.doctorId === null} onSelect={() => set({ doctorId: null, slot: null })}>
          <span className="flex min-w-0 items-center gap-4 pr-7">
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-500">
              <HugeiconsIcon aria-hidden="true" icon={StarIcon} strokeWidth={1.7} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-neutral-950 text-body">{d.anyTitle}</span>
              <span className="block text-pretty text-neutral-500 text-caption">{d.anyHint}</span>
              {anyNext && <span className="mt-1 block text-emerald-700 text-caption">{d.next(anyNext)}</span>}
            </span>
          </span>
        </OptionCard>

        {care?.kind === "specialty" &&
          list.map((doc) => {
            const next = availabilityForState(doc.id).flatMap((x) => x.slots)[0]?.label
            return (
              <OptionCard key={doc.id} name="doctor" value={doc.id} checked={state.doctorId === doc.id} onSelect={() => set({ doctorId: doc.id, slot: null })}>
                <span className="flex min-w-0 items-center gap-4 pr-7">
                  <Media image={doc.image} alt="" placeholder={doc.placeholder} sizes="56px" className={cn("size-14 shrink-0 rounded-2xl", portraitBackdrop)} imageClassName="mix-blend-multiply object-[50%_20%]" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 text-neutral-950 text-body">
                      {doc.name}, {doc.credentials}
                      {member?.primaryDoctor.slug === doc.slug && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 text-micro">{d.yours(member.relation === "self" ? null : member.firstName)}</span>}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-1.5 text-neutral-500 text-caption">
                      <HugeiconsIcon aria-hidden="true" icon={Location01Icon} strokeWidth={1.8} className="size-3.5" />
                      {locationName(doc.location)}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        <span className="sr-only">{d.ratingLabel(doc.rating.toFixed(1))}, </span>
                        <span aria-hidden="true">{doc.rating.toFixed(1)} ★ </span>({d.reviews(doc.reviewCount)})
                      </span>
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-3 text-caption">
                      {next && <span className="text-emerald-700">{d.next(next)}</span>}
                      <span className="text-neutral-400">{doc.acceptingNewPatients ? d.newPatients : d.notAccepting}</span>
                    </span>
                  </span>
                </span>
              </OptionCard>
            )
          })}
        {care?.kind === "specialty" && list.length === 0 && <p className="rounded-2xl bg-neutral-50 px-4 py-6 text-center text-neutral-500 text-caption">{d.none}</p>}
      </fieldset>
    </div>
  )
}

/* --------------------------------- 3 · Time -------------------------------- */

export function TimeStep({ state, set, errors }: StepProps) {
  const doc = findDoctor(state.doctorId)
  const days = availabilityForState(state.doctorId)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-neutral-500 text-caption">{doc ? copy.time.with(`${doc.name}, ${doc.credentials}`) : copy.time.withAny}</p>
      <SlotPicker key={state.doctorId ?? "any"} days={days} value={state.slot} onValueChange={(slot) => set({ slot })} dayLabel={copy.time.day} timeLabel={copy.time.time} openLabel={copy.time.open} />
      {errors.slot && <FieldError className="text-caption">{errors.slot}</FieldError>}
    </div>
  )
}

/* -------------------------------- 4 · Details ------------------------------ */

export function DetailsStep({ state, set, errors, goTo }: StepProps & { goTo: (step: number) => void }) {
  const c = copy.details
  const d = state.details
  const member = memberFor(state.person)
  const put = (patch: Partial<Details>) => set({ details: { ...d, ...patch } })
  const field = (key: "firstName" | "lastName" | "email" | "phone", type = "text") => {
    const f = c[key]
    return <TextField label={f.label} placeholder={f.placeholder} autoComplete={f.autoComplete} type={type} value={d[key]} onChange={(e) => put({ [key]: e.target.value })} error={errors[key]} />
  }
  const onFilePlan = member && d.insurance === "plan" && d.plan === bookingAccount.insurance.plan && d.memberId === bookingAccount.insurance.memberId
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="book-patient" className="flex flex-col gap-4">
        <h3 id="book-patient" className="text-neutral-950 text-body">
          {c.patientTitle}
        </h3>
        {member ? (
          // A person on the account: everything is on file already.
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200/70 p-4">
            <Image src={member.avatar} alt="" width={96} height={96} className="size-12 shrink-0 rounded-full bg-neutral-100 object-cover object-top" />
            <div className="min-w-0 flex-1">
              <p className="text-neutral-950 text-body">{member.name}</p>
              <p className="text-neutral-500 tabular-nums text-caption">{c.onFile(formatDob(bookingAccount.dob[member.id]))}</p>
            </div>
            <button type="button" onClick={() => goTo(0)} className="rounded-full px-2.5 py-1 text-neutral-600 underline-offset-4 outline-none hover:text-neutral-950 hover:underline focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption">
              {c.change}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("firstName")}
              {field("lastName")}
              <DateField label={c.dob.label} placeholder={c.dob.placeholder} value={d.dob} onChange={(dob) => put({ dob })} error={errors.dob} />
            </div>
            <Chips label={c.patientType.label} value={d.patientType} onChange={(patientType) => put({ patientType })} options={c.patientType.options.map((o) => ({ id: o.id as Details["patientType"], label: o.label }))} />
          </>
        )}
      </section>

      <section aria-labelledby="book-contact" className="flex flex-col gap-4 border-t border-neutral-100 pt-8">
        <div>
          <h3 id="book-contact" className="text-neutral-950 text-body">
            {c.contactTitle}
          </h3>
          <p className="mt-0.5 text-neutral-500 text-caption">{c.contactHint}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("email", "email")}
          {field("phone", "tel")}
        </div>
        <label className="flex items-center gap-2.5 text-neutral-700 text-caption">
          <Checkbox checked={d.texts} onCheckedChange={(v) => put({ texts: !!v })} />
          {c.texts}
        </label>
      </section>

      <section aria-labelledby="book-insurance" className="flex flex-col gap-4 border-t border-neutral-100 pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="book-insurance" className="text-neutral-950 text-body">
            {c.insuranceTitle}
          </h3>
          {onFilePlan && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 text-micro">{c.onFileInsurance}</span>}
        </div>
        <Chips label={c.payLabel} value={d.insurance} onChange={(insurance) => put({ insurance })} options={c.insuranceOptions.map((o) => ({ id: o.id as Details["insurance"], label: o.label }))} />
        {d.insurance === "plan" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={errors.plan ? true : undefined} className="gap-2">
              <FieldLabel htmlFor="book-plan" className="text-neutral-600 text-caption">
                {c.planLabel}
              </FieldLabel>
              <PlanCombobox id="book-plan" items={checkerPlanNames} value={d.plan} onValueChange={(plan) => put({ plan })} placeholder={c.planPlaceholder} emptyText={c.planEmpty} />
              {errors.plan && <FieldError className="text-caption">{errors.plan}</FieldError>}
            </Field>
            <TextField label={c.memberId.label} placeholder={c.memberId.placeholder} value={d.memberId} onChange={(e) => put({ memberId: e.target.value })} />
          </div>
        ) : (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-neutral-600 text-caption">{c.selfPayNote}</p>
        )}
      </section>
    </div>
  )
}

/* -------------------------------- 5 · Review ------------------------------- */

export function ReviewStep({ state, goTo }: { state: BookingState; goTo: (step: number) => void }) {
  const r = copy.review
  const doc = findDoctor(state.doctorId)
  const d = state.details
  const groups: { step: number; rows: { label: string; value: string }[] }[] = [
    {
      step: 0,
      rows: [
        { label: r.rows.care, value: `${careById(state.care)?.label} · ${copy.care.formats.find((f) => f.id === state.format)?.label}` },
        ...(state.reason.trim() ? [{ label: r.rows.note, value: state.reason.trim() }] : []),
      ],
    },
    { step: 1, rows: [{ label: r.rows.doctor, value: doc ? `${doc.name}, ${doc.credentials}` : copy.anyDoctor }, { label: r.rows.where, value: whereFor(state) }] },
    { step: 2, rows: [{ label: r.rows.time, value: slotLabelFor(state.doctorId, state.slot) ?? "" }] },
    {
      step: 3,
      rows: [
        { label: r.rows.patient, value: `${d.firstName} ${d.lastName}`.trim() },
        { label: r.rows.contact, value: `${d.email} · ${d.phone}` },
        { label: r.rows.insurance, value: d.insurance === "self" ? r.selfPay : `${d.plan}${d.memberId ? ` · ${d.memberId}` : ""}` },
      ],
    },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/70">
        {groups.map((g) => (
          <div key={g.step} className="flex items-start gap-4 px-5 py-4">
            <dl className="grid min-w-0 flex-1 gap-2.5">
              {g.rows.map((row) => (
                <div key={row.label} className="grid gap-0.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-neutral-500 text-caption">{row.label}</dt>
                  <dd className="text-pretty break-words text-neutral-950 text-body">{row.value}</dd>
                </div>
              ))}
            </dl>
            <button type="button" onClick={() => goTo(g.step)} className="shrink-0 rounded-full px-2.5 py-1 text-neutral-600 underline-offset-4 outline-none hover:text-neutral-950 hover:underline focus-visible:ring-2 focus-visible:ring-neutral-950 text-caption">
              {r.edit}
              <span className="sr-only"> {g.rows[0].label.toLowerCase()}</span>
            </button>
          </div>
        ))}
      </div>
      <p className="text-pretty text-neutral-500 text-caption">{r.policy}</p>
    </div>
  )
}

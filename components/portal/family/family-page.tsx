"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowRight01Icon, CheckmarkCircle02Icon, Clock01Icon, PlusSignIcon, SquareLock02Icon, UserGroupIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chip, focusRing } from "@/lib/styles"
import { family, personById, portalToday, portalUser, type FamilyMember } from "@/lib/data/portal"
import { insurance } from "@/lib/data/billing"
import { familyCopy as copy, memberAccess, relationships, sexes, shareItems, type MemberAccess } from "@/lib/data/family"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DateField } from "@/components/auth/auth-parts"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { field, panel, sheetClass } from "@/components/portal/styles"

type Added = { id: string; first: string; last: string; relationship: string; adult: boolean; age: number | null }

/** Reads ?add=1 (the "+" on the overview) to open the add sheet straight away. */
export function FamilyPageWithParams() {
  const params = useSearchParams()
  return <FamilyPage startAdding={params.get("add") === "1"} />
}

export function FamilyPage({ startAdding = false }: { startAdding?: boolean }) {
  const [adding, setAdding] = React.useState(startAdding)
  const [added, setAdded] = React.useState<Added[]>([])
  const [managing, setManaging] = React.useState<MemberAccess | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
          <p className="mt-2 text-pretty text-neutral-500 text-body">{copy.intro}</p>
        </div>
        <Button size="lg" className="self-start rounded-full px-5 text-caption md:self-auto" onClick={() => setAdding(true)}>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          {copy.add}
        </Button>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {family.map((m) => (
          <MemberCard key={m.id} member={m} access={memberAccess.find((a) => a.personId === m.id)!} onManage={setManaging} />
        ))}
        {added.map((a) => (
          <li key={a.id} className={cn(panel, "flex items-center gap-4 p-5 md:p-6")}>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700 text-title">{a.first[0]}</span>
            <div className="min-w-0">
              <p className="text-neutral-950 text-title">
                {a.first} {a.last}
              </p>
              <p className="text-neutral-500 text-caption">
                {a.relationship}
                {a.age !== null && ` · ${copy.card.age(a.age)}`}
              </p>
              <p className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-micro", a.adult ? "bg-sky-50 text-sky-800" : "bg-emerald-50 text-emerald-800")}>
                <HugeiconsIcon icon={a.adult ? Clock01Icon : CheckmarkCircle02Icon} strokeWidth={1.8} className="size-3" />
                {a.adult ? copy.card.invited : copy.card.newMember}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="access-explainer" className="rounded-2xl bg-neutral-50 p-5 md:p-6">
        <h2 id="access-explainer" className="flex items-center gap-2 text-neutral-950 text-body">
          <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={1.8} className="size-4 text-neutral-500" />
          {copy.explainer.title}
        </h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          {[copy.explainer.children, copy.explainer.adults].map((e) => (
            <div key={e.title}>
              <dt className="text-neutral-950 text-caption">{e.title}</dt>
              <dd className="mt-0.5 text-pretty text-neutral-600 text-body">{e.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <AddSheet open={adding} onOpenChange={setAdding} onAdd={(a) => setAdded((l) => [...l, a])} />
      <ManageSheet access={managing} onOpenChange={(o) => !o && setManaging(null)} />
    </div>
  )
}

function MemberCard({ member: m, access, onManage }: { member: FamilyMember; access: MemberAccess; onManage: (a: MemberAccess) => void }) {
  const c = copy.card
  return (
    // `id` is the target of the overview's family photos (/portal/family#lily); scroll-mt clears the sticky top bar.
    <li id={m.id} className={cn(panel, "flex scroll-mt-24 flex-col p-5 md:p-6 target:border-neutral-950")}>
      <div className="flex items-center gap-4">
        <PersonAvatar person={m} className="size-14" />
        <div className="min-w-0">
          <p className="text-neutral-950 text-title">{m.name}</p>
          <p className="text-neutral-500 text-caption">
            {access.relationship} · {c.age(m.age)}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 pt-4">
        <div>
          <dt className="text-neutral-400 text-micro">{c.doctor}</dt>
          <dd className="text-neutral-950 text-caption">
            <Link href={m.primaryDoctor.href} className={cn("rounded-sm hover:underline underline-offset-4", focusRing.dark)}>
              {m.primaryDoctor.name}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400 text-micro">{c.next}</dt>
          <dd className="text-neutral-950 text-caption">{m.nextVisit ? `${m.nextVisit.label} · ${m.nextVisit.date}` : c.noVisit}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-neutral-400 text-micro">{c.access}</dt>
          <dd className="text-neutral-950 text-caption">{access.access}</dd>
        </div>
      </dl>

      {access.alert && (
        <Link
          href={access.alert.href}
          className={cn("mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-amber-900 transition-colors hover:bg-amber-100/70 text-caption", focusRing.dark)}
        >
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.8} className="size-4 shrink-0 text-amber-600" />
          <span className="flex-1">{access.alert.label}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="size-3.5 text-amber-700" />
        </Link>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button nativeButton={false} render={<Link href={c.viewCareHref(m.id)} />} variant="outline" size="sm" className="rounded-full px-3.5 text-caption">
          {c.viewCare}
        </Button>
        <Button nativeButton={false} render={<Link href={c.bookHref(m.primaryDoctor.slug)} />} variant="outline" size="sm" className="rounded-full px-3.5 text-caption">
          {c.book(m.firstName)}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3.5 text-caption" onClick={() => onManage(access)}>
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.8} data-icon="inline-start" />
          {c.manage}
        </Button>
      </div>
    </li>
  )
}

/* -------------------------------- Add member -------------------------------- */

/** Age on the portal's pinned day, so it never depends on today's date. */
function ageFrom(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number)
  const [ty, tm, td] = portalToday.iso.split("-").map(Number)
  return ty - y - (mo > tm || (mo === tm && d > td) ? 1 : 0)
}

function AddSheet({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (a: Added) => void }) {
  const s = copy.addSheet
  const empty = { relationship: relationships[0].id, first: "", last: "", dob: "", sex: "", insurance: "same" }
  const [form, setForm] = React.useState(empty)
  const [errors, setErrors] = React.useState<Partial<Record<"first" | "last" | "dob", string>>>({})
  const [done, setDone] = React.useState<string | null>(null)
  const ids = { rel: React.useId(), first: React.useId(), last: React.useId(), sex: React.useId(), ins: React.useId() }
  const rel = relationships.find((r) => r.id === form.relationship)!

  const close = (o: boolean) => {
    if (!o) {
      setForm(empty)
      setErrors({})
      setDone(null)
    }
    onOpenChange(o)
  }

  const submit = () => {
    const next: typeof errors = {}
    if (!form.first.trim()) next.first = s.required
    if (!form.last.trim()) next.last = s.required
    if (!form.dob) next.dob = s.required
    setErrors(next)
    if (next.first || next.last) document.getElementById(next.first ? ids.first : ids.last)?.focus()
    if (Object.keys(next).length) return
    onAdd({ id: `added-${Date.now()}`, first: form.first.trim(), last: form.last.trim(), relationship: rel.label, adult: rel.adult, age: ageFrom(form.dob) })
    setDone(s.success(form.first.trim(), rel.adult))
  }

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent className={sheetClass}>
        <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
          <SheetTitle className="pr-8 text-neutral-950 text-title">{s.title}</SheetTitle>
          <SheetDescription className="sr-only">{s.title}</SheetDescription>
        </SheetHeader>
        <div aria-live="polite" className="flex flex-1 flex-col gap-5 p-6">
          {done ? (
            <div className="flex flex-col items-start gap-4">
              <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-5" />
              </span>
              <p className="text-pretty text-neutral-950 text-lead">{done}</p>
            </div>
          ) : (
            <>
              <div>
                <p id={ids.rel} className="mb-2 text-neutral-500 text-caption">
                  {s.relationship}
                </p>
                <ToggleGroup
                  aria-labelledby={ids.rel}
                  value={[form.relationship]}
                  onValueChange={(v: string[]) => {
                    const next = v[v.length - 1]
                    if (next) setForm((f) => ({ ...f, relationship: next }))
                  }}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {relationships.map((r) => (
                    <ToggleGroupItem key={r.id} value={r.id} className={cn(chip, "h-9 px-3.5 text-caption")}>
                      {r.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {rel.adult && <p className="mt-2 rounded-xl bg-sky-50 px-3.5 py-2.5 text-sky-900 text-caption">{s.adultNote}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["first", "last"] as const).map((k) => (
                  <div key={k}>
                    <label htmlFor={ids[k]} className="mb-1.5 block text-neutral-600 text-caption">
                      {k === "first" ? s.firstName : s.lastName}
                    </label>
                    <Input
                      id={ids[k]}
                      autoComplete="off"
                      value={form[k]}
                      aria-invalid={errors[k] ? true : undefined}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, [k]: e.target.value }))
                        setErrors((x) => ({ ...x, [k]: undefined }))
                      }}
                      placeholder={k === "last" ? portalUser.name.split(" ")[1] : undefined}
                      className={field}
                    />
                    {errors[k] && <p className="mt-1.5 text-red-700 text-caption">{errors[k]}</p>}
                  </div>
                ))}
              </div>
              <DateField
                label={s.dob}
                placeholder={s.dobPlaceholder}
                value={form.dob}
                onChange={(dob) => {
                  setForm((f) => ({ ...f, dob }))
                  setErrors((x) => ({ ...x, dob: undefined }))
                }}
                error={errors.dob}
              />
              <div>
                <p id={ids.sex} className="mb-2 text-neutral-500 text-caption">
                  {s.sex}
                </p>
                <ToggleGroup
                  aria-labelledby={ids.sex}
                  value={form.sex ? [form.sex] : []}
                  onValueChange={(v: string[]) => setForm((f) => ({ ...f, sex: v[v.length - 1] ?? "" }))}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {sexes.map((x) => (
                    <ToggleGroupItem key={x} value={x} className={cn(chip, "h-9 px-3.5 text-caption")}>
                      {x}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div>
                <p id={ids.ins} className="mb-2 text-neutral-500 text-caption">
                  {s.insurance}
                </p>
                <RadioGroup aria-labelledby={ids.ins} value={form.insurance} onValueChange={(v) => setForm((f) => ({ ...f, insurance: v as string }))} className="gap-2">
                  {[
                    { id: "same", label: s.sameInsurance(insurance.name) },
                    { id: "other", label: s.otherInsurance },
                  ].map((o) => (
                    <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-body", form.insurance === o.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200")}>
                      <RadioGroupItem value={o.id} />
                      {o.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
        </div>
        <div className="border-t border-neutral-100 p-6">
          {done ? (
            <Button size="lg" variant="outline" className="w-full rounded-full text-caption" onClick={() => close(false)}>
              {s.done}
            </Button>
          ) : (
            <Button size="lg" className="w-full rounded-full text-caption" onClick={submit}>
              {s.submit}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------- Manage access ------------------------------ */

function ManageSheet({ access, onOpenChange }: { access: MemberAccess | null; onOpenChange: (o: boolean) => void }) {
  const s = copy.manageSheet
  const member = access ? personById(access.personId) : null
  const isOwner = access?.personId === "sarah"
  return (
    <Sheet open={access !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        {access && member && (
          <>
            <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
              <div className="flex items-center gap-3">
                <PersonAvatar person={member} className="size-10" />
                <SheetTitle className="pr-8 text-neutral-950 text-title">{s.title(member.firstName)}</SheetTitle>
              </div>
              <SheetDescription className="text-neutral-500 text-caption">{isOwner ? s.owner : access.controlsOwn ? s.onlyThem(member.firstName) : s.guardian}</SheetDescription>
            </SheetHeader>
            <div className="p-6">
              {!isOwner && <p className="mb-3 text-neutral-500 text-caption">{s.sharedWith(portalUser.firstName)}</p>}
              <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                {shareItems.map((i) => {
                  const on = access.shared.includes(i.id)
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex items-center gap-2.5 text-neutral-950 text-body">
                        {on ? (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-5 text-emerald-600" />
                        ) : (
                          <span aria-hidden="true" className="size-[18px] rounded-full border-[1.5px] border-neutral-300" />
                        )}
                        {i.label}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-micro", on ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600")}>{on ? s.on : s.off}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

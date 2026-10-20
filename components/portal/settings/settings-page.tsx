"use client"

import * as React from "react"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, ComputerIcon, Download01Icon, SmartPhone01Icon, Upload01Icon } from "@hugeicons/core-free-icons"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { chip } from "@/lib/styles"
import { portalUser } from "@/lib/data/portal"
import {
  alerts as seedAlerts,
  channels,
  clinics,
  defaultReminders,
  devices as seedDevices,
  languages,
  profile as seedProfile,
  reminderTimes,
  settingsCopy as copy,
  type Channel,
} from "@/lib/data/settings"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FilterSelect } from "@/components/site/filter-select"
import { DateField } from "@/components/auth/auth-parts"
import { field, panel } from "@/components/portal/styles"

function Saved({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 text-emerald-700 text-caption">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4" />
      {children}
    </p>
  )
}

function Row({ title, hint, children }: { title: React.ReactNode; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-neutral-950 text-body">{title}</div>
        {hint && <div className="text-pretty text-neutral-500 text-caption">{hint}</div>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
      <Tabs defaultValue="profile" className="gap-6">
        <TabsList className="-mx-5 h-10 w-[calc(100%+2.5rem)] justify-start overflow-x-auto bg-transparent px-5 sm:mx-0 sm:w-fit sm:bg-neutral-100 sm:px-[3px]">
          {copy.tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 rounded-full px-4 text-caption max-sm:bg-neutral-100 max-sm:data-active:bg-neutral-950 max-sm:data-active:text-white">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
        <TabsContent value="notifications">
          <Notifications />
        </TabsContent>
        <TabsContent value="security">
          <Security />
        </TabsContent>
        <TabsContent value="privacy">
          <Privacy />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* --------------------------------- Profile --------------------------------- */

const phoneOk = (v: string) => v.replace(/\D/g, "").length === 10

function Profile() {
  const p = copy.profile
  const [form, setForm] = React.useState(seedProfile)
  const [photo, setPhoto] = React.useState<string>(portalUser.avatar)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saved, setSaved] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const id = React.useId()

  React.useEffect(() => () => void (photo.startsWith("blob:") && URL.revokeObjectURL(photo)), [photo])

  const set = (key: string, value: string) => {
    setSaved(false)
    setErrors((e) => ({ ...e, [key]: "" }))
    setForm((f) => (key.startsWith("emergency.") ? { ...f, emergency: { ...f.emergency, [key.split(".")[1]]: value } } : { ...f, [key]: value }))
  }

  const save = () => {
    const next: Record<string, string> = {}
    if (!form.first.trim()) next.first = p.errors.required
    if (!form.last.trim()) next.last = p.errors.required
    if (!z.email().safeParse(form.email).success) next.email = p.errors.email
    if (!phoneOk(form.phone)) next.phone = p.errors.phone
    if (form.emergency.phone && !phoneOk(form.emergency.phone)) next["emergency.phone"] = p.errors.phone
    setErrors(next)
    setSaved(!Object.values(next).some(Boolean))
    // Move focus to the first field that needs fixing.
    const first = Object.keys(next)[0]
    if (first) document.getElementById(`${id}-${first}`)?.focus()
  }

  const text = (key: string, label: string, value: string, opts: { type?: string; autoComplete?: string; span?: boolean } = {}) => (
    <div className={cn(opts.span && "sm:col-span-2")}>
      <label htmlFor={`${id}-${key}`} className="mb-1.5 block text-neutral-600 text-caption">
        {label}
      </label>
      <Input
        id={`${id}-${key}`}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        value={value}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
        onChange={(e) => set(key, e.target.value)}
        className={field}
      />
      {errors[key] && (
        <p id={`${id}-${key}-error`} className="mt-1.5 text-red-700 text-caption">
          {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <section className={cn(panel, "flex flex-col gap-6 p-5 md:p-6")}>
        <div className="flex items-center gap-4">
          <Image src={photo} alt="" width={128} height={128} unoptimized={photo.startsWith("blob:")} className="size-16 rounded-full bg-violet-100 object-cover" />
          <div>
            <p className="text-neutral-950 text-body">{p.photo}</p>
            <p className="text-neutral-500 text-caption">{p.photoHint}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            aria-hidden="true"
            tabIndex={-1}
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setPhoto(URL.createObjectURL(f))
                setSaved(false)
              }
            }}
          />
          <Button variant="outline" size="sm" className="ml-auto rounded-full px-3.5 text-caption" onClick={() => fileRef.current?.click()}>
            <HugeiconsIcon icon={Upload01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {p.changePhoto}
          </Button>
        </div>

        <div className="grid gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
          {text("first", p.fields.first, form.first, { autoComplete: "given-name" })}
          {text("last", p.fields.last, form.last, { autoComplete: "family-name" })}
          <DateField label={p.fields.dob} placeholder={p.fields.dob} value={form.dob} onChange={(v) => set("dob", v)} />
          {text("email", p.fields.email, form.email, { type: "email", autoComplete: "email" })}
          {text("phone", p.fields.phone, form.phone, { type: "tel", autoComplete: "tel" })}
          {text("address", p.fields.address, form.address, { autoComplete: "street-address" })}
          <div>
            <p className="mb-1.5 text-neutral-600 text-caption">{p.fields.language}</p>
            <FilterSelect ariaLabel={p.fields.language} value={form.language} onValueChange={(v) => set("language", v)} options={languages.map((l) => ({ value: l, label: l }))} className="h-11 w-full rounded-xl data-[size=default]:h-11 sm:w-full" />
          </div>
          <div>
            <p className="mb-1.5 text-neutral-600 text-caption">{p.fields.clinic}</p>
            <FilterSelect ariaLabel={p.fields.clinic} value={form.clinic} onValueChange={(v) => set("clinic", v)} options={clinics} className="h-11 w-full rounded-xl data-[size=default]:h-11 sm:w-full" />
          </div>
        </div>

        <fieldset className="grid gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-3">
          <legend className="mb-3 text-neutral-950 text-body sm:col-span-3">{p.emergency.title}</legend>
          {text("emergency.name", p.emergency.name, form.emergency.name)}
          {text("emergency.relationship", p.emergency.relationship, form.emergency.relationship)}
          {text("emergency.phone", p.emergency.phone, form.emergency.phone, { type: "tel" })}
        </fieldset>
      </section>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" className="rounded-full px-6 text-caption" onClick={save}>
          {p.save}
        </Button>
        {saved && <Saved>{p.saved}</Saved>}
      </div>
    </div>
  )
}

/* ------------------------------ Notifications ------------------------------ */

function Notifications() {
  const n = copy.notifications
  const [prefs, setPrefs] = React.useState(() => Object.fromEntries(seedAlerts.map((a) => [a.id, a.on])) as Record<string, Channel[]>)
  const [times, setTimes] = React.useState(defaultReminders)
  const [touched, setTouched] = React.useState(false)
  const timingId = React.useId()

  const toggle = (alert: string, ch: Channel, on: boolean) => {
    setTouched(true)
    setPrefs((p) => ({ ...p, [alert]: on ? [...p[alert], ch] : p[alert].filter((c) => c !== ch) }))
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={cn(panel, "px-5 py-2 md:px-6")}>
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-100 hover:bg-transparent">
              <TableHead className="h-11 pl-0 text-neutral-400 text-caption">{n.alert}</TableHead>
              {channels.map((c) => (
                <TableHead key={c.id} className="h-11 w-16 text-center text-neutral-400 text-caption sm:w-24">
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {seedAlerts.map((a) => (
              <TableRow key={a.id} className="border-neutral-100 hover:bg-neutral-50/70">
                <TableCell className="py-3.5 pl-0 whitespace-normal text-neutral-950 text-body">{a.label}</TableCell>
                {channels.map((c) => (
                  <TableCell key={c.id} className="py-3.5 text-center">
                    <span className="inline-flex">
                      <Checkbox aria-label={n.toggle(a.label, c.label)} checked={prefs[a.id].includes(c.id)} onCheckedChange={(v: boolean) => toggle(a.id, c.id, v)} className="size-[18px] border-neutral-300" />
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section aria-labelledby={timingId} className={cn(panel, "p-5 md:p-6")}>
        <h2 id={timingId} className="text-neutral-950 text-body">
          {n.timing}
        </h2>
        <p className="text-neutral-500 text-caption">{n.timingHint}</p>
        <ToggleGroup
          multiple
          aria-labelledby={timingId}
          value={times}
          onValueChange={(v: string[]) => {
            setTouched(true)
            setTimes(v)
          }}
          className="mt-4 flex flex-wrap justify-start gap-2"
        >
          {reminderTimes.map((t) => (
            <ToggleGroupItem key={t.id} value={t.id} className={cn(chip, "h-9 px-4 text-caption")}>
              {t.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      {touched ? <Saved>{n.autosave}</Saved> : <p className="text-neutral-400 text-caption">{n.autosave}</p>}
    </div>
  )
}

/* --------------------------------- Security -------------------------------- */

const strong = (v: string) => v.length >= 8 && /\d/.test(v) && /[^A-Za-z0-9]/.test(v)

function Security() {
  const s = copy.security
  const [changing, setChanging] = React.useState(false)
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" })
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof pw, string>>>({})
  const [pwSaved, setPwSaved] = React.useState(false)
  const [twoStep, setTwoStep] = React.useState(true)
  const [devices, setDevices] = React.useState(seedDevices)
  const [signedOut, setSignedOut] = React.useState(false)
  const ids = { current: React.useId(), next: React.useId(), confirm: React.useId(), twoStep: React.useId() }

  const savePw = () => {
    const e: typeof errors = {}
    if (!pw.current) e.current = s.errors.current
    if (!strong(pw.next)) e.next = s.errors.weak
    if (pw.confirm !== pw.next) e.confirm = s.errors.match
    setErrors(e)
    if (Object.keys(e).length) return
    setPwSaved(true)
    setChanging(false)
    setPw({ current: "", next: "", confirm: "" })
  }

  return (
    <section className={cn(panel, "divide-y divide-neutral-100 p-5 md:p-6")}>
      <div className="pb-5">
        <Row title={s.password} hint={pwSaved ? undefined : s.passwordChanged}>
          {!changing && (
            <Button variant="outline" size="sm" className="rounded-full px-3.5 text-caption" onClick={() => setChanging(true)}>
              {s.changePassword}
            </Button>
          )}
        </Row>
        {pwSaved && <Saved>{s.updated}</Saved>}
        {changing && (
          <div className="mt-4 grid gap-3 sm:max-w-md">
            {(["current", "next", "confirm"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={ids[k]} className="mb-1.5 block text-neutral-600 text-caption">
                  {s[k]}
                </label>
                <Input
                  id={ids[k]}
                  type="password"
                  autoComplete={k === "current" ? "current-password" : "new-password"}
                  value={pw[k]}
                  aria-invalid={errors[k] ? true : undefined}
                  onChange={(e) => {
                    setPw((x) => ({ ...x, [k]: e.target.value }))
                    setErrors((x) => ({ ...x, [k]: undefined }))
                  }}
                  className={field}
                />
                {k === "next" && !errors.next && <p className="mt-1.5 text-neutral-400 text-micro">{s.hint}</p>}
                {errors[k] && <p className="mt-1.5 text-red-700 text-caption">{errors[k]}</p>}
              </div>
            ))}
            <div className="mt-1 flex gap-2.5">
              <Button size="lg" className="rounded-full px-5 text-caption" onClick={savePw}>
                {s.save}
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full px-5 text-caption" onClick={() => setChanging(false)}>
                {s.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="py-5">
        <Row title={<label htmlFor={ids.twoStep}>{s.twoStep}</label>} hint={twoStep ? s.twoStepOn(seedProfile.phone) : s.twoStepOff}>
          <Switch id={ids.twoStep} checked={twoStep} onCheckedChange={setTwoStep} />
        </Row>
      </div>

      <div className="pt-5">
        <p className="text-neutral-950 text-body">{s.devices}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3.5">
              <span className="grid size-9 place-items-center rounded-full bg-white text-neutral-600">
                <HugeiconsIcon icon={d.kind === "phone" ? SmartPhone01Icon : ComputerIcon} strokeWidth={1.7} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-neutral-950 text-body">{d.name}</span>
                <span className="block text-neutral-500 text-caption">{d.detail}</span>
              </span>
              {d.current ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800 text-micro">{s.thisDevice}</span>
              ) : (
                <Button variant="ghost" size="sm" className="rounded-full px-3 text-caption" onClick={() => setDevices((l) => l.filter((x) => x.id !== d.id))}>
                  {s.signOut}
                </Button>
              )}
            </li>
          ))}
        </ul>
        {devices.some((d) => !d.current) ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full px-3.5 text-caption"
            onClick={() => {
              setDevices((l) => l.filter((x) => x.current))
              setSignedOut(true)
            }}
          >
            {s.signOutOthers}
          </Button>
        ) : (
          signedOut && (
            <div className="mt-3">
              <Saved>{s.signedOut}</Saved>
            </div>
          )
        )}
      </div>
    </section>
  )
}

/* --------------------------------- Privacy --------------------------------- */

function Privacy() {
  const s = copy.privacy
  const [requested, setRequested] = React.useState(false)
  const [research, setResearch] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const [agree, setAgree] = React.useState(false)
  const [closedNote, setClosedNote] = React.useState(false)
  const researchId = React.useId()

  return (
    <div className="flex flex-col gap-6">
      <section className={cn(panel, "divide-y divide-neutral-100 p-5 md:p-6")}>
        <div className="pb-5">
          <Row title={s.download} hint={requested ? undefined : s.downloadHint}>
            {!requested && (
              <Button variant="outline" size="sm" className="rounded-full px-3.5 text-caption" onClick={() => setRequested(true)}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
                {s.request}
              </Button>
            )}
          </Row>
          {requested && <Saved>{s.requested}</Saved>}
        </div>
        <div className="py-5">
          <p className="text-neutral-950 text-body">{s.whoTitle}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {s.who.map((w) => (
              <li key={w} className="flex items-center gap-2 text-neutral-600 text-body">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4 text-emerald-600" />
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-5">
          <Row title={<label htmlFor={researchId}>{s.research}</label>} hint={s.researchHint}>
            <Switch id={researchId} checked={research} onCheckedChange={setResearch} />
          </Row>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 p-5 md:p-6">
        <Row title={<span className="text-red-700">{s.close}</span>} hint={s.closeHint}>
          <Button variant="outline" size="sm" className="rounded-full border-red-200 px-3.5 text-red-700 hover:bg-red-50 hover:text-red-800 text-caption" onClick={() => setClosing(true)}>
            {s.close}
          </Button>
        </Row>
        {closedNote && (
          <p role="status" className="mt-3 text-neutral-600 text-caption">
            {s.closeDialog.demo}
          </p>
        )}
      </section>

      <AlertDialog
        open={closing}
        onOpenChange={(o) => {
          setClosing(o)
          if (!o) setAgree(false)
        }}
      >
        <AlertDialogContent className="gap-5 rounded-3xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-neutral-950 text-title">{s.closeDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty text-neutral-500 text-body">{s.closeDialog.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex cursor-pointer items-start gap-3 text-neutral-800 text-body">
            <Checkbox checked={agree} onCheckedChange={(v: boolean) => setAgree(v)} className="mt-0.5" />
            {s.closeDialog.confirm}
          </label>
          <AlertDialogFooter className="gap-2.5 sm:justify-end">
            <AlertDialogCancel variant="outline" size="lg" className="rounded-full px-5 text-caption">
              {s.closeDialog.keep}
            </AlertDialogCancel>
            <Button
              size="lg"
              disabled={!agree}
              className="rounded-full bg-red-600 px-5 text-white hover:bg-red-700 text-caption"
              onClick={() => {
                setClosing(false)
                setAgree(false)
                setClosedNote(true)
              }}
            >
              {s.closeDialog.submit}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

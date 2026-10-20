"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Download01Icon,
  File01Icon,
  Image01Icon,
  InjectionIcon,
  Share08Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { family, personById, type PersonId } from "@/lib/data/portal"
import { pastVisits, visitDoctor, type PastVisit } from "@/lib/data/visits"
import { allTests, flaggedCount, results } from "@/lib/data/results"
import {
  documents as seedDocuments,
  hasAllergies,
  healthSummaries,
  recordsCopy as copy,
  shareables,
  vaccineRecords,
  type RecordDocument,
  type VaccineStatus,
} from "@/lib/data/records"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { PersonFilter, type PersonFilterValue } from "@/components/portal/person-filter"
import { summaryText, VisitDetailSheet } from "@/components/portal/visits/visit-dialogs"
import { download } from "@/components/portal/download"
import { EmptyState as Empty } from "@/components/portal/status-parts"
import { field, panel, sheetClass } from "@/components/portal/styles"

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT = ["application/pdf", "image/jpeg", "image/png"]

const vaccineTone: Record<VaccineStatus, string> = {
  due: "bg-amber-50 text-amber-800",
  given: "bg-emerald-50 text-emerald-800",
  complete: "bg-emerald-50 text-emerald-800",
  recommended: "bg-neutral-100 text-neutral-700",
  upcoming: "bg-sky-50 text-sky-800",
}
const summaryTone = { due: "bg-amber-50 text-amber-800", ok: "bg-emerald-50 text-emerald-800", recommended: "bg-neutral-100 text-neutral-700" }

function PersonCell({ id }: { id: PersonId }) {
  const p = personById(id)
  return (
    <span className="flex items-center gap-2 text-neutral-950 text-caption">
      <PersonAvatar person={p} className="size-6" />
      {p.firstName}
    </span>
  )
}

export function RecordsPage() {
  const [person, setPerson] = React.useState<PersonFilterValue>("all")
  const [docs, setDocs] = React.useState(seedDocuments)
  const [notesFor, setNotesFor] = React.useState<PastVisit | null>(null)
  const [preview, setPreview] = React.useState<RecordDocument | null>(null)
  const [share, setShare] = React.useState<null | "doctor" | "myself">(null)

  const mine = <T extends { personId: PersonId }>(list: T[]) => list.filter((x) => person === "all" || x.personId === person)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
          <p className="mt-2 text-pretty text-neutral-500 text-body">{copy.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button size="lg" variant="outline" className="rounded-full px-5 text-caption" onClick={() => setShare("myself")}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {copy.downloadAll}
          </Button>
          <Button size="lg" className="rounded-full px-5 text-caption" onClick={() => setShare("doctor")}>
            <HugeiconsIcon icon={Share08Icon} strokeWidth={1.8} data-icon="inline-start" />
            {copy.share}
          </Button>
        </div>
      </header>

      <PersonFilter value={person} onValueChange={setPerson} label={copy.filters.person} allLabel={copy.filters.allFamily} />

      <Tabs defaultValue="notes" className="gap-5">
        <TabsList className="-mx-5 h-10 w-[calc(100%+2.5rem)] justify-start overflow-x-auto bg-transparent px-5 sm:mx-0 sm:w-fit sm:bg-neutral-100 sm:px-[3px]">
          {copy.tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 rounded-full px-4 text-caption max-sm:bg-neutral-100 max-sm:data-active:bg-neutral-950 max-sm:data-active:text-white">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="notes">
          <VisitNotes visits={mine(pastVisits)} onView={setNotesFor} />
        </TabsContent>
        <TabsContent value="vaccines">
          <Vaccines person={person} />
        </TabsContent>
        <TabsContent value="documents">
          <Documents
            docs={mine(docs)}
            uploadFor={person === "all" ? "sarah" : person}
            onUpload={(d) => setDocs((list) => [d, ...list])}
            onView={setPreview}
          />
        </TabsContent>
        <TabsContent value="summary">
          <Summary personId={person === "all" ? "sarah" : person} showHint={person === "all"} />
        </TabsContent>
      </Tabs>

      <VisitDetailSheet visit={notesFor} onOpenChange={(o) => !o && setNotesFor(null)} />
      <DocumentSheet doc={preview} onOpenChange={(o) => !o && setPreview(null)} />
      <ShareSheet mode={share} onOpenChange={(o) => !o && setShare(null)} />
    </div>
  )
}

/* -------------------------------- Visit notes ------------------------------- */

function VisitNotes({ visits, onView }: { visits: PastVisit[]; onView: (v: PastVisit) => void }) {
  const n = copy.notes
  if (!visits.length) return <Empty>{n.empty}</Empty>
  const actions = (v: PastVisit) => (
    <span className="flex gap-2">
      <Button variant="outline" size="sm" className="rounded-full px-3 text-caption" onClick={() => onView(v)}>
        {n.view}
      </Button>
      <Button variant="ghost" size="sm" className="rounded-full px-3 text-caption" onClick={() => download(`visit-notes-${v.id}.txt`, summaryText(v))}>
        <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
        {n.download}
      </Button>
    </span>
  )
  return (
    <div className={cn(panel, "px-5 py-2 md:px-6")}>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="border-neutral-100 hover:bg-transparent">
            {[n.columns.date, n.columns.patient, n.columns.visit, n.columns.doctor].map((h, i) => (
              <TableHead key={h} className={cn("h-11 text-neutral-400 text-caption", i === 0 && "pl-0")}>
                {h}
              </TableHead>
            ))}
            <TableHead className="h-11 pr-0 text-right text-neutral-400 text-caption">{n.columns.file}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((v) => (
            <TableRow key={v.id} className="border-neutral-100 hover:bg-neutral-50/70">
              <TableCell className="py-3 pl-0 text-neutral-600 tabular-nums text-caption">{v.date}</TableCell>
              <TableCell className="py-3">
                <PersonCell id={v.personId} />
              </TableCell>
              <TableCell className="py-3 text-neutral-950 text-body">{v.title}</TableCell>
              <TableCell className="py-3 text-neutral-600 text-caption">{visitDoctor(v.doctorSlug).name}</TableCell>
              <TableCell className="py-3 pr-0">
                <span className="flex justify-end">{actions(v)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul className="divide-y divide-neutral-100 md:hidden">
        {visits.map((v) => (
          <li key={v.id} className="flex flex-col gap-2.5 py-4">
            <div className="flex items-start gap-3">
              <PersonAvatar person={personById(v.personId)} className="size-8" />
              <div className="min-w-0">
                <p className="text-neutral-950 text-body">{v.title}</p>
                <p className="text-neutral-500 text-caption">
                  {personById(v.personId).firstName} · {v.date} · {visitDoctor(v.doctorSlug).short}
                </p>
              </div>
            </div>
            <div className="pl-11">{actions(v)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* --------------------------------- Vaccines --------------------------------- */

function vaccineText(personId: PersonId) {
  const r = vaccineRecords.find((x) => x.personId === personId)!
  const p = personById(personId)
  const f = copy.vaccines.file
  return [f.title(p.name, p.age), f.clinic, "", ...r.vaccines.map((v) => f.line(v.name, v.dose, v.date, copy.vaccines.status[v.status]))].join("\n")
}

function Vaccines({ person }: { person: PersonFilterValue }) {
  const v = copy.vaccines
  const records = vaccineRecords.filter((r) => person === "all" || r.personId === person)
  return (
    <div className="flex flex-col gap-4">
      {records.map((r) => {
        const p = personById(r.personId)
        return (
          <section key={r.personId} aria-labelledby={`vax-${r.personId}`} className={cn(panel, "p-5 md:p-6")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PersonAvatar person={p} className="size-10" />
                <div>
                  <h2 id={`vax-${r.personId}`} className="text-neutral-950 text-title">
                    {p.firstName}
                    <span className="text-neutral-400 text-body">, {p.age}</span>
                  </h2>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-micro", summaryTone[r.summary.tone])}>{r.summary.label}</span>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full px-3 text-caption" onClick={() => download(`vaccine-record-${r.personId}.txt`, vaccineText(r.personId))}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
                {v.download}
              </Button>
            </div>
            <Table className="mt-3">
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  {[v.columns.vaccine, v.columns.dose, v.columns.date].map((h, i) => (
                    <TableHead key={h} className={cn("h-9 text-neutral-400 text-caption", i === 0 && "pl-0")}>
                      {h}
                    </TableHead>
                  ))}
                  <TableHead className="h-9 pr-0 text-right text-neutral-400 text-caption">{v.columns.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.vaccines.map((x) => (
                  <TableRow key={`${x.name}-${x.dose}`} className="border-neutral-100 hover:bg-transparent">
                    <TableCell className="py-2.5 pl-0">
                      <span className="flex items-center gap-2.5 text-neutral-950 text-body">
                        <HugeiconsIcon icon={InjectionIcon} strokeWidth={1.7} className="size-4 text-neutral-400" />
                        {x.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-neutral-600 text-caption">{x.dose}</TableCell>
                    <TableCell className={cn("py-2.5 text-caption", x.status === "due" ? "text-amber-800" : "text-neutral-600")}>{x.date}</TableCell>
                    <TableCell className="py-2.5 pr-0 text-right">
                      <span className={cn("rounded-full px-2 py-0.5 text-micro", vaccineTone[x.status])}>{v.status[x.status]}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )
      })}
      <div className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-neutral-700 text-body">{v.downloadNote}</p>
        <Button nativeButton={false} render={<Link href={v.book.href} />} size="lg" className="self-start rounded-full px-5 text-caption sm:self-auto">
          {v.book.label}
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------- Documents --------------------------------- */

function Documents({
  docs,
  uploadFor,
  onUpload,
  onView,
}: {
  docs: RecordDocument[]
  uploadFor: PersonId
  onUpload: (d: RecordDocument) => void
  onView: (d: RecordDocument) => void
}) {
  const d = copy.documents
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPT.includes(file.type)) return setNotice({ tone: "error", text: d.wrongType })
    if (file.size > MAX_BYTES) return setNotice({ tone: "error", text: d.tooBig })
    const kb = file.size / 1024
    onUpload({
      id: `upload-${file.name}-${file.size}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      personId: uploadFor,
      added: d.today,
      type: file.type === "application/pdf" ? "PDF" : "Image",
      note: d.uploadedNote,
      size: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`,
    })
    setNotice({ tone: "ok", text: d.added(file.name, personById(uploadFor).firstName) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-neutral-300 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-neutral-100 text-neutral-600">
            <HugeiconsIcon icon={Upload01Icon} strokeWidth={1.7} className="size-[18px]" />
          </span>
          <div>
            <p className="text-neutral-950 text-body">{d.upload}</p>
            <p className="text-neutral-500 text-caption">{d.uploadHint}</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          aria-hidden="true"
          tabIndex={-1}
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        <Button size="lg" variant="outline" className="self-start rounded-full px-5 text-caption sm:self-auto" onClick={() => fileRef.current?.click()}>
          {d.upload}
        </Button>
      </div>
      {notice && (
        <p role="status" className={cn("rounded-xl px-4 py-3 text-body", notice.tone === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>
          {notice.text}
        </p>
      )}

      {docs.length === 0 ? (
        <Empty>{d.empty}</Empty>
      ) : (
        <ul className={cn(panel, "divide-y divide-neutral-100 px-5 md:px-6")}>
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600">
                <HugeiconsIcon icon={doc.type === "PDF" ? File01Icon : Image01Icon} strokeWidth={1.7} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-neutral-950 text-body">{doc.name}</span>
                <span className="flex flex-wrap items-center gap-x-1.5 text-neutral-500 text-caption">
                  {personById(doc.personId).firstName} · {doc.added} · {doc.type}
                  {doc.note && <span className="text-neutral-400">· {doc.note}</span>}
                </span>
              </span>
              <Button variant="outline" size="sm" className="shrink-0 rounded-full px-3 text-caption" onClick={() => onView(doc)}>
                {d.view}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DocumentSheet({ doc, onOpenChange }: { doc: RecordDocument | null; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={doc !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-md">
        {doc && (
          <>
            <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
              <SheetTitle className="pr-8 text-neutral-950 text-title">{doc.name}</SheetTitle>
              <SheetDescription className="text-neutral-500 text-caption">
                {personById(doc.personId).name} · {doc.added} · {doc.type} · {doc.size}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="grid aspect-[3/4] place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-300">
                <HugeiconsIcon icon={doc.type === "PDF" ? File01Icon : Image01Icon} strokeWidth={1.2} className="size-14" />
              </div>
              <p className="text-pretty text-neutral-500 text-caption">{copy.documents.previewNote}</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------ Health summary ------------------------------ */

function summaryFor(personId: PersonId) {
  const s = healthSummaries.find((x) => x.personId === personId)!
  const c = copy.summary
  const doc = visitDoctor(s.primaryDoctor)
  return {
    rows: [
      [c.conditions, s.conditions],
      [c.allergies, s.allergies],
      [c.medications, s.medications],
      [c.procedures, s.procedures],
      [c.familyHistory, s.familyHistory],
      [c.primaryDoctor, `${doc.name}, ${doc.credentials}`],
    ] as [string, string][],
  }
}

function Summary({ personId, showHint }: { personId: PersonId; showHint: boolean }) {
  const p = personById(personId)
  const c = copy.summary
  const { rows } = summaryFor(personId)
  return (
    <section aria-labelledby="summary" className={cn(panel, "p-5 md:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PersonAvatar person={p} className="size-10" />
          <h2 id="summary" className="text-neutral-950 text-title">
            {c.for(p.firstName)}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full px-3 text-caption"
          onClick={() => download(`health-summary-${personId}.txt`, [`${c.for(p.name)}`, "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n"))}
        >
          <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} data-icon="inline-start" />
          {c.download}
        </Button>
      </div>
      {showHint && <p className="mt-3 text-neutral-500 text-caption">{c.pick}</p>}
      <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-neutral-400 text-caption">{k}</dt>
            <dd className={cn("mt-0.5 text-pretty text-body", k === c.allergies && hasAllergies(v) ? "text-red-700" : "text-neutral-950")}>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* --------------------------------- Share sheet ------------------------------ */

const emailSchema = z.email()

function ShareSheet({ mode, onOpenChange }: { mode: null | "doctor" | "myself"; onOpenChange: (o: boolean) => void }) {
  const s = copy.shareSheet
  const [who, setWho] = React.useState<"doctor" | "myself">("doctor")
  const [picked, setPicked] = React.useState<string[]>(shareables.map((x) => x.id))
  const [form, setForm] = React.useState({ name: "", clinic: "", email: "" })
  const [errors, setErrors] = React.useState<{ email?: string; picked?: string }>({})
  const [done, setDone] = React.useState<string | null>(null)
  const [last, setLast] = React.useState(mode)
  if (mode !== last) {
    setLast(mode)
    if (mode) {
      setWho(mode)
      setPicked(shareables.map((x) => x.id))
      setForm({ name: "", clinic: "", email: "" })
      setErrors({})
      setDone(null)
    }
  }
  const ids = { who: React.useId(), records: React.useId(), name: React.useId(), clinic: React.useId(), email: React.useId() }

  const b = s.bundle
  const bundle = () =>
    [
      b.title,
      "",
      ...(picked.includes("notes") ? [b.notes, ...pastVisits.map((v) => summaryText(v) + "\n")] : []),
      ...(picked.includes("results") ? [b.results, ...results.map((r) => b.result(personById(r.personId).firstName, r.title, r.date, allTests(r).length - flaggedCount(r), allTests(r).length)), ""] : []),
      ...(picked.includes("vaccines") ? [b.vaccines, ...family.map((m) => vaccineText(m.id) + "\n")] : []),
      ...(picked.includes("summary") ? [b.summaries, ...family.map((m) => summaryFor(m.id).rows.map(([k, v]) => `${m.firstName} · ${k}: ${v}`).join("\n") + "\n")] : []),
    ].join("\n")

  const submit = () => {
    if (!picked.length) return setErrors({ picked: s.pickOne })
    if (who === "myself") {
      download(b.filename, bundle())
      return setDone(s.downloaded)
    }
    if (!emailSchema.safeParse(form.email).success) return setErrors({ email: s.emailError })
    setDone(s.shared(form.name || form.clinic || form.email))
  }

  return (
    <Sheet open={mode !== null} onOpenChange={onOpenChange}>
      <SheetContent className={sheetClass}>
        <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
          <SheetTitle className="pr-8 text-neutral-950 text-title">{s.title}</SheetTitle>
          <SheetDescription className="text-neutral-500 text-caption">{s.expiry}</SheetDescription>
        </SheetHeader>
        <div aria-live="polite" className="flex flex-1 flex-col gap-6 p-6">
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
                <p id={ids.who} className="mb-2 text-neutral-500 text-caption">
                  {s.who}
                </p>
                <RadioGroup aria-labelledby={ids.who} value={who} onValueChange={(v) => setWho(v as "doctor" | "myself")} className="gap-2">
                  {s.whoOptions.map((o) => (
                    <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-body", who === o.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200")}>
                      <RadioGroupItem value={o.id} />
                      {o.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <fieldset>
                <legend id={ids.records} className="mb-2 text-neutral-500 text-caption">
                  {s.records}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {shareables.map((x) => (
                    <label key={x.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 p-3 text-body">
                      <Checkbox
                        checked={picked.includes(x.id)}
                        onCheckedChange={(v: boolean) => {
                          setErrors((e) => ({ ...e, picked: undefined }))
                          setPicked((p) => (v ? [...p, x.id] : p.filter((y) => y !== x.id)))
                        }}
                      />
                      {x.label}
                    </label>
                  ))}
                </div>
                {errors.picked && <p className="mt-2 text-red-700 text-caption">{errors.picked}</p>}
              </fieldset>
              {who === "doctor" && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-2 text-neutral-500 text-caption">{s.sendTo}</legend>
                  {(["name", "clinic", "email"] as const).map((k) => (
                    <div key={k}>
                      <label htmlFor={ids[k]} className="mb-1.5 block text-neutral-600 text-caption">
                        {s[k].label}
                      </label>
                      <Input
                        id={ids[k]}
                        type={k === "email" ? "email" : "text"}
                        autoComplete="off"
                        spellCheck={k === "email" ? false : undefined}
                        value={form[k]}
                        aria-invalid={k === "email" && errors.email ? true : undefined}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, [k]: e.target.value }))
                          if (k === "email") setErrors((er) => ({ ...er, email: undefined }))
                        }}
                        placeholder={s[k].placeholder}
                        className={field}
                      />
                      {k === "email" && errors.email && <p className="mt-1.5 text-red-700 text-caption">{errors.email}</p>}
                    </div>
                  ))}
                </fieldset>
              )}
            </>
          )}
        </div>
        <div className="border-t border-neutral-100 p-6">
          {done ? (
            <Button size="lg" variant="outline" className="w-full rounded-full text-caption" onClick={() => onOpenChange(false)}>
              {s.done}
            </Button>
          ) : (
            <Button size="lg" className="w-full rounded-full text-caption" onClick={submit}>
              {who === "myself" ? s.downloadButton : s.shareButton}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

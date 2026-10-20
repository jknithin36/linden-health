"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadge01Icon, InformationCircleIcon, PlayIcon, UserIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { visitCopy } from "@/lib/data/admin-visit"
import { addMinutes, fmtDateTime, fmtTime, minutesBetween, NOW, relative } from "@/lib/admin/format"
import { getVisit, noteState, saveNote, signNote, startVisit } from "@/lib/admin/doctor"
import { getDoctorSync } from "@/lib/admin/queries"
import type { VisitNote } from "@/lib/admin/types"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useQuery } from "@/components/admin/hooks"
import { CardSkeleton, EmptyState, ErrorState, notify, panel } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { fromNote, missingForSign, noteSchema, sectionDone, toNote, type NoteForm } from "@/components/admin/doctor/visit/schema"
import { TopBar } from "@/components/admin/doctor/visit/top-bar"
import { PatientPanel, type VisitData } from "@/components/admin/doctor/visit/patient-panel"
import { SignDialog } from "@/components/admin/doctor/visit/sign-dialog"
import { NoteSummary } from "@/components/admin/doctor/visit/note-summary"
import { SectionCard } from "@/components/admin/doctor/visit/sections/section-card"
import { VitalsSection } from "@/components/admin/doctor/visit/sections/vitals"
import { SubjectiveSection } from "@/components/admin/doctor/visit/sections/subjective"
import { ObjectiveSection } from "@/components/admin/doctor/visit/sections/objective"
import { AssessmentSection } from "@/components/admin/doctor/visit/sections/assessment"
import { PlanSection } from "@/components/admin/doctor/visit/sections/plan"
import { InstructionsSection } from "@/components/admin/doctor/visit/sections/instructions"

const c = visitCopy
const AUTOSAVE_MS = 10_000

export function VisitPage({ id }: { id: string }) {
  const { data, initial, error, retry } = useQuery(() => getVisit(id), [id])
  if (error && !data)
    return (
      <div className={panel}>
        <ErrorState onRetry={retry} />
      </div>
    )
  if (initial) return <VisitSkeleton />
  if (!data)
    return (
      <div className={panel}>
        <EmptyState title={c.notFound.title} text={c.notFound.text} action={<Button nativeButton={false} variant="outline" className="h-10 rounded-full px-4 text-caption" render={<Link href="/admin/my-day" />}>{c.back}</Button>} />
      </div>
    )
  return <VisitEditor key={id} data={data} />
}

function VisitSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading visit" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-7 w-56 rounded-lg" />
        <Skeleton className="h-3.5 w-80 max-w-full rounded-full" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} className="h-40" />
          ))}
        </div>
        <CardSkeleton className="hidden h-[480px] lg:flex" />
      </div>
    </div>
  )
}

/** Whole minutes since the page opened, advanced once a minute (time itself is pinned to NOW). */
function useElapsedMinutes() {
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 60_000)
    return () => clearInterval(t)
  }, [])
  return n
}

function VisitEditor({ data }: { data: VisitData }) {
  const router = useRouter()
  const { appointment, patient, note } = data
  const signed = note.status === "signed"
  const elapsed = useElapsedMinutes()

  const form = useForm<NoteForm>({ resolver: zodResolver(noteSchema), defaultValues: fromNote(note), mode: "onChange" })
  const values = useWatch({ control: form.control }) as NoteForm
  const done = sectionDone(values)

  // Latest values for timers and key handlers.
  const latest = React.useRef({ note, elapsed, dirty: false, signing: false })
  React.useEffect(() => {
    latest.current.note = note
    latest.current.elapsed = elapsed
  })

  const [dirty, setDirty] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<string | null>(note.status === "not-started" ? null : note.updatedAt)
  React.useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: () => {
        if (!latest.current.dirty) {
          latest.current.dirty = true
          setDirty(true)
        }
      },
    })
  }, [form])

  const save = React.useCallback(
    (auto: boolean) => {
      if (latest.current.signing || latest.current.note.status === "signed") return
      saveNote(toNote(form.getValues(), latest.current.note))
      latest.current.dirty = false
      setDirty(false)
      setSavedAt(addMinutes(NOW, latest.current.elapsed))
      if (!auto) notify.success(c.draftSaved)
    },
    [form]
  )

  // Autosave every 10 s while there are unsaved changes, and keep them when leaving the page
  // (in-app navigation unmounts the editor; a reload or closed tab fires pagehide).
  React.useEffect(() => {
    if (signed) return
    const flush = () => latest.current.dirty && save(true)
    const t = setInterval(flush, AUTOSAVE_MS)
    window.addEventListener("pagehide", flush)
    return () => {
      clearInterval(t)
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [save, signed])

  const [signOpen, setSignOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<{ note: VisitNote; missing: string[] } | null>(null)
  const openSign = React.useCallback(() => {
    if (latest.current.note.status === "signed") return
    const v = form.getValues()
    void form.trigger()
    setDraft({ note: toNote(v, latest.current.note), missing: missingForSign(v) })
    setSignOpen(true)
  }, [form])

  const sign = () => {
    if (!draft || draft.missing.length) return
    latest.current.signing = true
    signNote(draft.note)
    setSignOpen(false)
    notify.success(c.sign.toast)
    router.push("/admin/my-day")
  }

  // ⌘S / Ctrl+S saves the draft; ⌘Enter / Ctrl+Enter opens the sign dialog.
  React.useEffect(() => {
    if (signed) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      if (e.key.toLowerCase() === "s") {
        e.preventDefault()
        save(false)
      } else if (e.key === "Enter") {
        e.preventDefault()
        openSign()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [save, openSign, signed])

  // The sticky patient panel sits under the shell header and this page's top bar.
  const barRef = React.useRef<HTMLDivElement>(null)
  const [barH, setBarH] = React.useState(120)
  React.useEffect(() => {
    const el = barRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBarH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The side panel only renders where it's shown (lg+); below that the same panel opens in a sheet.
  const wide = useMediaQuery("(min-width: 64rem)")
  const [panelOpen, setPanelOpen] = React.useState(false)
  const sheetTitleRef = React.useRef<HTMLHeadingElement>(null)

  // Timer and status.
  const live = appointment.status === "with-doctor" && !!appointment.roomedAt
  const timer = live
    ? c.inVisit(Math.max(0, minutesBetween(appointment.roomedAt!, NOW) + elapsed))
    : appointment.status === "completed" && appointment.roomedAt && appointment.completedAt
      ? c.visitLength(minutesBetween(appointment.roomedAt, appointment.completedAt))
      : appointment.checkedInAt
        ? `Checked in ${relative(appointment.checkedInAt, addMinutes(NOW, elapsed))}`
        : c.notStarted
  const state = noteState(appointment)
  const savedText = savedAt ? `${c.saved(fmtTime(savedAt))}${dirty ? ` · ${c.unsaved}` : ""}` : dirty ? c.unsaved : "Not saved yet"
  // Not started: the patient isn't with the doctor yet. (A saved draft alone doesn't start the visit.)
  const showStart = !signed && !["with-doctor", "completed", "cancelled", "late-cancel", "no-show"].includes(appointment.status)
  const doctor = getDoctorSync(note.doctorId)
  const panelVitals = signed ? fromNote(note).vitals : values.vitals

  return (
    <div className="flex flex-col gap-5" style={{ "--visit-bar": `${barH}px` } as React.CSSProperties}>
      <TopBar
        barRef={barRef}
        patient={patient}
        appointment={appointment}
        state={state}
        timer={timer}
        live={live}
        saved={savedText}
        readOnly={signed}
        onSave={() => save(false)}
        onSign={openSign}
        onPatientInfo={() => setPanelOpen(true)}
      />

      {showStart && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-700" />
            <div>
              <p className="text-sky-950 text-body">{c.startBanner.title}</p>
              <p className="text-sky-900 text-caption">{c.startBanner.text(patient.firstName)}</p>
            </div>
          </div>
          <Button
            type="button"
            className="h-10 shrink-0 rounded-full px-4 text-caption"
            onClick={() => {
              startVisit(appointment.id)
              notify.success(c.startBanner.toast, `${patient.name} · ${appointment.type === "video" ? "Video visit" : `Room ${appointment.room ?? 1}`}`)
            }}
          >
            <HugeiconsIcon icon={PlayIcon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
            {c.startBanner.action}
          </Button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {signed ? (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-emerald-950 text-body">{c.signed.by(doctor?.name ?? "Dr. Emily Chen", note.signedAt ? fmtDateTime(note.signedAt) : "")}</p>
                <p className="text-emerald-900 text-caption">{c.signed.text}</p>
              </div>
            </div>
            <section aria-label="Signed visit note" className={cn(panel, "px-5 md:px-6")}>
              <NoteSummary note={note} age={patient.age} allergies={patient.allergies} />
            </section>
          </div>
        ) : (
          <FormProvider {...form}>
            <form
              noValidate
              aria-label={`Visit note for ${patient.name}`}
              onSubmit={(e) => {
                e.preventDefault()
                save(false)
              }}
              className="flex min-w-0 flex-col gap-4"
            >
              <SectionCard id="vitals" done={done.vitals}>
                <VitalsSection age={patient.age} />
              </SectionCard>
              <SectionCard id="subjective" done={done.subjective}>
                <SubjectiveSection />
              </SectionCard>
              <SectionCard id="objective" done={done.objective}>
                <ObjectiveSection />
              </SectionCard>
              <SectionCard id="assessment" done={done.assessment}>
                <AssessmentSection />
              </SectionCard>
              <SectionCard id="plan" done={done.plan}>
                <PlanSection allergies={patient.allergies} />
              </SectionCard>
              <SectionCard id="instructions" done={done.instructions}>
                <InstructionsSection />
              </SectionCard>
              <p className="hidden text-neutral-400 text-micro md:block">{c.shortcuts}</p>
            </form>
          </FormProvider>
        )}

        {wide && (
          <aside aria-label="Patient summary" className={cn(panel, "sticky max-h-[calc(100dvh-4rem-var(--visit-bar)-2.5rem)] overflow-y-auto overscroll-contain")} style={{ top: "calc(4rem + var(--visit-bar) + 1.25rem)" }}>
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5">
              <HugeiconsIcon icon={UserIcon} strokeWidth={1.8} aria-hidden="true" className="size-4 text-neutral-500" />
              <h2 className="text-neutral-950 text-body">{c.panel.title}</h2>
            </div>
            <PatientPanel data={data} vitals={panelVitals} />
          </aside>
        )}
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent initialFocus={sheetTitleRef} className="w-full gap-0 p-0 data-[side=right]:sm:max-w-md">
          <SheetHeader className="gap-1 border-b border-neutral-100 p-6">
            <SheetTitle ref={sheetTitleRef} tabIndex={-1} className="pr-8 text-neutral-950 outline-none text-title">
              {patient.name}
            </SheetTitle>
            <SheetDescription className="text-neutral-500 tabular-nums text-caption">{`${patient.age} · ${patient.sex === "F" ? "Female" : "Male"} · ${patient.mrn}`}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PatientPanel data={data} vitals={panelVitals} />
          </div>
        </SheetContent>
      </Sheet>

      {!signed && <SignDialog open={signOpen} onOpenChange={setSignOpen} note={draft?.note ?? null} missing={draft?.missing ?? []} age={patient.age} allergies={patient.allergies} onSign={sign} />}
    </div>
  )
}

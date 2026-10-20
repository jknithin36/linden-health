"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, SentIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { inboxCopy } from "@/lib/data/admin-doctor"
import { messagesCopy } from "@/lib/data/admin-messages"
import { ageLabel, fmtDateLong, fmtDateTime } from "@/lib/admin/format"
import { authorName, getDoctorSync, getPatientSync } from "@/lib/admin/queries"
import { apptById, completeMessageItem, getNoteSync, noteState, getSchoolForm, myDoctorId, signForm, threadFor, type InboxRow } from "@/lib/admin/doctor"
import { sendThreadMessage } from "@/lib/admin/actions"
import { notify } from "@/components/admin/ui"
import { NoteStatusBadge } from "@/components/admin/doctor/badges"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const btn = "h-10 rounded-full px-4 text-caption"

/* ------------------------------- Note to sign ------------------------------ */

export function NoteDetail({ item }: { item: InboxRow }) {
  const a = apptById(item.refId)
  const note = getNoteSync(item.refId)
  if (!a || !note) return null
  const c = inboxCopy.note
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-neutral-950 text-body">{c.title}</h3>
          <p className="text-neutral-500 tabular-nums text-caption">
            {fmtDateTime(a.start)} · {a.reason}
          </p>
        </div>
        <NoteStatusBadge state={noteState(a)} />
      </div>
      <dl className="flex flex-col gap-3 rounded-2xl border border-neutral-200/70 p-4">
        <div>
          <dt className="text-neutral-400 text-micro">Chief complaint</dt>
          <dd className="text-neutral-950 text-caption">{note.subjective.chiefComplaint || "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-400 text-micro">Assessment</dt>
          <dd className="text-neutral-950 text-caption">{note.assessment.diagnoses.length ? note.assessment.diagnoses.map((d) => `${d.code} · ${d.label}`).join(", ") : "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-400 text-micro">Plan</dt>
          <dd className="line-clamp-3 text-pretty text-neutral-950 text-caption">{note.plan.text || "—"}</dd>
        </div>
      </dl>
      <div>
        <Button nativeButton={false} render={<Link href={`/admin/visit/${a.id}`} />} className={btn}>
          {c.open}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}

/* --------------------------------- Message --------------------------------- */

export function MessageDetail({ item }: { item: InboxRow }) {
  const thread = threadFor(item.refId)
  const [body, setBody] = React.useState("")
  const [err, setErr] = React.useState<string | null>(null)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const id = React.useId()
  const c = inboxCopy.message
  // Internal staff notes stay out of the patient conversation (and its count).
  const visible = React.useMemo(() => thread?.messages.filter((m) => !m.internal) ?? [], [thread])
  const count = visible.length
  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [count])
  if (!thread) return null

  const send = () => {
    const text = body.trim()
    if (!text) return setErr(c.empty)
    // Mark done first so the undo also takes the reply back.
    const undo = item.status === "new" ? completeMessageItem(item.id) : null
    sendThreadMessage(thread, text)
    setBody("")
    setErr(null)
    if (undo) notify.undo("Reply sent", undo, "The item moved to Done.")
    else notify.success("Reply sent")
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {thread.subject !== item.summary && <h3 className="text-neutral-950 text-body">{thread.subject}</h3>}
        <p className="text-neutral-500 tabular-nums text-caption">{count === 1 ? "1 message" : `${count} messages`}</p>
      </div>
      <ol ref={listRef} aria-label="Conversation" className="flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-2xl bg-neutral-50/70 p-4">
        {visible.map((m) => {
          const staff = m.from === "staff"
          return (
            <li key={m.id} className={cn("flex max-w-[85%] flex-col", staff ? "self-end" : "self-start")}>
              <span className="sr-only">{staff ? "Staff" : "Patient"}: </span>
              <div className={cn("rounded-2xl px-3.5 py-2.5", staff ? "rounded-br-md bg-neutral-950 text-white" : "rounded-bl-md border border-neutral-200/70 bg-white text-neutral-900")}>
                <p className="whitespace-pre-wrap text-caption">{m.body}</p>
              </div>
              <span className={cn("mt-1 text-neutral-400 tabular-nums text-micro", staff && "text-right")}>
                {authorName(m.authorId)} · {fmtDateTime(m.createdAt)}
              </span>
            </li>
          )
        })}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex flex-col gap-2 rounded-2xl border border-neutral-200/70 p-3"
      >
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5" role="group" aria-label={c.quick}>
          {messagesCopy.quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setBody((b) => (b ? `${b}\n${q.text}` : q.text))
                setErr(null)
                ref.current?.focus()
              }}
              className="h-7 shrink-0 rounded-full border border-neutral-200 px-2.5 text-neutral-700 outline-none hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-950 text-micro"
            >
              {q.label}
            </button>
          ))}
        </div>
        <label htmlFor={`${id}-reply`} className="sr-only">
          Reply
        </label>
        <Textarea
          ref={ref}
          id={`${id}-reply`}
          value={body}
          aria-invalid={!!err || undefined}
          aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => (setBody(e.target.value), setErr(null))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={c.placeholder}
          className="max-h-40 min-h-20 border-neutral-200 bg-white shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 aria-invalid:border-red-500 text-caption md:text-caption"
        />
        {err && (
          <p id={`${id}-err`} className="text-red-700 text-micro">
            {err}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <span className="hidden text-neutral-400 text-micro sm:inline">{c.hint}</span>
          <Button type="submit" className="h-9 rounded-full px-4 text-caption">
            <HugeiconsIcon icon={SentIcon} strokeWidth={1.8} aria-hidden="true" data-icon="inline-start" />
            {c.send}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------------------------- Form ----------------------------------- */

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="tracking-wide text-micro text-neutral-400 uppercase">{label}</p>
      <p className="border-b border-neutral-300 pb-1 font-serif text-neutral-900 text-caption">{value}</p>
    </div>
  )
}

function Box({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="flex items-center gap-2 text-neutral-800 text-micro">
      <span aria-hidden="true" className="grid size-3.5 place-items-center border border-neutral-400">
        {checked && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" className="size-3" />}
      </span>
      {label}
      <span className="sr-only">{checked ? "(checked)" : "(not checked)"}</span>
    </span>
  )
}

export function FormDetail({ item }: { item: InboxRow }) {
  const f = getSchoolForm(item.refId)
  if (!f) return null
  const p = getPatientSync(f.patientId)!
  const doctor = getDoctorSync(myDoctorId())
  const done = item.status === "done"
  const c = inboxCopy.form
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-neutral-950 text-body">{f.title}</h3>
        <p className="text-neutral-500 text-caption">
          {c.requestedBy} {f.requestedBy}
        </p>
      </div>
      <figure aria-label={`${c.preview}: ${f.title}`} className="rounded-2xl bg-neutral-100 p-4 sm:p-6">
        <div className="mx-auto flex max-w-md flex-col gap-4 rounded-sm bg-white p-6 ring-1 ring-neutral-200 sm:p-8">
          <div className="border-b-2 border-neutral-900 pb-2">
            <p className="tracking-wide text-micro text-neutral-500 uppercase">Pre-participation physical evaluation</p>
            <p className="font-serif text-neutral-950 text-body">Sports physical clearance</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Line label="Student name" value={p.name} className="col-span-2" />
            <Line label="Date of birth" value={fmtDateLong(p.dob)} />
            <Line label="Age / sex" value={ageLabel(p.dob, p.sex)} />
            <Line label="School / program" value={f.requestedBy} className="col-span-2" />
            <Line label="Allergies" value={p.allergies.join(", ") || "None known"} className="col-span-2" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="tracking-wide text-micro text-neutral-400 uppercase">Clearance</p>
            <Box label="Cleared for all sports without restriction" checked />
            <Box label="Cleared with recommendations for follow-up" checked={false} />
            <Box label="Not cleared" checked={false} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="tracking-wide text-micro text-neutral-400 uppercase">Physician signature</p>
              <p className={cn("h-7 border-b border-neutral-300 font-serif italic text-body", done ? "text-sky-900" : "text-transparent")}>{doctor?.name ?? "Signature"}</p>
            </div>
            <Line label="Date" value={done && item.doneAt ? fmtDateLong(item.doneAt) : ""} />
          </div>
        </div>
      </figure>
      <div>
        <Button
          className={btn}
          disabled={done}
          onClick={() => {
            const undo = signForm(item.id, f.id)
            notify.undo("Form signed", undo, `${f.title} for ${p.name}`)
          }}
        >
          {c.sign}
        </Button>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Attachment01Icon, BubbleChatIcon, Cancel01Icon, SentIcon, StickyNote01Icon, UserCircleIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { messagesCopy as m, topicLabel } from "@/lib/data/admin-messages"
import { fmtDateTime } from "@/lib/admin/format"
import { authorName, getPatientSync, waitingTooLong } from "@/lib/admin/queries"
import { createThread, sendThreadMessage } from "@/lib/admin/actions"
import type { Message, MessageThread } from "@/lib/admin/types"
import { inputCls } from "@/components/admin/forms"
import { EmptyState, notify, StatusBadge, touchTarget } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

function Bubble({ msg }: { msg: Message }) {
  const staff = msg.from === "staff"
  const meta = (
    <span className={cn("mt-1 block text-neutral-400 tabular-nums text-micro", staff && !msg.internal && "text-right")}>
      {authorName(msg.authorId)} · {fmtDateTime(msg.createdAt)}
    </span>
  )
  const files = msg.attachments?.length ? (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {msg.attachments.map((f) => (
        <li key={f} className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-micro", staff && !msg.internal ? "bg-white/15 text-white" : "bg-white text-neutral-700 ring-1 ring-neutral-200")}>
          <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} className="size-3" aria-hidden="true" />
          {f}
        </li>
      ))}
    </ul>
  ) : null
  if (msg.internal)
    return (
      <li className="w-full">
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50 px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-amber-800 text-micro">
            <HugeiconsIcon icon={StickyNote01Icon} strokeWidth={1.8} className="size-3.5" aria-hidden="true" />
            {m.internalLabel}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-neutral-900 text-caption">{msg.body}</p>
          {files}
        </div>
        {meta}
      </li>
    )
  return (
    <li className={cn("flex max-w-[85%] flex-col sm:max-w-[75%]", staff ? "self-end" : "self-start")}>
      <span className="sr-only">{staff ? "Staff" : "Patient"}: </span>
      <div className={cn("rounded-2xl px-3.5 py-2.5", staff ? "rounded-br-md bg-neutral-950 text-white" : "rounded-bl-md bg-neutral-100 text-neutral-900")}>
        <p className="whitespace-pre-wrap text-caption">{msg.body}</p>
        {files}
      </div>
      {meta}
    </li>
  )
}

function Composer({ onSend, withSubject }: { onSend: (body: string, opts: { internal: boolean; attachments: string[]; subject: string }) => void; withSubject?: boolean }) {
  const [body, setBody] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [internal, setInternal] = React.useState(false)
  const [files, setFiles] = React.useState<string[]>([])
  const [err, setErr] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const textRef = React.useRef<HTMLTextAreaElement>(null)
  const id = React.useId()

  const submit = () => {
    if (withSubject && subject.trim().length < 3) return setErr("Add a subject")
    if (!body.trim()) return setErr(internal ? "Write a note first" : "Write a message first")
    onSend(body.trim(), { internal, attachments: files, subject: subject.trim() })
    setBody("")
    setSubject("")
    setFiles([])
    setErr(null)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className={cn("flex flex-col gap-2 border-t p-3 transition-colors", internal ? "border-amber-200/70 bg-amber-50/60" : "border-neutral-100 bg-white")}
    >
      {!internal && (
        <div className="relative -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5" role="group" aria-label={m.composer.quickReplies}>
          {m.quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setBody((b) => (b ? `${b}\n${q.text}` : q.text))
                setErr(null)
                textRef.current?.focus()
              }}
              className="h-7 shrink-0 rounded-full border border-neutral-200 px-2.5 text-neutral-700 outline-none hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-950 text-micro"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
      {withSubject && (
        <>
          <label htmlFor={`${id}-subject`} className="sr-only">
            {m.newThread.subject}
          </label>
          <Input id={`${id}-subject`} value={subject} onChange={(e) => (setSubject(e.target.value), setErr(null))} placeholder={m.newThread.subjectPlaceholder} className={inputCls} />
        </>
      )}
      <label htmlFor={`${id}-body`} className="sr-only">
        {internal ? m.composer.internal : "Message"}
      </label>
      <Textarea
        ref={textRef}
        id={`${id}-body`}
        value={body}
        aria-invalid={!!err || undefined}
        aria-describedby={err ? `${id}-err` : undefined}
        onChange={(e) => (setBody(e.target.value), setErr(null))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={internal ? m.composer.notePlaceholder : m.composer.placeholder}
        className={cn("max-h-40 min-h-20 border-neutral-200 bg-white shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 text-caption md:text-caption", internal && "border-amber-200")}
      />
      {err && (
        <p id={`${id}-err`} role="alert" className="text-red-700 text-micro">
          {err}
        </p>
      )}
      {files.length > 0 && (
        <ul aria-label="Attachments" className="flex flex-wrap gap-1.5">
          {files.map((f) => (
            <li key={f} className="inline-flex h-7 items-center gap-1 rounded-full bg-neutral-100 pr-1 pl-2.5 text-neutral-700 text-micro">
              <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} className="size-3" aria-hidden="true" />
              {f}
              <button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles((x) => x.filter((n) => n !== f))} className="grid size-5 place-items-center rounded-full outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-950">
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name)
            setFiles((x) => [...new Set([...x, ...names])])
            e.target.value = ""
          }}
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label={m.composer.attach} className={cn("rounded-full text-neutral-600", touchTarget)} onClick={() => fileRef.current?.click()}>
          <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} />
        </Button>
        {!withSubject && (
          <label className="flex items-center gap-2 text-neutral-700 text-caption">
            <Switch checked={internal} onCheckedChange={setInternal} />
            {m.composer.internal}
          </label>
        )}
        <span className="ml-auto hidden text-neutral-400 text-micro sm:inline">{m.composer.hint}</span>
        <Button type="submit" className={cn("h-9 rounded-full px-4 text-caption", internal && "bg-amber-600 text-white hover:bg-amber-700")}>
          <HugeiconsIcon icon={internal ? StickyNote01Icon : SentIcon} strokeWidth={1.8} data-icon="inline-start" />
          {internal ? m.composer.addNote : m.composer.send}
        </Button>
      </div>
    </form>
  )
}

export function Conversation({ thread, patientId, onBack, onDetails, onCreated }: { thread: MessageThread | null; patientId: string | null; onBack: () => void; onDetails: () => void; onCreated: (t: MessageThread) => void }) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const count = thread?.messages.length ?? 0
  React.useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread?.id, count])

  const patient = thread ? getPatientSync(thread.patientId) : patientId ? getPatientSync(patientId) : null

  const header = (title: React.ReactNode, sub: React.ReactNode, badges?: React.ReactNode) => (
    <header className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3 md:px-4">
      <Button variant="ghost" size="icon-sm" aria-label={m.back} className={cn("rounded-full lg:hidden", touchTarget)} onClick={onBack}>
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} />
      </Button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-neutral-950 text-body">{title}</h2>
        <p className="truncate text-neutral-500 text-micro">{sub}</p>
      </div>
      {badges}
      {patient && (
        <Button variant="outline" size="sm" className="rounded-full px-3 text-caption xl:hidden" onClick={onDetails}>
          <HugeiconsIcon icon={UserCircleIcon} strokeWidth={1.8} data-icon="inline-start" />
          <span className="max-sm:sr-only">{m.details}</span>
        </Button>
      )}
    </header>
  )

  if (!thread && patient)
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {header(m.newThread.title(patient.name), patient.mrn)}
        <div className="flex flex-1 items-center justify-center overflow-y-auto">
          <EmptyState icon={BubbleChatIcon} title={m.newThread.title(patient.name)} text={m.newThread.text} />
        </div>
        <Composer
          withSubject
          onSend={(body, o) => {
            const t = createThread(patient.id, o.subject)
            notify.success(sendThreadMessage(t, body, { attachments: o.attachments }))
            onCreated(t)
          }}
        />
      </div>
    )

  if (!thread)
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={BubbleChatIcon} title={m.noThread.title} text={m.noThread.text} />
      </div>
    )

  const topic = topicLabel[thread.topic]
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header(
        thread.subject,
        `${patient?.name} · ${topic} · Assigned to ${authorName(thread.assignedToId)}`,
        <span className="hidden items-center gap-1.5 md:flex">
          {waitingTooLong(thread) && <span className="inline-flex h-6 items-center rounded-full bg-amber-50 px-2.5 text-amber-800 text-micro">{m.overdue}</span>}
          {thread.priority === "high" && <StatusBadge kind="priority" status="high" />}
          <StatusBadge kind="thread" status={thread.status} />
        </span>
      )}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
        <ol aria-label="Messages" className="flex flex-col gap-4">
          {thread.messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} />
          ))}
        </ol>
      </div>
      <Composer key={thread.id} onSend={(body, o) => notify.success(sendThreadMessage(thread, body, { internal: o.internal, attachments: o.attachments }))} />
    </div>
  )
}

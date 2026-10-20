"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Attachment01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PencilEdit02Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { chip, focusRing } from "@/lib/styles"
import { family, personById, portalUser, type PersonId } from "@/lib/data/portal"
import { conversationById, conversations as seed, messagesCopy as copy, recipients, topics, type Conversation, type MessageCategory, type ThreadMessage } from "@/lib/data/messages"
import { markThreadRead, useReadThreads } from "@/lib/read-messages"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PersonAvatar } from "@/components/portal/person-avatar"
import { SegmentedFilter } from "@/components/portal/person-filter"
import { SenderAvatar } from "@/components/portal/sender-avatar"
import { sheetClass } from "@/components/portal/styles"

type Tab = "all" | "unread" | MessageCategory

const DESKTOP = "(min-width: 1024px)"
function subscribeDesktop(onChange: () => void) {
  const q = window.matchMedia(DESKTOP)
  q.addEventListener("change", onChange)
  return () => q.removeEventListener("change", onChange)
}
/** True on wide screens, where the list and the open thread sit side by side. */
function useIsDesktop() {
  return React.useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => false)
}

const aboutText = (c: Conversation) => copy.about(c.about.personId ? personById(c.about.personId).firstName : null, c.about.topic)

/** `<MessagesPage />` reads ?c= to open a thread; the plain version is the Suspense fallback. */
export function MessagesPageWithParams() {
  const params = useSearchParams()
  return <MessagesPage initialId={params.get("c")} />
}

/** Threads are local state seeded from the demo data; a backend would load them and POST new messages. */
export function MessagesPage({ initialId = null }: { initialId?: string | null }) {
  const linked = conversationById(initialId)
  const [threads, setThreads] = React.useState(seed)
  const [tab, setTab] = React.useState<Tab>("all")
  const [selectedId, setSelectedId] = React.useState(linked?.id ?? seed[0].id)
  const [mobileOpen, setMobileOpen] = React.useState(!!linked)
  const [composing, setComposing] = React.useState(false)
  const read = useReadThreads()
  const isDesktop = useIsDesktop()

  const isUnread = (c: Conversation) => c.unread && !read.has(c.id)
  const unread = threads.filter(isUnread).length
  const visible = threads.filter((c) => (tab === "all" ? true : tab === "unread" ? isUnread(c) : c.category === tab))
  const selected = threads.find((c) => c.id === selectedId) ?? threads[0]
  const threadVisible = isDesktop || mobileOpen

  // A thread counts as read once it's actually on screen.
  React.useEffect(() => {
    if (threadVisible && selected) markThreadRead(selected.id)
  }, [threadVisible, selected])

  const open = (id: string) => {
    setSelectedId(id)
    setMobileOpen(true)
  }

  const send = (id: string, text: string, file: string | null) =>
    setThreads((list) =>
      list.map((c) =>
        c.id === id
          ? {
              ...c,
              time: copy.justNow,
              messages: [...c.messages, { id: `you-${c.messages.length + 1}`, from: "you", time: copy.justNow, text, attachment: file ? { label: file } : undefined }],
            }
          : c
      )
    )

  const start = (c: Conversation) => {
    setThreads((list) => [c, ...list])
    setTab("all")
    open(c.id)
  }

  const tabs = copy.tabs.map((t) => ({ ...t, label: t.id === "unread" && unread ? `${t.label} (${unread})` : t.label }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-neutral-950 text-heading">{copy.heading}</h1>
        <Button size="lg" className="rounded-full px-5 text-caption" onClick={() => setComposing(true)}>
          <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.8} data-icon="inline-start" />
          {copy.newMessage}
        </Button>
      </header>

      <div className="grid overflow-hidden rounded-2xl border border-neutral-200/70 bg-white lg:h-[calc(100svh-15rem)] lg:min-h-[560px] lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Conversation list */}
        <section aria-label={copy.heading} className={cn("flex min-h-0 flex-col border-neutral-200/70 lg:border-r", threadVisible && !isDesktop && "hidden")}>
          <div className="border-b border-neutral-100 p-3">
            <SegmentedFilter value={tab} onValueChange={setTab} options={tabs} label={copy.tabsLabel} className="w-full [&>*]:flex-1" />
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {visible.length === 0 && <li className="px-4 py-10 text-center text-neutral-500 text-body">{copy.empty}</li>}
            {visible.map((c) => {
              const last = c.messages[c.messages.length - 1]
              const active = isDesktop && c.id === selected?.id
              const dot = isUnread(c)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn("flex w-full gap-3 rounded-xl p-3 text-left transition-colors", active ? "bg-neutral-100" : "hover:bg-neutral-50", focusRing.dark)}
                  >
                    <SenderAvatar c={c} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-body", dot ? "text-neutral-950" : "text-neutral-700")}>{c.from}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-neutral-400 text-micro">
                          {c.time}
                          {dot && (
                            <>
                              <span aria-hidden="true" className="size-2 rounded-full bg-neutral-950" />
                              <span className="sr-only">{copy.unreadLabel}</span>
                            </>
                          )}
                        </span>
                      </span>
                      <span className="block truncate text-neutral-500 text-caption">{aboutText(c)}</span>
                      <span className={cn("mt-0.5 line-clamp-1 text-caption", dot ? "text-neutral-800" : "text-neutral-500")}>
                        {last.from === "you" ? `${copy.you}: ` : ""}
                        {last.text}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Open conversation */}
        {selected && (
          <section aria-label={selected.from} className={cn("flex min-h-[70svh] min-w-0 flex-col lg:min-h-0", !threadVisible && "hidden")}>
            <Thread conversation={selected} onBack={() => setMobileOpen(false)} onSend={(text, file) => send(selected.id, text, file)} />
          </section>
        )}
      </div>

      <ComposeSheet open={composing} onOpenChange={setComposing} onStart={start} />
    </div>
  )
}

/* ------------------------------------------------------------------------- */

function Bubble({ m, c }: { m: ThreadMessage; c: Conversation }) {
  const mine = m.from === "you"
  return (
    <li className={cn("flex max-w-[85%] flex-col gap-1.5", mine ? "items-end self-end" : "items-start")}>
      <span className="text-neutral-400 text-micro">
        {mine ? portalUser.firstName : c.short} · {m.time}
      </span>
      <p className={cn("rounded-2xl px-4 py-2.5 text-pretty text-body", mine ? "rounded-br-md bg-neutral-950 text-white" : "rounded-bl-md bg-neutral-100 text-neutral-900")}>{m.text}</p>
      {/* Linked attachments (a booked visit, a statement) open their page; a file you just attached is a plain chip. */}
      {m.attachment?.href ? (
        <Link
          href={m.attachment.href}
          className={cn("inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800 transition-colors hover:border-neutral-300 text-caption", focusRing.dark)}
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-4 text-emerald-600" />
          {m.attachment.label}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="size-3.5 text-neutral-400" />
        </Link>
      ) : (
        m.attachment && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800 text-caption">
            <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} className="size-4 shrink-0" />
            <span className="truncate">{m.attachment.label}</span>
          </span>
        )
      )}
    </li>
  )
}

function Thread({ conversation: c, onBack, onSend }: { conversation: Conversation; onBack: () => void; onSend: (text: string, file: string | null) => void }) {
  const [text, setText] = React.useState("")
  const [file, setFile] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const ids = { input: React.useId() }

  // Keep the newest message in view.
  React.useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [c.messages.length, c.id])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim(), file)
    setText("")
    setFile(null)
  }

  return (
    <>
      <header className="flex items-start gap-3 border-b border-neutral-100 p-4 md:px-6">
        <Button variant="ghost" size="icon" aria-label={copy.back} onClick={onBack} className="-ml-2 rounded-full lg:hidden">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} />
        </Button>
        <SenderAvatar c={c} />
        <div className="min-w-0 flex-1">
          <h2 className="text-neutral-950 text-body">{c.role}</h2>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-neutral-500 text-caption">
            {c.about.personId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-0.5 pr-2.5 pl-0.5 text-neutral-700">
                <PersonAvatar person={personById(c.about.personId)} className="size-5" />
                {aboutText(c)}
              </span>
            ) : (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-700">{c.about.topic}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-3.5" />
              {c.replyTime}
            </span>
          </p>
        </div>
      </header>

      <ol ref={listRef} aria-live="polite" className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
        {c.messages.map((m) => (
          <Bubble key={m.id} m={m} c={c} />
        ))}
      </ol>

      <form onSubmit={submit} className="border-t border-neutral-100 p-3 md:px-6 md:py-4">
        <label htmlFor={ids.input} className="sr-only">
          {copy.input.label}
        </label>
        <div className="rounded-2xl border border-neutral-200 bg-white p-2 transition-colors focus-within:border-neutral-950">
          <Textarea
            id={ids.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter adds a line; ignore Enter while an IME is composing.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e)
            }}
            placeholder={copy.input.placeholder}
            rows={2}
            className="min-h-12 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 text-body md:text-body"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <input ref={fileRef} type="file" aria-hidden="true" className="sr-only" tabIndex={-1} onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
              <Button type="button" variant="ghost" size="sm" className="rounded-full px-3 text-neutral-600 text-caption" onClick={() => fileRef.current?.click()}>
                <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} data-icon="inline-start" />
                {copy.input.attach}
              </Button>
              {file && (
                <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-neutral-100 py-0.5 pr-1 pl-2.5 text-neutral-700 text-micro">
                  <span className="truncate">{file}</span>
                  <button type="button" aria-label={copy.input.remove(file)} onClick={() => setFile(null)} className={cn("grid size-5 place-items-center rounded-full hover:bg-neutral-200", focusRing.dark)}>
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                  </button>
                </span>
              )}
            </div>
            <Button type="submit" size="sm" disabled={!text.trim()} className="rounded-full px-4 text-caption">
              {copy.input.send}
              <HugeiconsIcon icon={SentIcon} strokeWidth={1.8} data-icon="inline-end" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-neutral-400 text-micro">{copy.safety}</p>
      </form>
    </>
  )
}

/* ------------------------------------------------------------------------- */

function ChipGroup({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (v: string) => void; options: { id: string; label: React.ReactNode }[] }) {
  const id = React.useId()
  return (
    <div>
      <p id={id} className="mb-2 text-neutral-500 text-caption">
        {label}
      </p>
      <ToggleGroup
        aria-labelledby={id}
        value={[value]}
        onValueChange={(v: string[]) => {
          const next = v[v.length - 1]
          if (next) onValueChange(next)
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.id} value={o.id} className={cn(chip, "h-9 gap-2 px-3.5 text-caption")}>
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function ComposeSheet({ open, onOpenChange, onStart }: { open: boolean; onOpenChange: (open: boolean) => void; onStart: (c: Conversation) => void }) {
  const k = copy.compose
  const [to, setTo] = React.useState(recipients[0].id)
  const [about, setAbout] = React.useState<PersonId>("sarah")
  const [topic, setTopic] = React.useState(topics[0])
  const [text, setText] = React.useState("")
  const [file, setFile] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState<Conversation | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const ids = { text: React.useId() }

  const reset = () => {
    setTo(recipients[0].id)
    setAbout("sarah")
    setTopic(topics[0])
    setText("")
    setFile(null)
    setSent(null)
  }

  const send = () => {
    const r = recipients.find((x) => x.id === to)!
    const c: Conversation = {
      from: r.from,
      short: r.short,
      initials: r.initials,
      image: r.image,
      brand: r.brand,
      role: r.role,
      category: r.category,
      replyTime: r.replyTime,
      id: `new-${Date.now()}`,
      about: { personId: about, topic },
      time: copy.justNow,
      unread: false,
      messages: [{ id: "you-1", from: "you", time: copy.justNow, text: text.trim(), attachment: file ? { label: file } : undefined }],
    }
    setSent(c)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <SheetContent className={sheetClass}>
        <SheetHeader className="gap-2 border-b border-neutral-100 p-6">
          <SheetTitle className="pr-8 text-neutral-950 text-title">{k.title}</SheetTitle>
          <SheetDescription className="text-neutral-500 text-caption">{copy.safety}</SheetDescription>
        </SheetHeader>
        <div aria-live="polite" className="flex flex-1 flex-col gap-6 p-6">
          {sent ? (
            <div className="flex flex-col items-start gap-4">
              <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.8} className="size-5" />
              </span>
              <p className="text-pretty text-neutral-950 text-lead">{k.success(sent.replyTime)}</p>
            </div>
          ) : (
            <>
              <ChipGroup label={k.to} value={to} onValueChange={setTo} options={recipients.map((r) => ({ id: r.id, label: r.label }))} />
              <ChipGroup
                label={k.about}
                value={about}
                onValueChange={(v) => setAbout(v as PersonId)}
                options={family.map((m) => ({
                  id: m.id,
                  label: (
                    <>
                      <PersonAvatar person={m} className="-ml-2 size-6" />
                      {m.firstName}
                    </>
                  ),
                }))}
              />
              <ChipGroup label={k.topic} value={topic} onValueChange={setTopic} options={topics.map((t) => ({ id: t, label: t }))} />
              <div>
                <label htmlFor={ids.text} className="mb-2 block text-neutral-500 text-caption">
                  {k.message}
                </label>
                <Textarea
                  id={ids.text}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={k.placeholder}
                  className="min-h-32 rounded-xl border-neutral-200 bg-white px-4 py-3 shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 text-body md:text-body"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input ref={fileRef} type="file" aria-hidden="true" className="sr-only" tabIndex={-1} onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
                  <Button type="button" variant="ghost" size="sm" className="-ml-2 rounded-full px-3 text-neutral-600 text-caption" onClick={() => fileRef.current?.click()}>
                    <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} data-icon="inline-start" />
                    {copy.input.attach}
                  </Button>
                  {file && <span className="truncate text-neutral-600 text-micro">{file}</span>}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="border-t border-neutral-100 p-6">
          {sent ? (
            <Button
              size="lg"
              className="w-full rounded-full text-caption"
              onClick={() => {
                onStart(sent)
                onOpenChange(false)
                reset()
              }}
            >
              {k.open}
            </Button>
          ) : (
            <Button size="lg" disabled={!text.trim()} className="w-full rounded-full text-caption" onClick={send}>
              {k.send}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

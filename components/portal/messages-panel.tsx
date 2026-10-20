"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import { overviewCopy } from "@/lib/data/portal"
import { conversations, messagesCopy } from "@/lib/data/messages"
import { useReadThreads } from "@/lib/read-messages"
import { SenderAvatar } from "@/components/portal/sender-avatar"
import { panel } from "@/components/portal/styles"

const c = overviewCopy.messages

/** Overview panel: the three latest conversations, with unread dots that clear once a thread is opened. */
export function MessagesPanel() {
  const read = useReadThreads()
  const list = conversations.slice(0, 3)
  const isUnread = (id: string, unread: boolean) => unread && !read.has(id)
  const unread = conversations.filter((m) => isUnread(m.id, m.unread)).length

  return (
    <section aria-labelledby="messages" className={cn(panel, "p-5 md:p-6")}>
      <h2 id="messages" className="text-neutral-950 text-body">
        {c.heading} <span className="text-neutral-400">· {unread ? c.unread(unread) : c.allRead}</span>
      </h2>
      <ul className="mt-4 flex flex-col gap-1">
        {list.map((m) => {
          const dot = isUnread(m.id, m.unread)
          const last = m.messages.filter((x) => x.from === "them").at(-1) ?? m.messages.at(-1)!
          return (
            <li key={m.id}>
              <Link href={c.href(m.id)} className={cn("-mx-2 flex gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50", focusRing.dark)}>
                <SenderAvatar c={m} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate text-body", dot ? "text-neutral-950" : "text-neutral-600")}>{m.from}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-neutral-400 text-micro">
                      {m.time}
                      {dot && (
                        <>
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-neutral-950" />
                          <span className="sr-only">{c.unreadLabel}</span>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="block text-neutral-400 text-micro">{messagesCopy.categoryLabel[m.category]}</span>
                  <span className="mt-1 line-clamp-2 text-pretty text-neutral-600 text-caption">{last.text}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <Link href={c.open.href} className={cn("mt-4 inline-flex items-center gap-1 rounded-sm text-neutral-500 hover:text-neutral-950 text-caption", focusRing.dark)}>
        {c.open.label}
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} className="size-3.5" />
      </Link>
    </section>
  )
}

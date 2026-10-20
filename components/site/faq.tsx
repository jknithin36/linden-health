"use client"

import * as React from "react"
import Link from "next/link"

import { HugeiconsIcon } from "@hugeicons/react"
import { Call02Icon, Message01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { container, focusRing, headerGap, pageTop, sectionY } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { faqCategories, faqCopy } from "@/lib/data/faq"
import { useReducedMotion } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { FaqAccordion } from "@/components/site/faq-accordion"
import { SectionHeader } from "@/components/site/section-header"

type FaqProps = {
  /** 1 on the dedicated /faq page, 2 when it's a section on another page. */
  level?: 1 | 2
}

/**
 * Space left above a topic when jumping to it: clears the floating navbar pill, and on
 * phones the sticky topic chips under it too.
 */
const scrollOffset = () => (window.matchMedia("(min-width: 1024px)").matches ? 112 : 160)

const topicId = (id: string) => `faq-${id}`

function ContactCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[20px] bg-neutral-50 p-5", className)}>
      <p className="text-neutral-950 text-body">{faqCopy.contactTitle}</p>
      <p className="mt-1 text-neutral-500 text-caption">{faqCopy.contactBody}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          size="lg"
          nativeButton={false}
          render={<a href={`tel:${site.phone.tel}`} />}
          className="justify-start rounded-full px-4 text-caption"
        >
          <HugeiconsIcon aria-hidden="true" icon={Call02Icon} strokeWidth={1.8} data-icon="inline-start" />
          {faqCopy.call(site.phone.display)}
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href={faqCopy.message.href} />}
          className="justify-start rounded-full bg-white px-4 text-caption"
        >
          <HugeiconsIcon aria-hidden="true" icon={Message01Icon} strokeWidth={1.8} data-icon="inline-start" />
          {faqCopy.message.label}
        </Button>
      </div>
    </div>
  )
}

/** Tracks which topic is currently being read. */
function useActiveTopic(ids: string[]) {
  const [active, setActive] = React.useState(ids[0])

  React.useEffect(() => {
    const els = ids.map((id) => document.getElementById(topicId(id))).filter((el): el is HTMLElement => !!el)
    // A topic is "active" once its top passes the upper third of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setActive(topMost.target.id.replace(/^faq-/, ""))
      },
      { rootMargin: `-${scrollOffset()}px 0px -60% 0px` }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [ids])

  return [active, setActive] as const
}

const topicIds = faqCategories.map((c) => c.id)

/** All topics on one page; the topic list follows your scroll and jumps to a topic on click. */
export function Faq({ level = 2 }: FaqProps) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useActiveTopic(topicIds)
  // Topic titles sit one level under the section heading.
  const TopicHeading = level === 1 ? "h2" : "h3"
  const chipRowRef = React.useRef<HTMLDivElement>(null)

  // Keep the active chip in view in the scrolling row (phones).
  React.useEffect(() => {
    const row = chipRowRef.current
    const chip = row?.querySelector<HTMLElement>(`[data-topic="${active}"]`)
    if (!row || !chip) return
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
    row.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" })
  }, [active, reduceMotion])

  const goTo = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(topicId(id))
    if (!el) return
    event.preventDefault()
    setActive(id)
    const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset()
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" })
    history.replaceState(null, "", `#${topicId(id)}`)
  }

  const topicLink = (id: string, title: string, count: number, variant: "chip" | "list") => {
    const isActive = id === active
    return (
      <a
        key={id}
        href={`#${topicId(id)}`}
        data-topic={id}
        onClick={goTo(id)}
        aria-current={isActive ? "true" : undefined}
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 transition-colors",
          focusRing.dark,
          "text-caption",
          variant === "chip"
            ? cn("h-10 rounded-full px-4", isActive ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600")
            : cn(
                "h-11 rounded-xl px-3",
                isActive ? "bg-neutral-100 text-neutral-950" : "text-neutral-500 hover:text-neutral-950"
              )
        )}
      >
        {title}
        {variant === "list" && <span className="text-neutral-400 tabular-nums">{count}</span>}
      </a>
    )
  }

  return (
    <section id="faq" aria-labelledby="faq-heading" className={level === 1 ? cn(pageTop, "pb-12 md:pb-18") : sectionY}>
      <div className={cn(container, "grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-20")}>
        {/* Left: header, topics, contact (sticky on desktop) */}
        <div className="flex min-w-0 flex-col lg:sticky lg:top-28 lg:self-start">
          <SectionHeader id="faq-heading" level={level} align="start" heading={faqCopy.heading} />

          <nav aria-label={faqCopy.categoriesLabel} className={cn(headerGap, "hidden flex-col gap-1 lg:flex")}>
            {faqCategories.map((c) => topicLink(c.id, c.title, c.items.length, "list"))}
          </nav>

          <ContactCard className="mt-8 hidden lg:block" />
        </div>

        {/* Right: every topic, in order */}
        <div className="min-w-0">
          {/* Phones: sticky, scrolling chip row under the navbar */}
          <nav
            aria-label={faqCopy.categoriesLabel}
            className="sticky top-[86px] z-20 -mx-6 mb-2 bg-white/90 py-3 backdrop-blur-md lg:hidden"
          >
            <div ref={chipRowRef} className="flex gap-2 overflow-x-auto overflow-y-hidden px-6 scrollbar-none">
              {faqCategories.map((c) => topicLink(c.id, c.title, c.items.length, "chip"))}
            </div>
          </nav>

          <div className="flex flex-col gap-14">
            {faqCategories.map((category, ci) => (
              // scroll-mt matches scrollOffset(), for direct links like /faq#faq-billing.
              <div key={category.id} id={topicId(category.id)} className="scroll-mt-40 lg:scroll-mt-28">
                <TopicHeading className="text-neutral-500 text-caption">{category.title}</TopicHeading>
                <FaqAccordion items={category.items} idPrefix={category.id} defaultOpen={ci === 0 ? 0 : undefined} className="mt-4" />
              </div>
            ))}
          </div>

          <ContactCard className="mt-12 lg:hidden" />
        </div>
      </div>
    </section>
  )
}

"use client"

import * as React from "react"
import { MotionConfig, animate, motion, useInView, useMotionValue, type PanInfo } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PauseIcon, PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { EASE, useReducedMotion } from "@/lib/motion"
import { container, focusRing, glass, headerGap, sectionY } from "@/lib/styles"
import { site } from "@/lib/data/site"
import { stories, storiesCopy, storiesHeading, storiesIntro, type PatientStory } from "@/lib/data/stories"
import { Button } from "@/components/ui/button"
import { Media } from "@/components/site/media"
import { SectionHeader } from "@/components/site/section-header"
import { StarGlyph } from "@/components/site/icons"

/** Time each story stays up while autoplaying. */
const SLIDE_MS = 7000
/** Gap between slides; the divider line sits in the middle of it. */
const GAP_PX = 48
const SWIPE_PX = 50

const rating = storiesCopy.rating(site.rating.score, site.rating.count)

type SlideProps = {
  story: PatientStory
  index: number
  active: boolean
  onSelect: () => void
  ref?: React.Ref<HTMLDivElement>
}

function Slide({ story, index, active, onSelect, ref }: SlideProps) {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      aria-label={storiesCopy.slideLabel(index + 1, stories.length, story.name)}
      aria-hidden={!active || undefined}
      onClick={active ? undefined : onSelect}
      className={cn(
        "relative w-full shrink-0 transition-opacity duration-500 sm:w-[85%] lg:w-[70%]",
        "before:absolute before:inset-y-0 before:-left-6 before:w-px before:bg-neutral-200",
        active ? "opacity-100" : "cursor-pointer opacity-35 hover:opacity-50"
      )}
    >
      <figure>
        <Media
          image={story.image}
          alt={story.imageAlt}
          placeholder={story.placeholder}
          sizes="(min-width: 1024px) 860px, 100vw"
          className="aspect-video rounded-[20px]"
        >
          {/* Short glass tag ties the photo to the story without covering the face. */}
          <figcaption
            className={cn(
              glass,
              "absolute bottom-3 left-3 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 sm:bottom-4 sm:left-4 text-caption"
            )}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
              <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-3.5" />
            </span>
            <span className="truncate">
              {storiesCopy.person(story.name, story.age)}
              <span className="text-white/65"> · {story.tag}</span>
            </span>
          </figcaption>
        </Media>

        <blockquote className="mt-6 text-neutral-950 text-lead">“{story.quote}”</blockquote>
        <p className="mt-3 text-neutral-500 text-caption">{story.outcome}</p>
      </figure>
    </div>
  )
}

export function Stories() {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [userPaused, setUserPaused] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [slideWidth, setSlideWidth] = React.useState(0)

  const sectionRef = React.useRef<HTMLElement>(null)
  const firstSlideRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { amount: 0.4 })

  const count = stories.length
  const autoplay = !reduceMotion && !userPaused
  const running = autoplay && inView && !hovered

  // 0 → 1 timer for the active story. Lives in a motion value so pausing keeps its place.
  const progress = useMotionValue(0)

  const go = React.useCallback(
    (next: number) => {
      progress.set(0)
      setIndex(((next % count) + count) % count)
    },
    [count, progress]
  )

  React.useEffect(() => {
    if (!running) return
    const controls = animate(progress, 1, {
      duration: (SLIDE_MS / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => go(index + 1),
    })
    return () => controls.stop()
  }, [running, index, progress, go])

  // Track slide width so the strip moves by exactly one slide + gap.
  React.useEffect(() => {
    const el = firstSlideRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setSlideWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX) go(index + 1)
    else if (info.offset.x > SWIPE_PX) go(index - 1)
  }

  return (
    <MotionConfig transition={reduceMotion ? { duration: 0 } : undefined}>
      <section
        ref={sectionRef}
        aria-roledescription="carousel"
        aria-labelledby="stories-heading"
        className={cn("relative overflow-hidden", sectionY)}
      >
        <div className={container}>
          <SectionHeader
            id="stories-heading"
            align="start"
            label={
              <>
                <span className="text-neutral-950">{rating.score}</span>
                <StarGlyph className="size-4 text-emerald-500" />
                {rating.count}
              </>
            }
            heading={storiesHeading}
            intro={storiesIntro}
          />

          {/* Slides */}
          <div
            className={headerGap}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <motion.div
              aria-live={running ? "off" : "polite"}
              className="flex touch-pan-y"
              style={{ gap: GAP_PX }}
              animate={{ x: -index * (slideWidth + GAP_PX) }}
              transition={{ duration: 0.8, ease: EASE }}
              onPanEnd={onPanEnd}
            >
              {stories.map((story, i) => (
                <Slide
                  key={story.id}
                  ref={i === 0 ? firstSlideRef : undefined}
                  story={story}
                  index={i}
                  active={i === index}
                  onSelect={() => go(i)}
                />
              ))}
            </motion.div>
          </div>

          {/* Progress + controls */}
          <div className="mt-12 flex items-center gap-4 sm:w-[85%] lg:w-[70%]">
            <div className="flex flex-1 items-center gap-2.5">
              {stories.map((story, i) => {
                const isActive = i === index
                return (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={storiesCopy.goTo(i + 1, story.name)}
                    aria-current={isActive || undefined}
                    className={cn(
                      // 40px tall hit area; the negative margin keeps the row at its visual height.
                      "group -my-2 flex h-10 items-center rounded-full transition-[flex-grow] duration-500 ease-out",
                      isActive ? "grow-[6]" : "grow",
                      focusRing.dark
                    )}
                    style={{ flexBasis: 0 }}
                  >
                    <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-neutral-200 transition-colors group-hover:bg-neutral-300">
                      {isActive && (
                        <motion.span
                          className="absolute inset-0 origin-left rounded-full bg-neutral-950"
                          style={{ scaleX: reduceMotion ? 1 : progress }}
                        />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <span className="shrink-0 text-neutral-500 tabular-nums text-caption">
              {storiesCopy.counter(index + 1, count)}
            </span>

            {!reduceMotion && (
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? storiesCopy.play : storiesCopy.pause}
                className="relative rounded-full after:absolute after:-inset-1"
              >
                <HugeiconsIcon aria-hidden="true" icon={userPaused ? PlayIcon : PauseIcon} strokeWidth={1.8} />
              </Button>
            )}
          </div>
        </div>
      </section>
    </MotionConfig>
  )
}

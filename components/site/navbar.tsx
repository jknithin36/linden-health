"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { LayoutGroup, MotionConfig, motion, useMotionValueEvent, useScroll, type Transition } from "motion/react"

import { cn } from "@/lib/utils"
import { EASE, useReducedMotion } from "@/lib/motion"
import { focusRing as focusRingStyles } from "@/lib/styles"
import { site } from "@/lib/data/site"
import {
  bookLink,
  loginLink,
  dashboardLabel,
  menuColumns,
  menuExplore,
  navCopy,
  primaryLinks,
} from "@/lib/data/navigation"
import { prefetchFor } from "@/lib/data/preview"
import { useSession } from "@/lib/session-client"
import { Button } from "@/components/ui/button"
import { GridDotsIcon } from "@/components/site/icons"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

/** Switch to the pill at 80px, back to the full bar below 40px. */
const SCROLL_ENTER = 80
const SCROLL_EXIT = 40

const BASE_TRANSITION: Transition = { duration: 0.45, ease: EASE }
const INSTANT: Transition = { duration: 0 }

const COLORS = {
  ink: "#171717", // neutral-900
  inkDeep: "#0a0a0a", // neutral-950
  inkHover: "#262626", // neutral-800
  white: "#ffffff",
  whiteHover: "#e5e5e5", // neutral-200
  glass: "rgba(23, 23, 23, 0.55)", // neutral-900/55
  glassBorder: "rgba(255, 255, 255, 0.1)",
  bar: "rgba(255, 255, 255, 1)",
  barBorder: "rgba(255, 255, 255, 0)",
}

const focusRing = focusRingStyles.current

const MotionLink = motion.create(Link)

/** "Log in", or "Dashboard" (to the signed-in role's home) once there's a session. */
function useAccountLink() {
  const session = useSession()
  return session ? { label: dashboardLabel, href: session.home } : loginLink
}

function Logo({ inverted }: { inverted: boolean }) {
  return (
    <Link
      href="/"
      aria-label={navCopy.homeLabel}
      className={cn("relative block h-6 rounded-sm lg:h-7", focusRing)}
    >
      <motion.span
        className="block h-full"
        initial={false}
        animate={{ opacity: inverted ? 0 : 1 }}
      >
        <Image
          src={site.logo.dark}
          alt=""
          width={site.logo.width}
          height={site.logo.height}
          preload
          className="h-full w-auto"
        />
      </motion.span>
      <motion.span
        className="absolute inset-0 block h-full"
        initial={false}
        animate={{ opacity: inverted ? 1 : 0 }}
      >
        <Image
          src={site.logo.light}
          alt=""
          width={site.logo.width}
          height={site.logo.height}
          className="h-full w-auto"
        />
      </motion.span>
    </Link>
  )
}

type MenuButtonProps = {
  floating: boolean
  open: boolean
  controlsId: string
  onToggle: () => void
  ref: React.Ref<HTMLButtonElement>
}

function MenuButton({
  floating,
  open,
  controlsId,
  onToggle,
  ref,
}: MenuButtonProps) {
  return (
    <motion.button
      ref={ref}
      type="button"
      layoutId="navbar-menu-button"
      onClick={onToggle}
      aria-label={open ? navCopy.closeMenu : navCopy.openMenu}
      aria-expanded={open}
      aria-controls={controlsId}
      aria-haspopup="dialog"
      className={cn(
        "pointer-events-auto grid shrink-0 place-items-center rounded-full",
        focusRing,
        floating
          ? "size-[54px] border border-white/10 bg-neutral-900/55 text-white backdrop-blur-xl hover:bg-neutral-900/70"
          : "size-11 text-neutral-900 hover:bg-neutral-900/5"
      )}
    >
      <GridDotsIcon className="size-5" />
    </motion.button>
  )
}

const linkStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
}

const linkReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
}

function MenuSheetBody({ onNavigate }: { onNavigate: () => void }) {
  const account = useAccountLink()
  return (
    <div className="flex min-h-full flex-col px-6 pt-6 pb-8 sm:px-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <SheetTitle className="mr-auto text-neutral-950 text-title">
          {navCopy.menuTitle}
        </SheetTitle>
        <SheetDescription className="sr-only">{navCopy.menuDescription}</SheetDescription>
        <Link
          href={account.href}
          onClick={onNavigate}
          className={cn(
            "rounded-sm text-neutral-900 transition-opacity hover:opacity-70 text-caption",
            focusRing
          )}
        >
          {account.label}
        </Link>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href={bookLink.href} onClick={onNavigate} />}
          className="hidden rounded-full sm:inline-flex text-caption"
        >
          {bookLink.label}
        </Button>
        <SheetClose
          aria-label={navCopy.closeMenu}
          render={<Button variant="ghost" size="icon-lg" className="rounded-full" />}
        >
          <GridDotsIcon className="size-[18px]" />
        </SheetClose>
      </div>

      <nav aria-label={navCopy.menuLabel} className="mt-8">
        <p className="text-neutral-500 text-caption">{navCopy.exploreTitle}</p>
        <motion.ul
          variants={linkStagger}
          initial="hidden"
          animate="visible"
          className="mt-2 flex flex-col"
        >
          {menuExplore.map((link) => (
            <motion.li key={link.label} variants={linkReveal}>
              <Link
                href={link.href}
                prefetch={prefetchFor(link.href)}
                onClick={onNavigate}
                className={cn(
                  "inline-block rounded-sm py-0.5 text-neutral-950 transition-opacity hover:opacity-60 text-title",
                  focusRing
                )}
              >
                {link.label}
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        <div className="mt-10 grid grid-cols-2 gap-6">
          {menuColumns.map((column) => (
            <div key={column.title}>
              <p className="text-neutral-500 text-caption">
                {column.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      prefetch={prefetchFor(link.href)}
                      onClick={onNavigate}
                      className={cn(
                        "rounded-sm text-neutral-900 transition-opacity hover:opacity-60 text-caption",
                        focusRing
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto flex flex-col gap-4 pt-10">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href={bookLink.href} onClick={onNavigate} />}
          className="rounded-full sm:hidden text-caption"
        >
          {bookLink.label}
        </Button>
        <a
          href={`tel:${site.phone.tel}`}
          className={cn(
            "self-start rounded-sm text-neutral-500 transition-colors hover:text-neutral-900 text-caption",
            focusRing
          )}
        >
          {navCopy.callUs} {site.phone.display}
        </a>
      </div>
    </div>
  )
}

export function Navbar() {
  const account = useAccountLink()
  const [scrolled, setScrolled] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  const prefersReducedMotion = useReducedMotion()
  const menuId = React.useId()

  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled((prev) => (prev ? y >= SCROLL_EXIT : y >= SCROLL_ENTER))
  })

  const transition = prefersReducedMotion ? INSTANT : BASE_TRANSITION

  const menuButton = (
    <MenuButton
      ref={buttonRef}
      floating={scrolled}
      open={menuOpen}
      controlsId={menuId}
      onToggle={() => setMenuOpen((open) => !open)}
    />
  )

  return (
    <MotionConfig transition={transition}>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
        <LayoutGroup>
          <motion.div
            layout
            className={cn(
              "flex items-center",
              scrolled
                ? "mt-4 w-[calc(100%-32px)] gap-2 lg:w-auto"
                : "mt-0 w-full"
            )}
          >
            <motion.nav
              layout
              aria-label={navCopy.navLabel}
              initial={false}
              animate={{
                backgroundColor: scrolled ? COLORS.glass : COLORS.bar,
                borderColor: scrolled ? COLORS.glassBorder : COLORS.barBorder,
                color: scrolled ? COLORS.white : COLORS.ink,
                borderRadius: scrolled ? 27 : 0,
              }}
              className={cn(
                "pointer-events-auto border",
                scrolled
                  ? "h-[54px] min-w-0 flex-1 backdrop-blur-xl lg:max-w-[990px] lg:flex-none"
                  : "h-[88px] w-full"
              )}
            >
              <motion.div
                layout
                className={cn(
                  "mx-auto grid h-full grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]",
                  scrolled
                    ? "gap-4 pr-2 pl-5 lg:px-5"
                    : "max-w-[1440px] gap-8 px-4 sm:px-6 lg:px-14"
                )}
              >
                <motion.ul
                  layout="position"
                  className={cn(
                    "hidden items-center lg:flex",
                    scrolled ? "gap-4" : "gap-8"
                  )}
                >
                  {primaryLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className={cn(
                          "rounded-sm whitespace-nowrap transition-opacity text-caption",
                          scrolled
                            ? "opacity-90 hover:opacity-100"
                            : "hover:opacity-70",
                          focusRing
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>

                <motion.div
                  layout="position"
                  className="justify-self-start lg:justify-self-center"
                >
                  <Logo inverted={scrolled} />
                </motion.div>

                <motion.div
                  layout="position"
                  className={cn(
                    "flex items-center justify-self-end",
                    scrolled ? "gap-4" : "gap-3 lg:gap-6"
                  )}
                >
                  <Link
                    href={account.href}
                    className={cn(
                      "hidden rounded-sm whitespace-nowrap transition-opacity lg:inline text-caption",
                      scrolled
                        ? "opacity-90 hover:opacity-100"
                        : "hover:opacity-70",
                      focusRing
                    )}
                  >
                    {account.label}
                  </Link>
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={
                      <MotionLink
                        href={bookLink.href}
                        initial={false}
                        animate={{
                          backgroundColor: scrolled
                            ? COLORS.white
                            : COLORS.inkDeep,
                          color: scrolled ? COLORS.inkDeep : COLORS.white,
                        }}
                        whileHover={{
                          backgroundColor: scrolled
                            ? COLORS.whiteHover
                            : COLORS.inkHover,
                          transition: prefersReducedMotion
                            ? INSTANT
                            : { duration: 0.15 },
                        }}
                      />
                    }
                    className={cn(
                      "rounded-full focus-visible:border-transparent focus-visible:ring-0",
                      focusRing,
                      "text-caption"
                    )}
                  >
                    {bookLink.label}
                  </Button>
                  {!scrolled && menuButton}
                </motion.div>
              </motion.div>
            </motion.nav>

            {scrolled && menuButton}
          </motion.div>
        </LayoutGroup>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          id={menuId}
          side="right"
          showCloseButton={false}
          overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-none duration-300"
          className={cn(
            "overflow-y-auto rounded-l-[32px] border-0 bg-white shadow-none duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "data-[side=right]:w-[calc(100%-16px)] data-[side=right]:sm:max-w-[480px]",
            "data-[side=right]:data-starting-style:translate-x-full data-[side=right]:data-ending-style:translate-x-full",
            "data-starting-style:opacity-100 data-ending-style:opacity-100",
            "motion-reduce:transition-none"
          )}
        >
          <MenuSheetBody onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </MotionConfig>
  )
}

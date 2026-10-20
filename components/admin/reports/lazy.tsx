"use client"

import * as React from "react"

import { ChartSkeleton } from "@/components/admin/ui"

/** Renders its children only once scrolled near the viewport; shows a chart skeleton until then. */
export function LazyRender({ children, className, eager }: { children: React.ReactNode; className?: string; eager?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(!!eager)
  React.useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: "200px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])
  return (
    <div ref={ref} className={className}>
      {visible ? children : <ChartSkeleton className="h-full min-h-80" />}
    </div>
  )
}

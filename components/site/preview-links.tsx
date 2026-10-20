"use client"

import * as React from "react"

import { previewCopy, previewKind } from "@/lib/data/preview"
import { toast } from "@/components/ui/toast"

/**
 * Catches clicks on links to pages the template doesn't include yet (and "#" placeholders),
 * anywhere on the site, and shows a toast instead of navigating to a 404.
 * Runs in the capture phase, so Next's <Link> sees the click as already handled.
 */
export function PreviewLinks() {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!a) return
      // Checked before `target`: placeholder social links open in a new tab, which would just reload this page.
      const kind = previewKind(a.getAttribute("href"))
      if (!kind) return
      e.preventDefault()
      const label = (a.getAttribute("aria-label") ?? a.textContent ?? "").replace(/\s+/g, " ").trim()
      const c = previewCopy[kind]
      toast.add({ id: `preview-${label}`, title: c.title(label.length <= 40 ? label : ""), description: c.description, type: "info", timeout: 4000 })
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])
  return null
}

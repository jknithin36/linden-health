"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { fmtDateLong } from "@/lib/admin/format"

export { Section } from "@/components/admin/ui"

/** A quiet in-panel table: hairline row dividers, small grey headings, horizontal scroll on phones. */
export function MiniTable({ head, children, label }: { head: { label: string; align?: "right"; className?: string }[]; children: React.ReactNode; label: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table aria-label={label} className="w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h.label} scope="col" className={cn("border-y border-neutral-100 px-5 py-2 whitespace-nowrap text-neutral-500 text-micro first:pl-5", h.align === "right" && "text-right", h.className)}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">{children}</tbody>
      </table>
    </div>
  )
}

export const td = "border-b border-neutral-100 px-5 py-3 align-middle text-neutral-700 text-caption"

/** Portal dates are words ("Mar 3, 2026"); admin dates are ISO. Show either. */
export const anyDate = (s: string) => (/^\d{4}-\d{2}-\d{2}/.test(s) ? fmtDateLong(s) : s)

export function Muted({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-neutral-500 text-caption", className)}>{children}</p>
}

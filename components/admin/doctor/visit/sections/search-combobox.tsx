"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { inputCls } from "@/components/admin/doctor/visit/sections/section-card"

/**
 * A searchable listbox (ARIA 1.2 combobox pattern): type to filter, ↑/↓ to move, Enter to pick,
 * Esc to close (or clear). Focus stays in the input the whole time.
 */
export function SearchCombobox<T>({
  id,
  label,
  placeholder,
  emptyText,
  items,
  filter,
  getKey,
  renderItem,
  isSelected,
  onSelect,
  className,
}: {
  id: string
  label: string
  placeholder: string
  emptyText: string
  items: T[]
  filter: (item: T, q: string) => boolean
  getKey: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  isSelected?: (item: T) => boolean
  onSelect: (item: T) => void
  className?: string
}) {
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLUListElement>(null)
  const listId = `${id}-list`

  const query = q.trim().toLowerCase()
  const results = React.useMemo(() => (query ? items.filter((i) => filter(i, query)) : items), [items, filter, query])
  const activeIdx = Math.min(active, Math.max(0, results.length - 1))
  const activeKey = results[activeIdx] ? getKey(results[activeIdx]) : undefined
  const optionId = (k: string) => `${id}-opt-${k.replace(/[^a-zA-Z0-9_-]/g, "_")}`

  React.useEffect(() => {
    if (!open || !activeKey) return
    document.getElementById(optionId(activeKey))?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, open])

  const pick = (item: T) => {
    onSelect(item)
    setQ("")
    setActive(0)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) setOpen(true)
      else setActive((activeIdx + 1) % Math.max(1, results.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) setOpen(true)
      else setActive((activeIdx - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === "Enter") {
      if (open && results[activeIdx]) {
        e.preventDefault()
        pick(results[activeIdx])
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      } else if (q) {
        e.preventDefault()
        setQ("")
      }
    } else if (e.key === "Home" && open) {
      setActive(0)
    } else if (e.key === "End" && open) {
      setActive(results.length - 1)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeKey ? optionId(activeKey) : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={cn(inputCls, "pl-9")}
      />
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-neutral-200/70 bg-white p-1 shadow-lg shadow-neutral-950/5"
      >
        {results.length === 0 && (
          <li role="presentation" className="px-3 py-2.5 text-neutral-500 text-caption">
            {emptyText}
          </li>
        )}
        {results.map((item, i) => {
          const k = getKey(item)
          const sel = isSelected?.(item) ?? false
          return (
            <li
              key={k}
              id={optionId(k)}
              role="option"
              aria-selected={i === activeIdx}
              aria-checked={isSelected ? sel : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => i !== activeIdx && setActive(i)}
              onClick={() => pick(item)}
              className={cn("flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-neutral-800 text-caption", i === activeIdx && "bg-neutral-100 text-neutral-950")}
            >
              <span className="min-w-0 flex-1">{renderItem(item)}</span>
              {sel && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" className="size-4 text-emerald-600" />}
            </li>
          )
        })}
      </ul>
      <span className="sr-only" aria-live="polite">
        {open ? `${results.length} result${results.length === 1 ? "" : "s"}` : ""}
      </span>
    </div>
  )
}

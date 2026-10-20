"use client"

import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Calendar03Icon,
  Cancel01Icon,
  FilterHorizontalIcon,
  PlusSignCircleIcon,
  Search01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import {
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type ColumnVisibilityState as VisibilityState,
  type RowData,
} from "@tanstack/react-table"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { fmtDateLong, fmtNumber, parseLocal, TODAY } from "@/lib/admin/format"
import { useDebounced, useLocalPref } from "@/components/admin/hooks"
import { EmptyState, ErrorState, TableSkeleton, panel, touchTarget } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/* --------------------------------- Columns --------------------------------- */

export type ColMeta = {
  /** Name in the column menu and for screen readers when the header is an icon. */
  label?: string
  align?: "left" | "right"
  className?: string
}

const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Col<T extends RowData> = ColumnDef<typeof features, T, any> & {
  meta?: ColMeta
}

/* -------------------------------- Data table ------------------------------- */

type Sort = { id: string; desc: boolean } | null

type DataTableProps<T extends RowData> = {
  id: string
  columns: Col<T>[]
  rows: T[]
  getRowId: (row: T) => string
  loading?: boolean
  refreshing?: boolean
  error?: Error | null
  onRetry?: () => void
  sort?: Sort
  onSortChange?: (s: Sort) => void
  selectable?: boolean
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode
  onRowClick?: (row: T) => void
  rowLabel?: (row: T) => string
  empty?: React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  defaultHidden?: string[]
  /** Accessible table name. */
  label: string
  /** Phone layout: rows become stacked cards rendered by this function. */
  mobileCard?: (row: T) => React.ReactNode
}

const emptySelection: RowSelectionState = {}

/**
 * The admin list table: server-sorted (sorting happens in the query), with row selection and
 * bulk actions, a column menu and density toggle, a sticky header, clickable and keyboard-
 * navigable rows (↑ ↓ to move, Enter to open).
 */
export function DataTable<T extends RowData>({
  id,
  columns,
  rows,
  getRowId,
  loading,
  refreshing,
  error,
  onRetry,
  sort,
  onSortChange,
  selectable,
  bulkActions,
  onRowClick,
  rowLabel,
  empty,
  toolbar,
  footer,
  defaultHidden = [],
  label,
  mobileCard,
}: DataTableProps<T>) {
  const [selection, setSelection] = React.useState<RowSelectionState>(emptySelection)
  const [hidden, setHidden] = useLocalPref<string[]>(`linden.admin.cols.${id}`, defaultHidden)
  const [density, setDensity] = useLocalPref<"comfortable" | "compact">("linden.admin.density", "comfortable")

  const allColumns = React.useMemo<Col<T>[]>(() => {
    if (!selectable) return columns
    const select: Col<T> = {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      meta: { label: "Select", className: "w-10 pr-0" },
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on this page"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <span onClick={(e) => e.stopPropagation()} className="flex">
          <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
        </span>
      ),
    }
    return [select, ...columns]
  }, [columns, selectable])

  const sorting = React.useMemo<SortingState>(() => (sort ? [sort] : []), [sort])
  const columnVisibility = React.useMemo<VisibilityState>(() => Object.fromEntries(hidden.map((h) => [h, false])), [hidden])

  const table = useTable({
    features,
    columns: allColumns,
    data: rows,
    getRowId: (r) => getRowId(r),
    manualSorting: true,
    enableRowSelection: !!selectable,
    state: { sorting, rowSelection: selection, columnVisibility },
    onSortingChange: (u) => {
      const next = typeof u === "function" ? u(sorting) : u
      onSortChange?.(next[0] ?? null)
    },
    onRowSelectionChange: (u) => setSelection((s) => (typeof u === "function" ? u(s) : u)),
    onColumnVisibilityChange: (u) => {
      const next = typeof u === "function" ? u(columnVisibility) : u
      setHidden(
        Object.entries(next)
          .filter(([, v]) => !v)
          .map(([k]) => k),
      )
    },
  })

  const selectedIds = Object.keys(selection).filter((k) => selection[k])
  const clear = () => setSelection(emptySelection)
  const visibleCount = table.getVisibleLeafColumns().length
  const py = density === "compact" ? "py-2" : "py-3"

  // The select box and the first data column stay put while the table scrolls sideways.
  const stickyFor = (colId: string, index: number, head: boolean) => {
    const first = selectable ? 1 : 0
    if (index > first) return ""
    const left = index === 0 ? "left-0" : "left-10"
    return cn(
      "sticky",
      left,
      head ? "z-[2]" : "z-[1] bg-white group-hover/row:bg-neutral-50 group-focus-visible/row:bg-neutral-50 group-aria-selected/row:bg-sky-50",
      index === first && "shadow-[inset_-1px_0_0_var(--color-neutral-100)]",
      colId === "select" && "w-10",
    )
  }

  const onKey = (e: React.KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (e.target !== e.currentTarget) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onRowClick?.(row)
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const next = (e.key === "ArrowDown" ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling) as HTMLElement | null
      next?.focus()
    }
  }

  return (
    <div className={cn(panel, "flex min-w-0 flex-col overflow-hidden")}>
      <div className="flex flex-wrap items-start gap-2 border-b border-neutral-100 p-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
        <ViewMenu
          columns={table
            .getAllLeafColumns()
            .filter((c) => c.getCanHide())
            .map((c) => ({
              id: c.id,
              label: (c.columnDef as Col<T>).meta?.label ?? c.id,
              visible: c.getIsVisible(),
              toggle: (v: boolean) => c.toggleVisibility(v),
            }))}
          density={density}
          setDensity={setDensity}
        />
      </div>

      {selectable && selectedIds.length > 0 && (
        <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2">
          <p className="mr-1 text-neutral-950 tabular-nums text-caption">{selectedIds.length} selected</p>
          {bulkActions?.(selectedIds, clear)}
          <Button variant="ghost" size="sm" className="ml-auto rounded-full text-neutral-600 text-caption" onClick={clear}>
            Clear
          </Button>
        </div>
      )}

      {loading ? (
        <TableSkeleton cols={Math.min(visibleCount, 7)} />
      ) : error ? (
        <ErrorState onRetry={onRetry} />
      ) : rows.length === 0 ? (
        (empty ?? <EmptyState title="No results" text="Try a different search or clear the filters." />)
      ) : (
        <>
          {mobileCard && (
            <ul aria-label={label} className={cn("flex flex-col divide-y divide-neutral-100 md:hidden", refreshing && "opacity-60")}>
              {rows.map((r) => (
                <li key={getRowId(r)}>
                  {onRowClick ? (
                    <button type="button" onClick={() => onRowClick(r)} aria-label={rowLabel?.(r)} className="block w-full px-4 py-3.5 text-left outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)]">
                      {mobileCard(r)}
                    </button>
                  ) : (
                    <div className="px-4 py-3.5">{mobileCard(r)}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className={cn("relative max-h-[calc(100dvh-16rem)] min-h-0 overflow-auto transition-opacity", mobileCard && "max-md:hidden", refreshing && "opacity-60")}>
            <table aria-label={label} aria-busy={refreshing || undefined} className="w-full border-separate border-spacing-0 text-left">
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header, hi) => {
                      const meta = (header.column.columnDef as Col<T>).meta
                      const sorted = header.column.getIsSorted()
                      const canSort = header.column.getCanSort() && !!onSortChange
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                          className={cn(
                            "sticky top-0 z-[1] border-b border-neutral-100 bg-white px-4 py-2.5 whitespace-nowrap text-neutral-500 text-micro",
                            stickyFor(header.column.id, hi, true),
                            meta?.align === "right" && "text-right",
                            meta?.className,
                          )}
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className={cn(
                                "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 outline-none hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950",
                                sorted && "text-neutral-950",
                                meta?.align === "right" && "flex-row-reverse",
                              )}
                            >
                              <table.FlexRender header={header} />
                              <HugeiconsIcon icon={sorted === "asc" ? ArrowUp01Icon : sorted === "desc" ? ArrowDown01Icon : ArrowUpDownIcon} strokeWidth={2} className={cn("size-3.5", !sorted && "opacity-40")} />
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-label={rowLabel?.(row.original)}
                    aria-selected={selectable ? row.getIsSelected() : undefined}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    onKeyDown={onRowClick ? (e) => onKey(e, row.original) : undefined}
                    className={cn(
                      "group/row outline-none [&:last-child>td]:border-b-0",
                      onRowClick && "cursor-pointer hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:shadow-[inset_2px_0_0_var(--color-neutral-950)]",
                      row.getIsSelected() && "bg-sky-50/50 hover:bg-sky-50",
                    )}
                  >
                    {row.getVisibleCells().map((cell, ci) => {
                      const meta = (cell.column.columnDef as Col<T>).meta
                      return (
                        <td key={cell.id} className={cn("border-b border-neutral-100 px-4 align-middle text-neutral-700 text-caption", py, stickyFor(cell.column.id, ci, false), meta?.align === "right" && "text-right", meta?.className)}>
                          <table.FlexRender cell={cell} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {footer && !error && <div className="border-t border-neutral-100">{footer}</div>}
    </div>
  )
}

function ViewMenu({
  columns,
  density,
  setDensity,
}: {
  columns: {
    id: string
    label: string
    visible: boolean
    toggle: (v: boolean) => void
  }[]
  density: "comfortable" | "compact"
  setDensity: (d: "comfortable" | "compact") => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-10 rounded-full border-neutral-200 px-3.5 text-neutral-700 md:h-9 text-caption" />}>
        <HugeiconsIcon icon={Settings02Icon} strokeWidth={1.8} data-icon="inline-start" />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 text-neutral-400 text-micro">Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as "comfortable" | "compact")}>
            <DropdownMenuRadioItem value="comfortable" className="text-caption">
              Comfortable
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact" className="text-caption">
              Compact
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {columns.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 text-neutral-400 text-micro">Columns</DropdownMenuLabel>
              {columns.map((c) => (
                <DropdownMenuCheckboxItem key={c.id} checked={c.visible} onCheckedChange={(v) => c.toggle(!!v)} closeOnClick={false} className="text-caption">
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* --------------------------------- Toolbar --------------------------------- */

/** Search box that reports a debounced value (300 ms), and keeps typing smooth. */
export function SearchInput({ value, onChange, placeholder = "Search", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const [text, setText] = React.useState(value)
  const debounced = useDebounced(text, 300)
  const last = React.useRef(value)
  React.useEffect(() => {
    if (debounced !== last.current) {
      last.current = debounced
      onChange(debounced)
    }
  }, [debounced, onChange])
  // Reset from outside (the Reset button).
  React.useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(value)
    }
  }, [value])
  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-neutral-400" />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 rounded-full border-neutral-200 bg-white pr-3 pl-9.5 shadow-none hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-0 md:h-9 text-caption"
      />
    </div>
  )
}

/** The dashed pill that opens a filter popover (solid once a value is chosen). 40px tall on phones. */
export const filterTrigger = (active: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-neutral-300 bg-white px-3.5 text-neutral-700 transition-colors outline-none md:h-9 text-caption",
    "hover:border-neutral-400 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950 data-popup-open:border-neutral-950",
    active && "border-solid",
  )

type FacetOption = {
  value: string
  label: string
  icon?: IconSvgElement
}

/** Multi-select facet with live counts (counts come from the query, applying every other filter). */
export function FacetFilter({ title, options, selected, onChange, counts }: { title: string; options: FacetOption[]; selected: string[]; onChange: (v: string[]) => void; counts?: Record<string, number> }) {
  const [q, setQ] = React.useState("")
  const shown = options.length > 8 ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
  return (
    <Popover>
      <PopoverTrigger className={filterTrigger(selected.length > 0)}>
        <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={1.8} className="size-4 text-neutral-400" />
        {title}
        {selected.length > 0 && (
          <>
            <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-neutral-200" />
            <span className="rounded-full bg-neutral-950 px-2 py-px text-white text-micro">{selected.length > 2 ? `${selected.length} selected` : selected.map(labelOf).join(", ")}</span>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-0 rounded-2xl p-1.5">
        {options.length > 8 && (
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Find ${title.toLowerCase()}`}
            aria-label={`Find ${title.toLowerCase()}`}
            className="mb-1.5 h-9 rounded-xl border-neutral-200 shadow-none focus-visible:ring-0 text-caption"
          />
        )}
        <ul role="listbox" aria-multiselectable="true" aria-label={title} className="max-h-72 overflow-y-auto">
          {shown.map((o) => {
            const on = selected.includes(o.value)
            const n = counts?.[o.value] ?? 0
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-neutral-800 outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 text-caption",
                    !on && counts && n === 0 && "text-neutral-400",
                  )}
                >
                  <Checkbox checked={on} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />
                  {o.icon && <HugeiconsIcon icon={o.icon} strokeWidth={1.8} className="size-4 text-neutral-500" />}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {counts && <span className="text-neutral-400 tabular-nums text-micro">{fmtNumber(n)}</span>}
                </button>
              </li>
            )
          })}
          {shown.length === 0 && <li className="px-3 py-4 text-center text-neutral-500 text-caption">No matches</li>}
        </ul>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-xl border-t border-neutral-100 px-2.5 py-2 text-center text-neutral-600 outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 text-caption"
          >
            Clear {title.toLowerCase()}
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Less-used facets grouped behind one "More filters" button, so the toolbar stays on one line. */
export function MoreFilters({
  groups,
}: {
  groups: {
    key: string
    title: string
    options: FacetOption[]
    selected: string[]
    onChange: (v: string[]) => void
    counts?: Record<string, number>
  }[]
}) {
  const active = groups.reduce((n, g) => n + g.selected.length, 0)
  return (
    <Popover>
      <PopoverTrigger className={filterTrigger(active > 0)}>
        <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={1.8} className="size-4 text-neutral-400" />
        More filters
        {active > 0 && <span className="rounded-full bg-neutral-950 px-1.5 py-px text-white tabular-nums text-micro">{active}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-0 rounded-2xl p-1.5">
        {groups.map((g, i) => (
          <div key={g.key} role="group" aria-label={g.title} className={cn(i > 0 && "mt-1 border-t border-neutral-100 pt-1")}>
            <p className="px-2.5 pt-1.5 pb-1 text-neutral-400 text-micro">{g.title}</p>
            {g.options.map((o) => {
              const on = g.selected.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => g.onChange(on ? g.selected.filter((x) => x !== o.value) : [...g.selected, o.value])}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-neutral-800 outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 text-caption"
                >
                  <Checkbox checked={on} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />
                  <span className="flex-1">{o.label}</span>
                  {g.counts && <span className="text-neutral-400 tabular-nums text-micro">{fmtNumber(g.counts[o.value] ?? 0)}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/** From–to date range. Values are "YYYY-MM-DD" strings. */
export function DateRangeFilter({ from, to, onChange, label = "Dates" }: { from: string; to: string; onChange: (from: string, to: string) => void; label?: string }) {
  const [open, setOpen] = React.useState(false)
  const range = {
    from: from ? parseLocal(from) : undefined,
    to: to ? parseLocal(to) : undefined,
  }
  const text = from && to ? (from === to ? fmtDateLong(from) : `${fmtDateLong(from)} – ${fmtDateLong(to)}`) : from ? `From ${fmtDateLong(from)}` : label
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(filterTrigger(!!from), from && "text-neutral-950")}>
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} className="size-4 text-neutral-400" />
        {text}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 rounded-2xl p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={range.from ?? parseLocal(TODAY)}
          selected={range.from ? { from: range.from, to: range.to } : undefined}
          onSelect={(r) => onChange(r?.from ? format(r.from, "yyyy-MM-dd") : "", r?.to ? format(r.to, "yyyy-MM-dd") : "")}
        />
        <div className="flex justify-between gap-2 border-t border-neutral-100 p-2">
          <Button variant="ghost" size="sm" className="rounded-full text-caption" onClick={() => onChange("", "")}>
            Clear
          </Button>
          <Button size="sm" className="rounded-full px-4 text-caption" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ResetButton({ onClick, show }: { onClick: () => void; show: boolean }) {
  if (!show) return null
  return (
    <Button variant="ghost" size="sm" className="h-10 rounded-full px-3 text-neutral-600 md:h-9 text-caption" onClick={onClick}>
      Reset
      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-end" />
    </Button>
  )
}

/** Removable chips for every active filter, under the toolbar. */
export function FilterChips({ chips }: { chips: { key: string; label: string; onRemove: () => void }[] }) {
  if (!chips.length) return null
  return (
    <ul aria-label="Active filters" className="flex w-full flex-wrap gap-1.5">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={`Remove filter: ${c.label}`}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-neutral-100 pr-2 pl-3 text-neutral-700 outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-950 text-micro"
          >
            {c.label}
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------- Pagination ------------------------------- */

export function Pagination({ page, pageCount, pageSize, total, onPage, onPageSize }: { page: number; pageCount: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize: (n: number) => void }) {
  const [input, setInput] = React.useState(String(page))
  // Follow page changes made elsewhere (arrows, filters) without an effect.
  const [shownPage, setShownPage] = React.useState(page)
  if (shownPage !== page) {
    setShownPage(page)
    setInput(String(page))
  }
  const from = total ? (page - 1) * pageSize + 1 : 0
  const to = Math.min(total, page * pageSize)
  const go = (p: number) => onPage(Math.min(pageCount, Math.max(1, p)))
  const nav = cn("size-8 rounded-full text-neutral-600 [&_svg]:size-4", touchTarget)
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <p className="text-neutral-500 tabular-nums text-caption" aria-live="polite">
        Showing {fmtNumber(from)}–{fmtNumber(to)} of {fmtNumber(total)}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-neutral-500 text-caption">
          Rows
          <Select
            items={[10, 25, 50, 100].map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            value={String(pageSize)}
            onValueChange={(v) => v && onPageSize(Number(v))}
          >
            <SelectTrigger size="sm" aria-label="Rows per page" className="h-8 w-18 rounded-full border-neutral-200 shadow-none text-caption">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-xl">
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-caption">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className={nav} disabled={page <= 1} onClick={() => go(1)} aria-label="First page">
            <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={1.8} />
          </Button>
          <Button variant="ghost" size="icon" className={nav} disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.8} />
          </Button>
          <form
            className="flex items-center gap-1.5 px-1 text-neutral-500 text-caption"
            onSubmit={(e) => {
              e.preventDefault()
              go(Number(input) || 1)
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
              onBlur={() => go(Number(input) || 1)}
              inputMode="numeric"
              aria-label={`Page, of ${pageCount}`}
              className="h-8 w-12 rounded-lg border-neutral-200 px-1 text-center tabular-nums shadow-none focus-visible:ring-0 text-caption"
            />
            <span className="tabular-nums">of {fmtNumber(pageCount)}</span>
          </form>
          <Button variant="ghost" size="icon" className={nav} disabled={page >= pageCount} onClick={() => go(page + 1)} aria-label="Next page">
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.8} />
          </Button>
          <Button variant="ghost" size="icon" className={nav} disabled={page >= pageCount} onClick={() => go(pageCount)} aria-label="Last page">
            <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={1.8} />
          </Button>
        </div>
      </div>
    </nav>
  )
}

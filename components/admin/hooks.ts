"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useAdminState } from "@/lib/admin/store"

/**
 * Runs an async query and re-runs it when `deps` change or when anything in the admin store
 * changes (a check-in, a payment…). Keeps the last result on screen while refetching, so
 * only the very first load shows a skeleton.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const version = useAdminState((s) => s.version)
  const [attempt, setAttempt] = React.useState(0)
  // A token that changes whenever the inputs do (deps should be plain values); the result records which token it answers.
  const token = `${JSON.stringify(deps)}|${version}|${attempt}`
  const [state, setState] = React.useState<{ data: T | null; error: Error | null; for: string | null }>({ data: null, error: null, for: null })
  const fnRef = React.useRef(fn)
  React.useInsertionEffect(() => {
    fnRef.current = fn
  })

  React.useEffect(() => {
    let live = true
    fnRef.current().then(
      (data) => live && setState({ data, error: null, for: token }),
      (error: Error) => live && setState((s) => ({ ...s, error, for: token }))
    )
    return () => {
      live = false
    }
  }, [token])

  const loading = state.for !== token
  return { data: state.data, error: loading ? null : state.error, loading, initial: loading && state.data === null, retry: () => setAttempt((n) => n + 1) }
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/**
 * List state in the URL (?q=&page=&sort=-start&status=confirmed,arrived), so filters, sort and
 * page survive a refresh and can be shared. Must render inside <Suspense> (useSearchParams).
 */
export function useUrlState() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // `set` reads the latest params through a ref, so callbacks captured earlier (memoized table
  // columns, row menus) never write back stale filters.
  const latest = React.useRef(params)
  React.useInsertionEffect(() => {
    latest.current = params
  })

  const get = React.useCallback((key: string, fallback = "") => params.get(key) ?? fallback, [params])
  const getList = React.useCallback((key: string) => (params.get(key) ?? "").split(",").filter(Boolean), [params])

  const set = React.useCallback(
    (patch: Record<string, string | string[] | number | null | undefined>, opts?: { keepPage?: boolean }) => {
      const next = new URLSearchParams(latest.current.toString())
      for (const [k, v] of Object.entries(patch)) {
        const s = Array.isArray(v) ? v.join(",") : v == null ? "" : String(v)
        if (s) next.set(k, s)
        else next.delete(k)
      }
      // Any filter change goes back to page 1.
      if (!opts?.keepPage && !("page" in patch)) next.delete("page")
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router]
  )

  const sort = React.useMemo(() => {
    const s = params.get("sort")
    return s ? { id: s.replace(/^-/, ""), desc: s.startsWith("-") } : null
  }, [params])

  return {
    params,
    get,
    getList,
    set,
    page: Math.max(1, Number(params.get("page") ?? 1) || 1),
    pageSize: [10, 25, 50, 100].includes(Number(params.get("size"))) ? Number(params.get("size")) : 25,
    sort,
    setSort: (s: { id: string; desc: boolean } | null) => set({ sort: s ? `${s.desc ? "-" : ""}${s.id}` : null }, { keepPage: true }),
  }
}

/** A per-viewer preference kept in localStorage (density, hidden columns). Falls back silently. */
export function useLocalPref<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw) as T)
    } catch {
      // ignore
    }
  }, [key])
  const update = React.useCallback(
    (v: T) => {
      setValue(v)
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        // ignore
      }
    },
    [key]
  )
  return [value, update] as const
}

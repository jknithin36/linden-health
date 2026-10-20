// Which results this visitor has opened, so "New" dots (and the sidebar's "1 new") clear once read.

import { createSessionSet } from "@/lib/session-store"
import { results } from "@/lib/data/results"

const store = createSessionSet("linden.seenResults")

export const markResultSeen = (id: string) => store.add(id)
export const useSeenResults = store.useSet

/** New results this visitor hasn't opened yet. */
export function useUnseenResultCount() {
  const opened = useSeenResults()
  return results.filter((r) => r.isNew && !opened.has(r.id)).length
}

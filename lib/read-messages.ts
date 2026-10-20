// Which conversations this visitor has opened, so unread dots and the sidebar's count clear once read.

import { createSessionSet } from "@/lib/session-store"
import { conversations } from "@/lib/data/messages"

const store = createSessionSet("linden.readThreads")

export const markThreadRead = (id: string) => store.add(id)
export const useReadThreads = store.useSet

export function useUnreadThreadCount() {
  const read = useReadThreads()
  return conversations.filter((c) => c.unread && !read.has(c.id)).length
}

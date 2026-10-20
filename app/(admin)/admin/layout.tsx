import { Suspense } from "react"
import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { getSession } from "@/lib/session-server"
import { AdminShell, AdminSidebar, AdminSidebarSkeleton } from "@/components/admin/shell"

export const metadata: Metadata = {
  title: { template: `%s · Admin · ${site.name}`, default: `Admin · ${site.name}` },
  robots: { index: false },
}

/** Reads the session cookie on the server and gives each role its own sidebar. */
async function SessionSidebar() {
  const session = await getSession()
  return <AdminSidebar session={session} />
}

/** Staff admin: its own sidebar layout, without the marketing navbar and footer. Route access is checked in proxy.ts. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell
      sidebar={
        <Suspense fallback={<AdminSidebarSkeleton />}>
          <SessionSidebar />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
  )
}

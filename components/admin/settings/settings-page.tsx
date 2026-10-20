"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { RotateLeft01Icon } from "@hugeicons/core-free-icons"

import { adminCopy } from "@/lib/data/admin"
import { settingsCopy } from "@/lib/data/admin-settings"
import { resetAdminState } from "@/lib/admin/store"
import { useUrlState } from "@/components/admin/hooks"
import { ConfirmDialog, notify, PageHeader } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClinicsTab } from "@/components/admin/settings/clinics-tab"
import { ServicesTab } from "@/components/admin/settings/services-tab"
import { PlansTab } from "@/components/admin/settings/plans-tab"
import { TeamTab } from "@/components/admin/settings/team-tab"
import { NotificationsTab } from "@/components/admin/settings/notifications-tab"
import { AuditTab } from "@/components/admin/settings/audit-tab"

type TabId = (typeof settingsCopy.tabs)[number]["id"]
const tabParams = ["q", "category", "entity", "page", "size"]

export function SettingsPage() {
  const url = useUrlState()
  const [confirm, setConfirm] = React.useState(false)
  const raw = url.get("tab", "clinics")
  const tab: TabId = settingsCopy.tabs.some((t) => t.id === raw) ? (raw as TabId) : "clinics"
  const c = adminCopy.pages.settings
  const r = settingsCopy.reset

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <Button variant="outline" className="h-10 rounded-full px-4 text-caption" onClick={() => setConfirm(true)}>
            <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {r.button}
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={(v) => url.set({ ...Object.fromEntries(tabParams.map((k) => [k, null])), tab: v === "clinics" ? null : String(v) })}>
        <TabsList className="relative h-10 w-full justify-start overflow-x-auto bg-neutral-100 sm:w-fit sm:max-w-full">
          {settingsCopy.tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-full shrink-0 rounded-full px-4 text-caption">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tab === "clinics" && <ClinicsTab />}
      {tab === "services" && <ServicesTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "team" && <TeamTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "audit" && <AuditTab />}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={r.title}
        description={r.text}
        confirmLabel={r.confirm}
        destructive
        onConfirm={() => {
          resetAdminState()
          notify.success(r.done)
        }}
      />
    </div>
  )
}

import type { Metadata } from "next"

import { sectionById } from "@/lib/data/portal"
import { settingsCopy } from "@/lib/data/settings"
import { SettingsPage } from "@/components/portal/settings/settings-page"

export const metadata: Metadata = { title: settingsCopy.heading, description: sectionById("settings").description }

export default function PortalSettingsPage() {
  return <SettingsPage />
}

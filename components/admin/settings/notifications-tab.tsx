"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Notification03Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { settingsCopy } from "@/lib/data/admin-settings"
import { setReminders } from "@/lib/admin/actions"
import { useAdminState, type AdminState } from "@/lib/admin/store"
import { useMounted } from "@/hooks/use-mounted"
import { EmptyState, notify, panel, TableSkeleton } from "@/components/admin/ui"
import { inputCls, SelectInput } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

type Rule = NonNullable<AdminState["reminders"]>[number]
const t = settingsCopy.notifications
const defaults = (): Rule[] => t.defaults.map((r) => ({ ...r })).sort((a, b) => b.offsetHours - a.offsetHours)
let ruleSeq = 0
const channelOptions = t.channels.map((c) => ({ value: c.value, label: c.label }))

function validate(rules: Rule[]) {
  const errors: Record<string, { label?: string; offset?: string }> = {}
  for (const r of rules) {
    const e: { label?: string; offset?: string } = {}
    if (r.label.trim().length < 2) e.label = "Name this rule"
    if (!Number.isInteger(r.offsetHours) || r.offsetHours < 1 || r.offsetHours > 336) e.offset = "1 to 336 hours"
    else if (rules.some((o) => o.id !== r.id && o.offsetHours === r.offsetHours && o.channel === r.channel)) e.offset = "Duplicate of another rule"
    if (e.label || e.offset) errors[r.id] = e
  }
  return errors
}

function RulesForm({ initial }: { initial: Rule[] }) {
  const [rules, setRules] = React.useState(initial)
  const [submitted, setSubmitted] = React.useState(false)
  const errors = submitted ? validate(rules) : {}
  const dirty = JSON.stringify(rules) !== JSON.stringify(initial)
  const patch = (id: string, p: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)))

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (Object.keys(validate(rules)).length) return notify.error("Fix the highlighted rules")
        notify.success(setReminders(rules.map((r) => ({ ...r, label: r.label.trim() }))))
        setSubmitted(false)
      }}
    >
      {rules.length === 0 ? (
        <EmptyState icon={Notification03Icon} title={t.empty} />
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100">
          {rules.map((r) => {
            const e = errors[r.id]
            return (
              <li key={r.id} className="grid gap-3 px-4 py-4 md:px-5 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto] lg:items-start">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`rule-${r.id}-label`} className="text-neutral-500 text-micro">
                    Rule
                  </label>
                  <Input id={`rule-${r.id}-label`} value={r.label} onChange={(ev) => patch(r.id, { label: ev.target.value })} aria-invalid={!!e?.label || undefined} className={cn(inputCls, !r.enabled && "text-neutral-500")} />
                  {e?.label && <p className="text-red-700 text-micro">{e.label}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`rule-${r.id}-offset`} className="text-neutral-500 text-micro">
                    Send
                  </label>
                  <span className="relative">
                    <Input
                      id={`rule-${r.id}-offset`}
                      inputMode="numeric"
                      value={Number.isNaN(r.offsetHours) ? "" : String(r.offsetHours)}
                      onChange={(ev) => patch(r.id, { offsetHours: ev.target.value === "" ? Number.NaN : Number(ev.target.value.replace(/\D/g, "")) })}
                      aria-invalid={!!e?.offset || undefined}
                      className={cn(inputCls, "pr-24 tabular-nums")}
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 text-caption">
                      {t.before}
                    </span>
                  </span>
                  {e?.offset && <p className="text-red-700 text-micro">{e.offset}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`rule-${r.id}-channel`} className="text-neutral-500 text-micro">
                    Channel
                  </label>
                  <SelectInput id={`rule-${r.id}-channel`} value={r.channel} onChange={(v) => patch(r.id, { channel: v })} options={channelOptions} />
                </div>
                <div className="flex items-center gap-3 lg:pt-6">
                  <label className="flex w-16 items-center gap-2 text-neutral-700 text-caption">
                    <Switch checked={r.enabled} onCheckedChange={(v) => patch(r.id, { enabled: !!v })} aria-label={`${r.label || "Rule"} enabled`} />
                    {r.enabled ? "On" : "Off"}
                  </label>
                  <Button type="button" variant="ghost" size="icon" className="ml-auto size-9 rounded-full text-neutral-500 hover:text-red-700" aria-label={`Remove ${r.label || "rule"}`} onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-4 py-4 md:px-5">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full px-4 text-caption"
          onClick={() => setRules((rs) => [...rs, { id: `r-new-${++ruleSeq}`, label: "New reminder", offsetHours: 12, channel: "text", enabled: true }])}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          {t.add}
        </Button>
        <Button type="button" variant="ghost" className="h-10 rounded-full px-4 text-caption" onClick={() => setRules(defaults())}>
          {t.reset}
        </Button>
        <Button type="submit" className="ml-auto h-10 rounded-full px-5 text-caption" disabled={!dirty}>
          {t.save}
        </Button>
      </div>
    </form>
  )
}

export function NotificationsTab() {
  const mounted = useMounted()
  const stored = useAdminState((s) => s.reminders)
  return (
    <section aria-labelledby="notif-h" className={panel}>
      <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-4 py-4 md:px-5">
        <h2 id="notif-h" className="text-neutral-950 text-body">
          {t.title}
        </h2>
        <p className="text-neutral-500 text-caption">{t.subtitle}</p>
      </div>
      {mounted ? <RulesForm key={JSON.stringify(stored)} initial={stored ?? defaults()} /> : <TableSkeleton rows={4} cols={4} />}
    </section>
  )
}

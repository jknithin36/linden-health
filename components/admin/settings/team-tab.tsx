"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserAdd01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { settingsCopy } from "@/lib/data/admin-settings"
import { relative } from "@/lib/admin/format"
import { allStaff, clinics, getClinicSync } from "@/lib/admin/queries"
import { inviteStaff, setStaffRole } from "@/lib/admin/actions"
import { useAdminState } from "@/lib/admin/store"
import type { ClinicId, StaffRole, StaffUser } from "@/lib/admin/types"
import { useMounted } from "@/hooks/use-mounted"
import { Avatar, notify, panel, StatusBadge, TableSkeleton } from "@/components/admin/ui"
import { FormActions, FormDialog, FormRow, inputCls, SelectInput } from "@/components/admin/forms"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Locked, useIsAdmin } from "@/components/admin/settings/locked"

const t = settingsCopy.team
const roleOptions = t.roles.map((r) => ({ value: r.value, label: r.label }))
const roleLabel = (r: string) => roleOptions.find((o) => o.value === r)?.label ?? r

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter their full name").max(80, "Keep it under 80 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .refine((v) => v.endsWith(t.emailDomain), `Use a ${t.emailDomain} address`)
    .refine((v) => !allStaff().some((u) => u.email.toLowerCase() === v), "Someone with this email is already on the team"),
  title: z.string().trim().min(2, "Enter a job title").max(60, "Keep it under 60 characters"),
  role: z.enum(["admin", "front-desk", "nurse", "billing", "doctor"], { message: "Choose a role" }),
  clinicIds: z.array(z.enum(["cleveland", "lakewood", "beachwood"])).min(1, "Choose at least one clinic"),
})
type InviteForm = z.input<typeof inviteSchema>

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const defaults: InviteForm = { name: "", email: "", title: "", role: "front-desk", clinicIds: [] }
  const { control, register, handleSubmit, formState, reset } = useForm<InviteForm, unknown, z.output<typeof inviteSchema>>({ resolver: zodResolver(inviteSchema), defaultValues: defaults })
  React.useEffect(() => {
    if (open) reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])
  const e = formState.errors
  const submit = handleSubmit((v) => {
    notify.success(inviteStaff({ name: v.name, email: v.email, role: v.role, title: v.title, clinicIds: v.clinicIds as ClinicId[] }))
    onOpenChange(false)
  })
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t.inviteTitle} description={t.inviteText} onSubmit={submit} footer={<FormActions onCancel={() => onOpenChange(false)} submit={t.send} disabled={formState.isSubmitting} />}>
      <FormRow label="Full name" htmlFor="inv-name" error={e.name?.message}>
        <Input id="inv-name" autoComplete="off" {...register("name")} aria-invalid={!!e.name || undefined} className={inputCls} />
      </FormRow>
      <FormRow label="Work email" htmlFor="inv-email" error={e.email?.message}>
        <Input id="inv-email" type="email" autoComplete="off" spellCheck={false} placeholder={`first.last${t.emailDomain}`} {...register("email")} aria-invalid={!!e.email || undefined} className={inputCls} />
      </FormRow>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Job title" htmlFor="inv-title" error={e.title?.message}>
          <Input id="inv-title" autoComplete="off" placeholder="Front desk" {...register("title")} aria-invalid={!!e.title || undefined} className={inputCls} />
        </FormRow>
        <FormRow label="Role" htmlFor="inv-role" error={e.role?.message}>
          <Controller control={control} name="role" render={({ field, fieldState }) => <SelectInput id="inv-role" value={field.value} onChange={field.onChange} options={roleOptions} invalid={!!fieldState.error} />} />
        </FormRow>
      </div>
      <Controller
        control={control}
        name="clinicIds"
        render={({ field, fieldState }) => (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-neutral-700 text-caption">Clinics</legend>
            <div className="flex flex-wrap gap-2">
              {clinics.map((c) => {
                const on = field.value.includes(c.id)
                return (
                  <label key={c.id} className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-caption", on ? "border-neutral-950 text-neutral-950" : "border-neutral-200 text-neutral-700", fieldState.error && !on && "border-red-300")}>
                    <Checkbox checked={on} onCheckedChange={(v) => field.onChange(v ? [...field.value, c.id] : field.value.filter((x) => x !== c.id))} />
                    {c.short}
                  </label>
                )
              })}
            </div>
            {fieldState.error && <p className="text-red-700 text-micro">{fieldState.error.message}</p>}
          </fieldset>
        )}
      />
    </FormDialog>
  )
}

function RoleSelect({ u, editable }: { u: StaffUser; editable: boolean }) {
  return (
    <Locked locked={!editable} reason={settingsCopy.locks.roles} className="inline-flex w-40 cursor-not-allowed rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-neutral-950">
      <SelectInput
        label={`${u.name} role`}
        value={u.role}
        disabled={!editable}
        options={roleOptions}
        className="h-9 w-40 data-[size=default]:h-9"
        onChange={(v) => {
          if (v === u.role) return
          setStaffRole(u.id, v as StaffRole)
          notify.success(t.roleChanged(u.name, roleLabel(v)))
        }}
      />
    </Locked>
  )
}

export function TeamTab() {
  const mounted = useMounted()
  useAdminState((s) => s.version)
  const editable = useIsAdmin()
  const [inviting, setInviting] = React.useState(false)
  const rows = mounted ? allStaff() : []
  const clinicText = (u: StaffUser) => (u.clinicIds.length === 3 ? "All clinics" : u.clinicIds.map((c) => getClinicSync(c).short).join(", "))

  return (
    <section aria-labelledby="team-h" className={panel}>
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div>
          <h2 id="team-h" className="text-neutral-950 text-body">
            {t.title}
          </h2>
          <p className="text-neutral-500 tabular-nums text-caption">{mounted ? `${rows.length} people · ${rows.filter((u) => u.status === "invited").length} invited` : " "}</p>
        </div>
        <Locked locked={!editable} reason={settingsCopy.locks.invite} className="inline-flex w-fit cursor-not-allowed rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-950">
          <Button className="h-10 w-fit rounded-full px-4 text-caption" disabled={!editable} onClick={() => setInviting(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.8} data-icon="inline-start" />
            {t.invite}
          </Button>
        </Locked>
      </div>
      {!mounted ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-neutral-100 md:hidden">
            {rows.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-4 py-3.5">
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={u.name} id={u.id} />
                    <span className="min-w-0">
                      <span className="block truncate text-neutral-950 text-body">{u.name}</span>
                      <span className="block truncate text-neutral-500 text-micro">
                        {u.title} · {clinicText(u)}
                      </span>
                    </span>
                  </span>
                  <StatusBadge kind="staff" status={u.status} />
                </span>
                <RoleSelect u={u} editable={editable} />
              </li>
            ))}
          </ul>
          <div className="relative overflow-x-auto max-md:hidden">
            <table className="w-full text-caption">
              <thead className="text-neutral-500 text-micro">
                <tr className="border-b border-neutral-100">
                  <th scope="col" className="px-5 py-3 text-left font-regular">Member</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Title</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Clinics</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Role</th>
                  <th scope="col" className="px-4 py-3 text-left font-regular">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-regular">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={u.name} id={u.id} />
                        <span className="min-w-0">
                          <span className="block truncate text-neutral-950 text-body">{u.name}</span>
                          <span className="block truncate text-neutral-500 text-micro">{u.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.title}</td>
                    <td className="px-4 py-3">{clinicText(u)}</td>
                    <td className="px-4 py-2">
                      <RoleSelect u={u} editable={editable} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="staff" status={u.status} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-neutral-500">{u.status === "invited" ? "Invite sent" : relative(u.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <InviteDialog open={inviting} onOpenChange={setInviting} />
    </section>
  )
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { queueCopy } from "@/lib/data/admin-queue"
import { getPatientSync } from "@/lib/admin/queries"
import type { Appointment } from "@/lib/admin/types"
import { FormActions, FormDialog } from "@/components/admin/forms"

/** Pick a free exam room before moving a patient to "With doctor". */
export function RoomDialog({ appointment, rooms, inUse, onOpenChange, onConfirm }: { appointment: Appointment | null; rooms: number; inUse: Set<number>; onOpenChange: (o: boolean) => void; onConfirm: (room: number) => void }) {
  const firstFree = React.useMemo(() => Array.from({ length: rooms }, (_, i) => i + 1).find((r) => !inUse.has(r)) ?? null, [rooms, inUse])
  const [room, setRoom] = React.useState<number | null>(firstFree)
  const [lastFor, setLastFor] = React.useState<string | null>(null)
  // Reset the choice each time the dialog opens for a new card.
  if ((appointment?.id ?? null) !== lastFor) {
    setLastFor(appointment?.id ?? null)
    setRoom(firstFree)
  }
  const name = appointment ? (getPatientSync(appointment.patientId)?.name ?? "Patient") : ""

  return (
    <FormDialog
      open={!!appointment}
      onOpenChange={onOpenChange}
      title={queueCopy.room.title}
      description={queueCopy.room.description(name)}
      className="sm:max-w-md"
      onSubmit={(e) => {
        e.preventDefault()
        if (room) onConfirm(room)
      }}
      footer={<FormActions onCancel={() => onOpenChange(false)} submit={room ? `${queueCopy.room.confirm} ${room}` : queueCopy.room.confirm} disabled={!room} />}
    >
      {firstFree === null ? (
        <p className="rounded-xl bg-amber-50 px-3 py-3 text-amber-800 text-caption">{queueCopy.room.none}</p>
      ) : (
        <div role="radiogroup" aria-label="Exam room" className="grid grid-cols-4 gap-2">
          {Array.from({ length: rooms }, (_, i) => i + 1).map((r) => {
            const busy = inUse.has(r)
            const on = room === r
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={() => setRoom(r)}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-xl border tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1",
                  on ? "border-neutral-950 bg-neutral-950 text-white" : busy ? "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-400" : "border-neutral-200 text-neutral-900 hover:border-neutral-400"
                )}
              >
                <span className="text-caption">Room {r}</span>
                {busy && <span className="text-micro">{queueCopy.room.inUse}</span>}
              </button>
            )
          })}
        </div>
      )}
    </FormDialog>
  )
}

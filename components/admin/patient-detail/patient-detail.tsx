"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserIcon } from "@hugeicons/core-free-icons"

import { chartCopy as copy } from "@/lib/data/admin-patients"
import { doctorChartCopy } from "@/lib/data/admin-doctor-chart"
import { dayOf, TODAY } from "@/lib/admin/format"
import { getPatientDetail } from "@/lib/admin/queries"
import { allResultsFor, getNoteSync, medicationsFor, myDoctorId, noteState, signedNotesFor, startVisit } from "@/lib/admin/doctor"
import { useSession } from "@/lib/session-client"
import type { Appointment } from "@/lib/admin/types"
import { useQuery, useUrlState } from "@/components/admin/hooks"
import { AppointmentSheet } from "@/components/admin/appointment-sheet"
import { NewAppointmentDialog, RecordPaymentDialog } from "@/components/admin/forms"
import { ChartSkeleton, EmptyState, ErrorState, panel, PageSkeleton } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackLink, PatientHeader, type VisitAction } from "@/components/admin/patient-detail/header"
import { OverviewTab } from "@/components/admin/patient-detail/overview-tab"
import { VisitsTab } from "@/components/admin/patient-detail/visits-tab"
import { ResultsTab } from "@/components/admin/patient-detail/results-tab"
import { MedicationsTab } from "@/components/admin/patient-detail/medications-tab"
import { BillingTab } from "@/components/admin/patient-detail/billing-tab"
import { ActivityTab, DocumentsTab, MessagesTab } from "@/components/admin/patient-detail/records-tabs"
import { NotesTab } from "@/components/admin/patient-detail/notes-tab"

// Charts (Recharts) load only when the Vitals tab opens.
const VitalsTab = dynamic(() => import("@/components/admin/patient-detail/vitals-tab").then((m) => m.VitalsTab), {
  loading: () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  ),
})

type TabId = (typeof copy.tabs)[number]["id"] | "notes"
const v = doctorChartCopy.visit
const closed: Appointment["status"][] = ["completed", "cancelled", "late-cancel", "no-show"]

/** The chart's tabs: "Visit notes" after Visits; doctors don't get the billing tab. */
function tabsFor(isDoctor: boolean) {
  const list: { id: TabId; label: string }[] = copy.tabs.flatMap((t) => (t.id === "visits" ? [t, doctorChartCopy.tab as { id: TabId; label: string }] : [t]))
  return isDoctor ? list.filter((t) => t.id !== "billing") : list
}

/** Load the chart plus the store-aware doctor data (notes, medications, lab panels). */
async function loadChart(id: string) {
  const d = await getPatientDetail(id)
  if (!d) return null
  return { ...d, results: allResultsFor(id), meds: medicationsFor(id), notes: signedNotesFor(id) }
}

export function PatientDetailPage({ id }: { id: string }) {
  const url = useUrlState()
  const router = useRouter()
  const session = useSession()
  const isDoctor = session?.role === "doctor"
  const { data, initial, error, retry } = useQuery(() => loadChart(id), [id])
  const [open, setOpen] = React.useState<string | null>(null)
  const [dialog, setDialog] = React.useState<null | "book" | "pay">(null)

  const tabs = tabsFor(isDoctor)
  const raw = url.get("tab", "overview")
  const tab = (tabs.some((t) => t.id === raw) ? raw : "overview") as TabId

  if (initial) return <PageSkeleton cards={3} table={false} />
  if (error)
    return (
      <div className={panel}>
        <ErrorState onRetry={retry} />
      </div>
    )
  if (!data)
    return (
      <div className={panel}>
        <EmptyState
          icon={UserIcon}
          title={copy.notFound.title}
          text={copy.notFound.text}
          action={
            <Button variant="outline" size="sm" className="rounded-full px-4 text-caption" nativeButton={false} render={<Link href="/admin/patients" />}>
              {copy.notFound.action}
            </Button>
          }
        />
      </div>
    )

  const p = data.patient

  // A doctor with this patient on today's schedule can start, reopen or sign the visit.
  let visit: VisitAction | null = null
  if (isDoctor) {
    const me = myDoctorId()
    const today = data.appointments.filter((a) => a.doctorId === me && dayOf(a.start) === TODAY).sort((a, b) => (a.start < b.start ? -1 : 1))
    const active = today.find((a) => !closed.includes(a.status))
    const unsigned = today.find((a) => a.status === "completed" && noteState(a) === "unsigned")
    if (active) {
      const inProgress = active.status === "with-doctor" || getNoteSync(active.id)?.status === "in-progress"
      visit = {
        label: inProgress ? v.open : v.start,
        onClick: () => {
          if (active.status !== "with-doctor") startVisit(active.id)
          router.push(`/admin/visit/${active.id}`)
        },
      }
    } else if (unsigned) visit = { label: v.sign, onClick: () => router.push(`/admin/visit/${unsigned.id}`) }
  }

  const counts: Partial<Record<TabId, number>> = {
    notes: data.notes.length,
    visits: data.appointments.length,
    results: data.results.length,
    medications: data.refills.filter((r) => r.status === "new" || r.status === "routed").length || undefined,
    messages: data.threads.length,
    documents: data.documents.length,
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink />
      <PatientHeader patient={p} visit={visit} onBook={() => setDialog("book")} onPay={isDoctor ? undefined : () => setDialog("pay")} />

      <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === "overview" ? null : String(v) })} className="gap-5">
        <div className="relative -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList variant="line" className="h-10 w-max justify-start gap-1 border-b border-neutral-200/70 p-0 md:w-full">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="h-full flex-none rounded-none px-3 text-neutral-500 text-caption group-data-horizontal/tabs:after:-bottom-px data-active:text-neutral-950">
                {t.label}
                {counts[t.id] ? <span className="ml-1 text-neutral-400 tabular-nums text-micro">{counts[t.id]}</span> : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab detail={data} onOpen={setOpen} onBook={() => setDialog("book")} onPay={isDoctor ? undefined : () => setDialog("pay")} />
        </TabsContent>
        <TabsContent value="visits">
          <VisitsTab appointments={data.appointments} onOpen={setOpen} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab notes={data.notes} patient={p} />
        </TabsContent>
        <TabsContent value="vitals">
          <VitalsTab vitals={data.vitals} patient={p} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab results={data.results} />
        </TabsContent>
        <TabsContent value="medications">
          <MedicationsTab patient={p} meds={data.meds} refills={data.refills} />
        </TabsContent>
        {!isDoctor && (
          <TabsContent value="billing">
            <BillingTab patient={p} claims={data.claims} payments={data.payments} onPay={() => setDialog("pay")} />
          </TabsContent>
        )}
        <TabsContent value="messages">
          <MessagesTab threads={data.threads} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab documents={data.documents} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab activity={data.activity} />
        </TabsContent>
      </Tabs>

      <AppointmentSheet id={open} onOpenChange={(o) => !o && setOpen(null)} />
      <NewAppointmentDialog open={dialog === "book"} onOpenChange={(o) => !o && setDialog(null)} defaults={{ patientId: p.id, doctorId: p.primaryDoctorId }} onCreated={setOpen} />
      {!isDoctor && <RecordPaymentDialog patientId={p.id} open={dialog === "pay"} onOpenChange={(o) => !o && setDialog(null)} suggested={p.balance} />}
    </div>
  )
}

import { Suspense } from "react"
import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { bookingCopy } from "@/lib/data/booking"
import { BookingFlow, BookingFlowWithParams } from "@/components/booking/booking-flow"

export const metadata: Metadata = {
  title: `${bookingCopy.label} · ${site.name}`,
  description: bookingCopy.metaDescription,
}

/** A focused flow with its own header (no marketing navbar or footer). The fallback is the empty first step, so the page prerenders. */
export default function BookPage() {
  return (
    <Suspense fallback={<BookingFlow />}>
      <BookingFlowWithParams />
    </Suspense>
  )
}

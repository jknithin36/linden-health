// Fictional clinics. Addresses and emails are made up (".example" is a reserved domain).

import type { Location } from "@/lib/data/site"

export type Clinic = {
  location: Location
  address: string
  email: string
  /** Opening hours shown on doctor profiles. */
  hours: { days: string; time: string }[]
}

export const clinics: Record<Location, Clinic> = {
  Cleveland: {
    location: "Cleveland",
    address: "100 Linden Way, Suite 200, Cleveland, OH",
    email: "cleveland@lindenhealth.example",
    hours: [
      { days: "Mon, Tue, Thu", time: "8 AM–5 PM" },
      { days: "Wed", time: "12–8 PM" },
      { days: "Fri", time: "Video visits only" },
    ],
  },
  Lakewood: {
    location: "Lakewood",
    address: "45 Lakewood Park Drive, Lakewood, OH",
    email: "lakewood@lindenhealth.example",
    hours: [
      { days: "Mon–Thu", time: "7:30 AM–6 PM" },
      { days: "Fri", time: "8 AM–2 PM" },
      { days: "Sat", time: "Video visits only" },
    ],
  },
  Beachwood: {
    location: "Beachwood",
    address: "800 Linden Commons, Beachwood, OH",
    email: "beachwood@lindenhealth.example",
    hours: [
      { days: "Mon, Wed, Fri", time: "8 AM–5 PM" },
      { days: "Tue, Thu", time: "10 AM–7 PM" },
      { days: "Sat", time: "9 AM–1 PM" },
    ],
  },
}

export const clinicFor = (location: string) => clinics[location as Location] ?? clinics.Cleveland

export const directionsHref = (clinic: Clinic) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`

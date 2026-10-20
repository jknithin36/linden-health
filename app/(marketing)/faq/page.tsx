import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { faqCopy } from "@/lib/data/faq"
import { Faq } from "@/components/site/faq"

export const metadata: Metadata = {
  title: `${faqCopy.heading} · ${site.name}`,
  description: faqCopy.description,
}

export default function FaqPage() {
  return (
    <main className="flex flex-col gap-4 pb-4">
      <Faq level={1} />
    </main>
  )
}

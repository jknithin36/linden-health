import Link from "next/link"

import { cn } from "@/lib/utils"
import { container, focusRing, panel, sectionY } from "@/lib/styles"
import {
  allPlansLink,
  insuranceCopy,
  insuranceHeading,
  insuranceIntro,
  insuranceLabel,
} from "@/lib/data/insurance"
import { SectionHeader } from "@/components/site/section-header"
import { CoverageTool } from "@/components/insurance/coverage-tool"

/** Homepage summary: checker with live insurance card. Prices follow in <SelfPay />. */
export function Insurance() {
  return (
    <section aria-labelledby="insurance-heading" className={cn(panel, "bg-neutral-50", sectionY)}>
      <div className={container}>
        <CoverageTool
          header={
            <SectionHeader
              id="insurance-heading"
              align="start"
              label={insuranceLabel}
              heading={insuranceHeading}
              intro={insuranceIntro}
            />
          }
          footer={
            <p className="mt-6 border-t border-neutral-200 pt-6 text-neutral-500 text-caption">
              {insuranceCopy.networkLine}{" "}
              <Link
                href={allPlansLink.href}
                className={cn("rounded-sm text-neutral-950 underline underline-offset-4 hover:no-underline", focusRing.dark)}
              >
                {allPlansLink.label}
              </Link>
            </p>
          }
        />
      </div>
    </section>
  )
}

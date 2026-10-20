import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/styles"
import type { FaqItem } from "@/lib/data/faq"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type FaqAccordionProps = {
  items: FaqItem[]
  /** Prefix for item values, so several lists on one page stay distinct. */
  idPrefix: string
  /** Index of the question that starts open. */
  defaultOpen?: number
  /** "compact" has tighter rows, for the doctor profile's narrower column. */
  size?: "default" | "compact"
  className?: string
}

/** Question and answer list with hairline dividers. Shared by /faq, /insurance and doctor profiles. */
export function FaqAccordion({ items, idPrefix, defaultOpen, size = "default", className }: FaqAccordionProps) {
  const compact = size === "compact"
  return (
    <Accordion
      defaultValue={defaultOpen === undefined ? [] : [`${idPrefix}-${defaultOpen}`]}
      className={cn("rounded-none border-0 border-t border-neutral-200", className)}
    >
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          value={`${idPrefix}-${i}`}
          className="border-b border-neutral-200 not-last:border-b data-open:bg-transparent"
        >
          <AccordionTrigger
            className={cn(
              "items-center gap-6 rounded-sm px-0 text-neutral-950 hover:no-underline",
              compact ? "pt-5 pb-4" : "pt-6 pb-5",
              "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-neutral-400",
              focusRing.dark,
              "text-lead"
            )}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent
            panelClassName="px-0"
            className={cn("pr-10 text-pretty text-neutral-500 text-body", compact ? "max-w-2xl pb-5" : "max-w-3xl pb-6")}
          >
            <p>{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

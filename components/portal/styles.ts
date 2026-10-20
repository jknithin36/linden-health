/** Shared portal surfaces, so every page's panels, sheets and inputs match. */

/** Flat panel: hairline border, no shadow. */
export const panel = "rounded-2xl border border-neutral-200/70 bg-white"

/** Right-hand sheets (details, forms): full width on phones, 448px from `sm`. */
export const sheetClass = "w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-md"

/** Text inputs inside portal forms and sheets. */
export const field = "h-11 rounded-xl border-neutral-200 bg-white px-4 shadow-none focus-visible:border-neutral-950 focus-visible:ring-0 text-body md:text-body"

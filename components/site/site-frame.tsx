import { Navbar } from "@/components/site/navbar"
import { CtaFooter } from "@/components/site/cta-footer"

/** Marketing chrome: fixed navbar, spacer, page, CTA footer. Used by the marketing layout and the 404. */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {/* Spacer matching the 88px bar so content doesn't sit under it. Also the root skip link's #main target. */}
      <div id="main" tabIndex={-1} className="h-[88px] shrink-0 outline-none" />
      {children}
      <CtaFooter />
    </>
  )
}

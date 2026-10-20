import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { site } from "@/lib/data/site";
import { Toaster } from "@/components/ui/toast";
import { PreviewLinks } from "@/components/site/preview-links";

/** The one UI typeface for the whole site (`font-sans`). */
const dmSans = DM_Sans({ subsets: ["latin"], axes: ["opsz"], variable: "--font-sans" });

/** Monospace, only for code (`font-mono`). */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

/** Light-only site: native controls and scrollbars stay light, and the browser chrome matches the white pages. */
export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", dmSans.variable, geistMono.variable)}>
      <body className="min-h-full flex flex-col font-regular">
        {/* Skip link: every shell (marketing, portal, booking, auth, admin) puts id="main" on its page content. */}
        <a
          href="#main"
          className="sr-only rounded-full bg-neutral-950 px-4 py-2 text-white text-caption focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Skip to content
        </a>
        {/* One toast region for the whole site (admin, portal, booking and marketing pages). */}
        <Toaster>
          {children}
          <PreviewLinks />
        </Toaster>
      </body>
    </html>
  );
}

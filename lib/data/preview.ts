// Pages this template links to but doesn't include yet (company, legal, blog) and placeholder links
// (social, app stores). Clicking one shows a short toast instead of a 404.

/** Paths without a page in the template. A path matches itself and anything under it. */
const previewRoutes = ["/about", "/careers", "/blog", "/contact", "/terms", "/privacy", "/patient-rights", "/accessibility"]

export const previewCopy = {
  page: {
    title: (label: string) => (label ? `${label} is coming soon` : "This page is coming soon"),
    description: "It’s not part of this preview yet. Add it to fit your clinic’s needs.",
  },
  placeholder: {
    title: (label: string) => (label ? `${label} isn’t connected yet` : "This link isn’t connected yet"),
    description: "It’s a placeholder in this preview. Point it to your own account or page.",
  },
}

/** "page" for an unbuilt route, "placeholder" for a "#" link, or null for a real link. */
export function previewKind(href: string | null): "page" | "placeholder" | null {
  if (!href) return null
  if (href === "#") return "placeholder"
  if (!href.startsWith("/")) return null
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/"
  return previewRoutes.some((r) => path === r || path.startsWith(`${r}/`)) ? "page" : null
}

/** `prefetch` value for a <Link>: never prefetch routes that don't exist in the template. */
export const prefetchFor = (href: string) => (previewKind(href) ? false : undefined)

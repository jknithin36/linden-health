import { createCn } from "cn/config"

/**
 * Class merging that knows the site type scale in app/typography.css, so a later
 * `text-caption` replaces an earlier `text-body` (and shadcn defaults) instead of both applying.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "heading", "page", "title", "lead", "body", "caption", "micro"] }],
      "font-weight": [{ font: ["regular", "emphasis"] }],
    },
  },
})

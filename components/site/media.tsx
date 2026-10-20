import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

type MediaProps = {
  /** Photo path. When missing, the gradient placeholder is shown. */
  image?: string
  alt: string
  /** CSS background used until a photo exists. */
  placeholder: string
  sizes: string
  /** The page's main image (LCP): preloaded and fetched first. */
  preload?: boolean
  /** "eager" for images above the fold that aren't the main one. */
  loading?: "eager" | "lazy"
  /** Sizing / rounding for the frame, e.g. "aspect-square rounded-[20px]". */
  className?: string
  imageClassName?: string
  children?: React.ReactNode
}

/** Photo frame with a consistent gradient placeholder. Overlays go in `children`. */
export function Media({ image, alt, placeholder, sizes, preload, loading, className, imageClassName, children }: MediaProps) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={image ? undefined : { backgroundImage: placeholder }}
    >
      {image ? (
        <Image src={image} alt={alt} fill sizes={sizes} preload={preload} loading={loading} draggable={false} className={cn("object-cover select-none", imageClassName)} />
      ) : (
        <span role="img" aria-label={alt} className="absolute inset-0 grid place-items-center">
          <HugeiconsIcon aria-hidden="true" icon={Image01Icon} strokeWidth={1.4} className="size-10 text-white/30" />
        </span>
      )}
      {children}
    </div>
  )
}

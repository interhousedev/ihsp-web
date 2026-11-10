"use client"

import type { Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconPhoto } from "@ihsp/ui"

/** Only web addresses become links; anything else in `source_url` is shown as plain text. */
function safeHref(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}

type SlideImageProps = {
  image: Slide["image"]
  /** Draw the credit over the picture (full-bleed layout) instead of under it. */
  overlay?: boolean
}

/** The picture of a slide with its credit: the author or site (a link to the source when there is one) and the license. */
export function SlidePicture({ image, overlay = false }: SlideImageProps) {
  const t = useT("notebooks.slides")
  const href = safeHref(image?.source_url)
  const credit = image?.attribution ? t("imageBy", { attribution: image.attribution }) : null
  const label = [credit, image?.license].filter(Boolean).join(" · ")
  return (
    <figure
      data-testid="slide-image"
      className={
        overlay
          ? "absolute inset-0 m-0"
          : "relative m-0 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.4cqw] border"
      }
    >
      {image?.url ? (
        <img src={image.url} alt={image.alt ?? ""} className="min-h-0 w-full flex-1 object-cover" />
      ) : (
        <div className="bg-muted text-muted-foreground flex flex-1 items-center justify-center">
          <IconPhoto className="size-[8cqw]" aria-hidden />
        </div>
      )}
      {label ? (
        <figcaption className="bg-background/80 text-muted-foreground absolute inset-x-0 bottom-0 px-[1.6cqw] py-[0.6cqw] text-[length:1.7cqw]">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
              {label}
            </a>
          ) : (
            label
          )}
        </figcaption>
      ) : null}
    </figure>
  )
}

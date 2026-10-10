"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconBook2 } from "@ihsp/ui"
import { useState } from "react"
import { GeneratedCover } from "./generated-cover"

/**
 * A cover thumbnail. The title next to it carries the meaning, so the image is decorative (`alt=""`). When there is no
 * cover, or it fails to load (a hot-linked UniLibrary cover can), a book with a `title` gets a generated cover; without
 * one, a labelled placeholder takes its place.
 */
export function CoverImage({
  src,
  className,
  title,
  author,
}: {
  src: string | null | undefined
  className?: string
  /** A book's title: a generated cover is drawn from it when there is no image. */
  title?: string
  author?: string | null
}) {
  const t = useT("library.item")
  const [failed, setFailed] = useState<string | null>(null)
  if (!src || failed === src) {
    if (title) return <GeneratedCover title={title} author={author} className={className} />
    return (
      <div
        role="img"
        aria-label={t("noCover")}
        className={cn("bg-muted text-muted-foreground flex items-center justify-center", className)}
      >
        <IconBook2 className="size-1/3" aria-hidden />
      </div>
    )
  }
  return (
    // oxlint-disable-next-line next/no-img-element -- static export with unoptimised images; covers are signed or hot-linked URLs
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
      className={cn("bg-muted object-cover", className)}
    />
  )
}

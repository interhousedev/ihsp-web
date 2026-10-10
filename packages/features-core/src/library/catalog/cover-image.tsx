"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconBook2 } from "@ihsp/ui"
import { useState } from "react"

/**
 * A cover thumbnail. The title next to it carries the meaning, so the image is decorative (`alt=""`); when there is no
 * cover, or it fails to load (a hot-linked UniLibrary cover can), a labelled placeholder takes its place.
 */
export function CoverImage({ src, className }: { src: string | null | undefined; className?: string }) {
  const t = useT("library.item")
  const [failed, setFailed] = useState<string | null>(null)
  if (!src || failed === src) {
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

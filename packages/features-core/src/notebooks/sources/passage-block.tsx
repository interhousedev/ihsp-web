"use client"

import type { PassageItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"

type PassageBlockProps = {
  passage: PassageItem
  previous: PassageItem | null
  highlighted?: boolean
  /** The 2 s pulse right after the viewer scrolled to a cited passage. */
  pulsing?: boolean
}

/** One passage as a paragraph with a faint separator; a page marker and a bold heading appear where they change. */
export function PassageBlock({ passage, previous, highlighted = false, pulsing = false }: PassageBlockProps) {
  const t = useT("notebooks")
  const newPage = passage.page !== null && passage.page !== (previous?.page ?? null)
  const newHeading = passage.heading !== null && passage.heading !== (previous?.heading ?? null)
  return (
    <>
      {newPage ? (
        <p className="text-muted-foreground mt-3 text-xs font-medium tracking-wide uppercase">
          {t("viewer.page", { page: passage.page ?? 0 })}
        </p>
      ) : null}
      <div
        data-passage-id={passage.id}
        data-highlighted={highlighted ? "true" : undefined}
        className={cn(
          "border-border/50 scroll-mt-20 rounded-md border-t px-2 py-3 first:border-t-0",
          highlighted && "bg-primary/15 ring-primary/50 ring-2",
          highlighted && pulsing && "animate-pulse motion-reduce:animate-none",
        )}
      >
        {newHeading ? <h3 className="mb-1 text-base font-bold">{passage.heading}</h3> : null}
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{passage.text}</p>
      </div>
    </>
  )
}

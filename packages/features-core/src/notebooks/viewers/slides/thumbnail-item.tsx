"use client"

import type { Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconPencil } from "@ihsp/ui"
import type { CSSProperties, ReactNode, Ref } from "react"
import { SlideView } from "./slide-view"
import { slideName } from "./slide-deck-state"

export type ThumbnailItemProps = {
  slide: Slide
  /** 1-based position. */
  number: number
  current: boolean
  /** The slide has an instruction waiting in revise mode. */
  marked: boolean
  deckSubtitle?: string | null
  onSelect: (slide: Slide) => void
  /** The drag handle (edit mode). */
  handle?: ReactNode
  dragging?: boolean
  ref?: Ref<HTMLLIElement>
  style?: CSSProperties
}

/** One thumbnail: a button named after the slide, with its number, and an optional drag handle. */
export function ThumbnailItem({
  slide,
  number,
  current,
  marked,
  deckSubtitle,
  onSelect,
  handle,
  dragging = false,
  ref,
  style,
}: ThumbnailItemProps) {
  const t = useT("notebooks.slides")
  const name = slideName(slide)
  const label = name ? `${t("slideN", { n: number })}: ${name}` : t("slideN", { n: number })
  return (
    <li ref={ref} style={style} className={cn("flex items-start gap-1", dragging && "relative z-10 opacity-80")}>
      <button
        type="button"
        aria-label={label}
        aria-current={current ? "true" : undefined}
        data-current={current ? "true" : "false"}
        onClick={() => onSelect(slide)}
        className={cn(
          "focus-visible:ring-ring flex min-w-0 flex-1 items-start gap-1.5 rounded-lg p-1 text-start outline-hidden focus-visible:ring-2",
          current ? "bg-primary/10 ring-primary ring-2" : "hover:bg-muted",
        )}
      >
        <span aria-hidden className="text-muted-foreground w-5 shrink-0 pt-0.5 text-end text-xs tabular-nums">
          {number}
        </span>
        <span aria-hidden className="pointer-events-none block min-w-0 flex-1">
          <SlideView slide={slide} deckSubtitle={deckSubtitle} />
        </span>
        {marked ? (
          <>
            <IconPencil className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="sr-only">{t("hasChange")}</span>
          </>
        ) : null}
      </button>
      {handle}
    </li>
  )
}

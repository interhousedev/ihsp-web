"use client"

import type { ReviewRating } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { useId } from "react"
import { intervalLabel } from "../utils/interval-label"
import { RATINGS } from "../utils/study-keys"

export type RatingButtonsProps = {
  intervals: Record<ReviewRating, string> | null | undefined
  disabled?: boolean
  onRate: (rating: ReviewRating) => void
}

/** Again, Hard, Good and Easy with the time until the card comes back above each (Anki). */
export function RatingButtons({ intervals, disabled, onRate }: RatingButtonsProps) {
  const t = useT("flashcards.study")
  const id = useId()
  return (
    <div className="grid w-full max-w-xl grid-cols-4 gap-2 sm:gap-3" role="group" aria-label={t("rate")}>
      {RATINGS.map((rating, index) => (
        <div key={rating} className="flex flex-col items-center gap-1">
          <span id={`${id}-${rating}`} className="text-muted-foreground text-xs tabular-nums">
            {intervals ? intervalLabel(intervals[rating]) : " "}
          </span>
          <Button
            type="button"
            className={cn(
              "h-12 w-full rounded-lg px-1 text-sm font-semibold sm:text-base",
              rating === "medium" && "ring-primary/40 ring-offset-background ring-2 ring-offset-2",
            )}
            disabled={disabled}
            aria-describedby={`${id}-${rating}`}
            aria-keyshortcuts={String(index + 1)}
            onClick={() => onRate(rating)}
          >
            {t(`rating.${rating}`)}
          </Button>
        </div>
      ))}
    </div>
  )
}

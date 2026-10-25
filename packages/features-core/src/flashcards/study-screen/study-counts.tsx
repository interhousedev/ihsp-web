"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { COUNT_COLORS, type CountQueue } from "../utils/count-colors"

export type StudyCountsProps = {
  counts: { new: number; learning: number; review: number }
  /** The queue the current card comes from; its count is underlined. */
  queue?: CountQueue | undefined
  className?: string
}

const ORDER: readonly CountQueue[] = ["new", "learning", "review"]

/** "49 + 7 + 104" at the top right of Anki's study screen: new, learning and to review, the current one underlined. */
export function StudyCounts({ counts, queue, className }: StudyCountsProps) {
  const t = useT("flashcards.study")
  return (
    <p className={cn("text-lg font-medium tabular-nums", className)} data-testid="study-counts">
      <span className="sr-only">
        {t("counts", { new: counts.new, learning: counts.learning, review: counts.review })}
      </span>
      {ORDER.map((name, index) => (
        <span key={name}>
          {index > 0 ? <span className="text-muted-foreground px-1">+</span> : null}
          <span
            className={cn(COUNT_COLORS[name], queue === name && "underline underline-offset-4")}
            data-queue={name}
            data-current={queue === name ? "true" : undefined}
            aria-hidden
          >
            {counts[name]}
          </span>
        </span>
      ))}
    </p>
  )
}

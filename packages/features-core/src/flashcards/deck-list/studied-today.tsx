"use client"

import type { FlashcardStats } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { secondsPerCard } from "../utils/format-study-time"

/** "Studied 5 cards in 12.8 seconds today (2.56s/card)" under Anki's deck list. */
export function StudiedToday({ stats }: { stats: Pick<FlashcardStats, "today_count" | "today_seconds"> }) {
  const t = useT("flashcards.deckList")
  if (stats.today_count <= 0) return <p className="text-muted-foreground text-center text-sm">{t("studiedNothing")}</p>
  return (
    <p className="text-muted-foreground text-center text-sm">
      {t("studiedToday", {
        count: stats.today_count,
        seconds: stats.today_seconds,
        perCard: secondsPerCard(stats.today_count, stats.today_seconds),
      })}
    </p>
  )
}

"use client"

import type { FlashcardStats } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

/** The line under Anki's heatmap: daily average, days learned, longest streak and current streak. */
export function ReviewStatsSummary({ stats }: { stats: FlashcardStats }) {
  const t = useT("flashcards.heatmap")
  const items = [
    { key: "dailyAverage", value: t("cards", { count: stats.daily_average }) },
    { key: "daysLearned", value: `${Math.round(stats.days_learned_percent)}%` },
    { key: "longestStreak", value: t("days", { count: stats.longest_streak }) },
    { key: "currentStreak", value: t("days", { count: stats.current_streak }) },
  ] as const
  return (
    <dl className="text-muted-foreground flex w-full flex-wrap justify-center gap-x-4 gap-y-1 text-center text-xs">
      {items.map((item) => (
        <div key={item.key} className="flex gap-1">
          <dt>{t(item.key)}:</dt>
          <dd className="text-primary font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

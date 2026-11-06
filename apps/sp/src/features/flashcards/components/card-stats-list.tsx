"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useFlashcardCardStats } from "../hooks/use-flashcards"

/** Statistics per question: attempts, correct and incorrect answers and when the card was last studied. */
export function CardStatsList({ setId }: { setId: string }) {
  const t = useT("flashcards.page")
  const format = useFormatters()
  const stats = useFlashcardCardStats(setId)

  return (
    <section aria-labelledby="card-stats-title" className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      <h2 id="card-stats-title" className="text-lg font-semibold">
        {t("statsTitle")}
      </h2>
      {stats.isPending ? <StateView state="loading" rows={2} /> : null}
      {stats.isError ? <StateView state="error" error={stats.error} onRetry={() => void stats.refetch()} /> : null}
      {stats.isSuccess ? (
        <ul className="flex flex-col gap-2">
          {stats.data.map((row) => (
            <li key={row.card_id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
              <span className="break-words">{row.front}</span>
              <span className="text-muted-foreground text-xs">
                {t("statsRow", { attempts: row.attempts, correct: row.correct, incorrect: row.incorrect })}
                {" · "}
                {row.last_studied_at ? t("statsLast", { date: format.dateTime(row.last_studied_at) }) : t("statsNever")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

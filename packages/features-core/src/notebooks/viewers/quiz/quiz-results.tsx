"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconCircleCheck, IconCircleX, IconPlayerSkipForward } from "@ihsp/ui"
import type { ReactNode } from "react"
import type { QuizSummary } from "./quiz-state"

type QuizResultsProps = {
  summary: QuizSummary
  onReview: () => void
  onRetryAll: () => void
  onRetryWrong: () => void
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: ReactNode }) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-4">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/** The score, the accuracy and the counts, with Review answers, Try again and Retry wrong answers. */
export function QuizResults({ summary, onReview, onRetryAll, onRetryWrong }: QuizResultsProps) {
  const t = useT("notebooks")
  return (
    <section className="flex flex-col gap-4">
      <div role="status" className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">{t("viewers.quiz.results")}</h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label={t("quiz.score")} value={`${summary.score}%`} />
          <Stat label={t("quiz.accuracy")} value={`${summary.accuracy}%`} />
          <Stat
            label={t("quiz.correct")}
            value={summary.correct}
            icon={<IconCircleCheck aria-hidden className="size-4 text-green-600 dark:text-green-500" />}
          />
          <Stat
            label={t("quiz.wrong")}
            value={summary.wrong}
            icon={<IconCircleX aria-hidden className="text-destructive size-4" />}
          />
          <Stat
            label={t("quiz.skipped")}
            value={summary.skipped}
            icon={<IconPlayerSkipForward aria-hidden className="size-4" />}
          />
        </dl>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={onReview}>
          {t("quiz.review")}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onRetryAll}>
          {t("quiz.retry")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={summary.wrong === 0}
          onClick={onRetryWrong}
        >
          {t("quiz.retryWrong")}
        </Button>
      </div>
    </section>
  )
}

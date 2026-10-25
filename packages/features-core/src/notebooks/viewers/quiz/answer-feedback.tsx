"use client"

import type { QuizQuestion, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconCircleCheck, IconCircleX, IconMessageQuestion } from "@ihsp/ui"
import { RefChips } from "../../chat/ref-chips"

type AnswerFeedbackProps = {
  question: QuizQuestion
  correct: boolean
  refsIndex: RefsIndex
  /** Without it (the review list) there is no Explain button. */
  onExplain?: () => void
}

/** After a checked answer: right or wrong (icon and word), the explanation, the sources and "Explain". */
export function AnswerFeedback({ question, correct, refsIndex, onExplain }: AnswerFeedbackProps) {
  const t = useT("notebooks")
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4 text-sm",
        correct
          ? "border-green-600/50 bg-green-600/5 dark:border-green-500/50"
          : "border-destructive/50 bg-destructive/5",
      )}
    >
      <p className="flex items-center gap-2 text-base font-semibold">
        {correct ? (
          <IconCircleCheck aria-hidden className="size-5 text-green-600 dark:text-green-500" />
        ) : (
          <IconCircleX aria-hidden className="text-destructive size-5" />
        )}
        {correct ? t("quiz.correct") : t("quiz.wrong")}
      </p>
      <p>
        <span className="font-medium">{t("viewers.quiz.explanation")}: </span>
        {question.explanation}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <RefChips refs={question.refs} refsIndex={refsIndex} />
        {onExplain ? (
          <Button type="button" variant="outline" className="min-h-11 gap-1.5 md:min-h-9" onClick={onExplain}>
            <IconMessageQuestion aria-hidden className="size-4" />
            {t("viewers.quiz.explain")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

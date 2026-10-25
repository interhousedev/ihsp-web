"use client"

import type { QuizQuestion, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconChevronLeft, IconCircleCheck, IconCircleX, IconPlayerSkipForward } from "@ihsp/ui"
import { useId } from "react"
import { RefChips } from "../../chat/ref-chips"
import { PASSAGE_STYLE } from "../passage-style"
import { OptionList } from "./option-list"
import { verdictOf, type QuestionVerdict, type QuizState } from "./quiz-state"
import { StudioMarkdown } from "../../../openui/studio-markdown"

type QuizReviewProps = {
  questions: readonly QuizQuestion[]
  answers: QuizState["answers"]
  refsIndex: RefsIndex
  onBack: () => void
}

function VerdictTag({ verdict }: { verdict: QuestionVerdict }) {
  const t = useT("notebooks")
  if (verdict === "correct") {
    return (
      <span className="flex items-center gap-1 text-sm font-medium">
        <IconCircleCheck aria-hidden className="size-4 text-green-600 dark:text-green-500" />
        {t("quiz.correct")}
      </span>
    )
  }
  if (verdict === "wrong") {
    return (
      <span className="flex items-center gap-1 text-sm font-medium">
        <IconCircleX aria-hidden className="text-destructive size-4" />
        {t("quiz.wrong")}
      </span>
    )
  }
  return (
    <span className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
      <IconPlayerSkipForward aria-hidden className="size-4" />
      {t("quiz.skipped")}
    </span>
  )
}

function ReviewItem({
  question,
  number,
  answers,
  refsIndex,
}: {
  question: QuizQuestion
  number: number
  answers: QuizState["answers"]
  refsIndex: RefsIndex
}) {
  const t = useT("notebooks")
  const promptId = useId()
  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <VerdictTag verdict={verdictOf(question, answers)} />
      <div id={promptId} role="heading" aria-level={4} className="flex gap-1.5">
        <span aria-hidden className="text-muted-foreground font-semibold tabular-nums">
          {number}.
        </span>
        <StudioMarkdown className={`min-w-0 flex-1 text-base font-semibold ${PASSAGE_STYLE}`}>
          {question.prompt}
        </StudioMarkdown>
      </div>
      <OptionList question={question} chosen={answers[question.id] ?? []} revealed labelledBy={promptId} />
      <p className="text-sm">
        <span className="font-medium">{t("viewers.quiz.explanation")}: </span>
        {question.explanation}
      </p>
      <RefChips refs={question.refs} refsIndex={refsIndex} />
    </li>
  )
}

/** Read-only list of all questions of the round with the right answers, the student's choices and the explanations. */
export function QuizReview({ questions, answers, refsIndex, onBack }: QuizReviewProps) {
  const t = useT("notebooks")
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold">{t("viewers.quiz.reviewTitle")}</h3>
        <Button type="button" variant="outline" className="min-h-11 gap-1" onClick={onBack}>
          <IconChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t("viewers.quiz.backToResults")}
        </Button>
      </div>
      <ol className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <ReviewItem
            key={question.id}
            question={question}
            number={index + 1}
            answers={answers}
            refsIndex={refsIndex}
          />
        ))}
      </ol>
    </section>
  )
}

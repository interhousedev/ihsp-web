"use client"

import type { QuizQuestion, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconBulb, IconCheck } from "@ihsp/ui"
import { useId } from "react"
import { AnswerFeedback } from "./answer-feedback"
import { OptionList } from "./option-list"
import { isCorrect } from "./quiz-state"

type QuestionViewProps = {
  question: QuizQuestion
  refsIndex: RefsIndex
  /** The checked answer, if the question was answered. */
  committed: readonly string[] | undefined
  /** The unchecked choice of a multiple-choice question. */
  draft: readonly string[]
  hintShown: boolean
  onChoose: (optionId: string) => void
  onCheck: () => void
  onHint: () => void
  onExplain: () => void
}

/** One question: the text, a hint, the options, Check (multiple choice) and, once answered, the feedback. */
export function QuestionView({
  question,
  refsIndex,
  committed,
  draft,
  hintShown,
  onChoose,
  onCheck,
  onHint,
  onExplain,
}: QuestionViewProps) {
  const t = useT("notebooks")
  const promptId = useId()
  const multiId = useId()
  const answered = committed !== undefined
  const multiple = question.type === "multiple"

  return (
    <section aria-labelledby={promptId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {question.topic ? <p className="text-muted-foreground text-xs">{question.topic}</p> : null}
        <h3 id={promptId} className="text-lg leading-snug font-semibold">
          {question.prompt}
        </h3>
        {multiple ? (
          <p id={multiId} className="text-muted-foreground text-sm">
            {t("quiz.multi")}
          </p>
        ) : null}
      </div>

      {question.hint ? (
        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-1.5 md:min-h-9"
            disabled={hintShown || answered}
            onClick={onHint}
          >
            <IconBulb aria-hidden className="size-4" />
            {t("viewers.quiz.hint")}
          </Button>
          {hintShown ? (
            <p className="text-sm">
              <span className="font-medium">{t("viewers.quiz.hint")}: </span>
              {question.hint}
            </p>
          ) : null}
        </div>
      ) : null}

      <OptionList
        question={question}
        chosen={committed ?? draft}
        revealed={answered}
        labelledBy={promptId}
        {...(multiple ? { describedBy: multiId } : {})}
        onChoose={onChoose}
      />

      {multiple && !answered ? (
        <Button type="button" className="min-h-11 gap-1.5 self-start" disabled={draft.length === 0} onClick={onCheck}>
          <IconCheck aria-hidden className="size-4" />
          {t("quiz.check")}
        </Button>
      ) : null}

      <div role="status" aria-live="polite">
        {answered ? (
          <AnswerFeedback
            question={question}
            correct={isCorrect(question, committed)}
            refsIndex={refsIndex}
            onExplain={onExplain}
          />
        ) : null}
      </div>
    </section>
  )
}

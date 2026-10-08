"use client"

import type { Answer, AttemptResult, AttemptView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Icons, cn } from "@ihsp/ui"
import { describeAnswer, describeValue } from "../utils/answers"

/**
 * The result of a submitted attempt: score, passed or not and, when the test's "show answers" setting allows it
 * (`review` is not null), each question with the correct answer and the explanation.
 */
export function AttemptResultView({
  attempt,
  result,
  answers,
}: {
  attempt: AttemptView
  result: AttemptResult
  answers: Record<string, Answer>
}) {
  const t = useT("test")
  const percent = result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0
  return (
    <section aria-label={t("resultLabel")} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-2xl font-bold tabular-nums">
          {result.score}/{result.max_score}
        </p>
        <span className="text-muted-foreground text-sm tabular-nums">{percent}%</span>
        <Badge variant={result.passed ? "default" : "destructive"}>{result.passed ? t("passed") : t("failed")}</Badge>
      </div>

      {result.review === null ? (
        <p className="text-muted-foreground text-sm">{t("answersHidden")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {result.review.map((item, index) => {
            const question = attempt.questions.find((candidate) => candidate.id === item.question_id)
            const given = describeAnswer(question, answers[item.question_id])
            const correctText = item.correct_answer === undefined ? "" : describeValue(question, item.correct_answer)
            return (
              <li
                key={item.question_id}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border-s-4 border p-3 text-sm",
                  item.correct ? "border-s-emerald-500" : "border-s-red-500",
                )}
              >
                <div className="flex items-center gap-2">
                  {item.correct ? (
                    <Icons.circleCheck className="size-4 text-emerald-600" aria-hidden />
                  ) : (
                    <Icons.circleX className="size-4 text-red-600" aria-hidden />
                  )}
                  <span className="font-medium">
                    {t("questionNumber", { number: index + 1 })} · {item.correct ? t("correct") : t("incorrect")}
                  </span>
                </div>
                {question ? <p className="break-words">{question.prompt}</p> : null}
                <p className="text-muted-foreground">
                  {t("yourAnswer")}: {given || t("noAnswer")}
                </p>
                {!item.correct && correctText ? (
                  <p>
                    {t("correctAnswer")}: {correctText}
                  </p>
                ) : null}
                {item.explanation ? <p className="text-muted-foreground">{item.explanation}</p> : null}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

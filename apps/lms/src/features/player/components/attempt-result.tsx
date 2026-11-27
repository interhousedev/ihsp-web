"use client"

import { getLmsAttemptQuery, type Answer, type AttemptResult } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Icons, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { describeAnswer, describeValue } from "../utils/answers"
import { ExplainMistake } from "./explain-mistake"

/**
 * The result of a submitted attempt: the score in per cent and a pass badge, always. The questions the student missed
 * are listed with their own answer; the correct answer, the explanation and "Explain my mistake" appear only when the
 * test's "show correct answers" setting allows it (the server then sends `correct_answer`).
 */
export function AttemptResultView({
  attemptId,
  stepId,
  blockId,
  result,
}: {
  attemptId: string
  stepId: string
  blockId: string
  result: Pick<AttemptResult, "score" | "max_score" | "passed">
}) {
  const t = useT("test")
  const { data: attempt } = useQuery(getLmsAttemptQuery(attemptId))
  const shown = attempt ?? result
  const percent = shown.max_score > 0 ? Math.round((shown.score / shown.max_score) * 100) : 0
  const missed = (attempt?.review ?? []).filter((item) => !item.correct)
  const allowed = attempt?.review?.some((item) => item.correct_answer != null || item.explanation != null) ?? false
  return (
    <section aria-label={t("resultLabel")} className="flex flex-col gap-4" data-testid="attempt-result">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-2xl font-bold tabular-nums" data-testid="attempt-percent">
          {percent}%
        </p>
        <span className="text-muted-foreground text-sm tabular-nums">
          {shown.score}/{shown.max_score}
        </span>
        <Badge variant={shown.passed ? "default" : "destructive"}>{shown.passed ? t("passed") : t("failed")}</Badge>
      </div>

      {attempt && missed.length > 0 ? (
        <>
          <h4 className="text-sm font-semibold">{t("mistakes")}</h4>
          <ol className="flex flex-col gap-3">
            {missed.map((item) => {
              const question = attempt.questions.find((candidate) => candidate.id === item.question_id)
              const answer: Answer | undefined = attempt.answers[item.question_id]
              const given = describeAnswer(question, answer)
              const correctText = item.correct_answer == null ? "" : describeValue(question, item.correct_answer)
              return (
                <li
                  key={item.question_id}
                  className={cn("flex flex-col gap-1 rounded-lg border border-s-4 border-s-destructive p-3 text-sm")}
                >
                  <div className="flex items-center gap-2">
                    <Icons.circleX className="size-4 text-destructive" aria-hidden />
                    <span className="font-medium">{t("incorrect")}</span>
                  </div>
                  {question ? <p className="break-words">{question.prompt}</p> : null}
                  <p className="text-muted-foreground">
                    {t("yourAnswer")}: {given || t("noAnswer")}
                  </p>
                  {allowed && correctText ? (
                    <p>
                      {t("correctAnswer")}: {correctText}
                    </p>
                  ) : null}
                  {allowed && item.explanation ? <p className="text-muted-foreground">{item.explanation}</p> : null}
                  {allowed && question ? (
                    <ExplainMistake stepId={stepId} blockId={blockId} answer={given || t("noAnswer")} />
                  ) : null}
                </li>
              )
            })}
          </ol>
          {allowed ? null : <p className="text-muted-foreground text-sm">{t("answersHidden")}</p>}
        </>
      ) : null}
    </section>
  )
}

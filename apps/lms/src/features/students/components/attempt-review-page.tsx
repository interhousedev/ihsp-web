"use client"

import { getLmsAttemptQuery, type AttemptReview } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, Icons, PageContainer, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { personName } from "../../shared/utils/people"
import { describeAnswer, describeValue } from "../../player/utils/answers"
import { OverrideForm } from "./override-form"
import { LinkButton } from "../../shared/components/link-button"

function AttemptBody({ attempt, courseId }: { attempt: AttemptReview; courseId: string | null }) {
  const t = useT("attempt")
  const format = useFormatters()
  const shownScore = attempt.override_score ?? attempt.score
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold">{personName(attempt.user)}</span>
            <span className="text-2xl font-bold tabular-nums">
              {shownScore}/{attempt.max_score}
            </span>
            <Badge variant={attempt.passed ? "default" : "destructive"}>
              {attempt.passed ? t("passed") : t("failed")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {t("submittedAt", { time: format.dateTime(attempt.submitted_at) })} ·{" "}
            {t("revision", { id: attempt.revision_id.slice(0, 8) })}
          </p>
          {attempt.override_score !== null ? (
            <p className="text-sm" data-testid="override-note">
              {t("overridden", { original: attempt.score, comment: attempt.override_comment ?? "" })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section aria-labelledby="attempt-answers" className="flex flex-col gap-2">
        <h2 id="attempt-answers" className="text-base font-semibold">
          {t("answers")}
        </h2>
        {attempt.review === null ? (
          <ul className="flex flex-col gap-2">
            {Object.entries(attempt.answers).map(([questionId, answer], index) => (
              <li key={questionId} className="rounded-lg border p-3 text-sm">
                <span className="font-medium">{t("question", { number: index + 1 })}</span>:{" "}
                {describeAnswer(undefined, answer)}
              </li>
            ))}
          </ul>
        ) : (
          <ol className="flex flex-col gap-2">
            {attempt.review.map((item, index) => (
              <li
                key={item.question_id}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border border-s-4 p-3 text-sm",
                  item.correct ? "border-s-emerald-500" : "border-s-red-500",
                )}
              >
                <span className="font-medium">
                  {t("question", { number: index + 1 })} · {item.correct ? t("correct") : t("incorrect")}
                </span>
                <span>
                  {t("given")}: {describeAnswer(undefined, attempt.answers[item.question_id]) || t("noAnswer")}
                </span>
                {item.correct_answer !== undefined ? (
                  <span>
                    {t("expected")}: {describeValue(undefined, item.correct_answer)}
                  </span>
                ) : null}
                {item.explanation ? <span className="text-muted-foreground">{item.explanation}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium">{t("variant")}</summary>
        <pre className="bg-muted mt-2 overflow-x-auto rounded p-2 text-xs">
          {JSON.stringify(attempt.variant, null, 2)}
        </pre>
      </details>

      <Card>
        <CardContent>
          <OverrideForm key={attempt.override_score ?? "none"} attempt={attempt} courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  )
}

/** `/edit/attempt/?id=&course=`: one attempt with its variant and answers, and the score override. */
export function AttemptReviewPage({ attemptId, courseId }: { attemptId: string; courseId: string | null }) {
  const t = useT("attempt")
  const attempt = useQuery(getLmsAttemptQuery(attemptId))
  return (
    <PageContainer
      title={t("title")}
      actions={
        courseId ? (
          <LinkButton href={hrefs.students(courseId)} variant="outline" className="min-h-11 md:min-h-8">
            <Icons.chevronLeft aria-hidden />
            {t("backToStudents")}
          </LinkButton>
        ) : undefined
      }
    >
      <QueryState query={attempt} rows={3}>
        {(data) => <AttemptBody attempt={data} courseId={courseId} />}
      </QueryState>
    </PageContainer>
  )
}

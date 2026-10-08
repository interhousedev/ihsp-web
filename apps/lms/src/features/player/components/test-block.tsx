"use client"

import {
  isApiError,
  keys,
  postLmsStepBlockAttempts,
  type Answer,
  type AttemptResult,
  type AttemptView,
  type StepView,
} from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Spinner } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { secondsToMinutes } from "../../shared/utils/time"
import { refreshProgress } from "../utils/fresh"
import { AttemptResultView } from "./attempt-result"
import { AttemptRunner } from "./attempt-runner"

type TestBlockData = Extract<StepView["blocks"][number], { type: "test" }>

type Finished = { attempt: AttemptView; result: AttemptResult; answers: Record<string, Answer> }

/** `params.available_at` of a refused start: the pause between attempts is not over (UF-LMS-04, 2b). */
function availableAt(error: unknown): string | null {
  if (!isApiError(error)) return null
  const value = error.params.available_at
  return typeof value === "string" ? value : null
}

/**
 * A test block of a step: the rules, Start or Continue, the open attempt and the result. Preview attempts (staff with
 * `view_drafts`) are started with `preview=true` and never count.
 */
export function TestBlock({
  courseId,
  stepId,
  block,
  preview,
  slug,
}: {
  courseId: string
  stepId: string
  block: TestBlockData
  preview: boolean
  /** The course address, to refresh the course page progress after a submit. */
  slug: string | null
}) {
  const t = useT("test")
  const errorMessage = useErrorMessage()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const [attempt, setAttempt] = useState<AttemptView | null>(null)
  const [finished, setFinished] = useState<Finished | null>(null)
  const { rules, best } = block

  // The step view is cached by the browser for a minute, so the new `attempts_left` and `best` are read past the cache.
  const refresh = useCallback(() => {
    if (preview) void queryClient.invalidateQueries({ queryKey: keys.lms.preview(courseId, stepId) })
    else void refreshProgress(queryClient, { courseId, stepId, slug })
  }, [courseId, preview, queryClient, slug, stepId])

  const start = useMutation<AttemptView, unknown, void>({
    mutationFn: () => postLmsStepBlockAttempts(stepId, block.id, preview ? { preview: true } : undefined),
    onSuccess: (view) => {
      setFinished(null)
      setAttempt(view)
    },
    // `lms/no-attempts-left` and the pause between attempts mean the rules on screen are out of date.
    onError: () => refresh(),
  })

  const submitted = useCallback(
    (result: AttemptResult, answers: Record<string, Answer>) => {
      setAttempt((current) => {
        if (current) setFinished({ attempt: current, result, answers })
        return null
      })
      refresh()
    },
    [refresh],
  )

  /** `lms/attempt-closed`: the server already submitted this attempt (time ran out); show the rules again. */
  const closed = useCallback(() => {
    setAttempt(null)
    refresh()
  }, [refresh])

  const noAttemptsLeft = rules.attempts_left === 0 && !preview && block.open_attempt_id === null
  const pauseUntil = start.isError ? availableAt(start.error) : null

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{t("title")}</h3>
          {preview ? <Badge variant="secondary">{t("previewAttempt")}</Badge> : null}
        </div>

        {attempt ? (
          <AttemptRunner key={attempt.id} attempt={attempt} onSubmitted={submitted} onClosed={closed} />
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground text-xs">{t("rules.questions")}</dt>
                <dd className="font-medium">{rules.questions}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("rules.attemptsLeft")}</dt>
                <dd className="font-medium">
                  {rules.attempts_left === null ? t("rules.unlimited") : rules.attempts_left}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("rules.timeLimit")}</dt>
                <dd className="font-medium">
                  {rules.time_limit_sec === null
                    ? t("rules.noLimit")
                    : t("rules.minutes", { count: secondsToMinutes(rules.time_limit_sec) ?? 0 })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("rules.passing")}</dt>
                <dd className="font-medium">{rules.passing_score_pct}%</dd>
              </div>
            </dl>

            {best ? (
              <p className="text-sm" data-testid="best-result">
                {t("best", { score: best.score, max: best.max_score })}{" "}
                <Badge variant={best.passed ? "default" : "destructive"}>
                  {best.passed ? t("passed") : t("failed")}
                </Badge>
              </p>
            ) : null}

            {finished ? (
              <AttemptResultView attempt={finished.attempt} result={finished.result} answers={finished.answers} />
            ) : null}

            {start.isError ? (
              <Alert variant={pauseUntil ? "default" : "destructive"}>
                <AlertDescription>
                  {pauseUntil ? t("pause", { time: format.dateTime(pauseUntil) }) : errorMessage(start.error)}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => start.mutate()}
                disabled={start.isPending || noAttemptsLeft}
                className="min-h-11 md:min-h-8"
              >
                {start.isPending ? <Spinner aria-hidden /> : null}
                {block.open_attempt_id ? t("continue") : finished || best ? t("again") : t("start")}
              </Button>
              {noAttemptsLeft ? <span className="text-muted-foreground text-sm">{t("noAttemptsLeft")}</span> : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

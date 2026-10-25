"use client"

import { keys, postLmsAttemptOverride, type AttemptReview } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Field, FieldLabel, Input, LoadingButton, Textarea } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

/** Overrides the score of an attempt with a required comment (LMS-20, UF-LMS-15 step 3). */
export function OverrideForm({ attempt, courseId }: { attempt: AttemptReview; courseId: string | null }) {
  const t = useT("attempt")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [score, setScore] = useState<string>(String(attempt.override_score ?? attempt.score))
  const [comment, setComment] = useState(attempt.override_comment ?? "")

  const override = useMutation<AttemptReview, unknown, { score: number; comment: string }>({
    mutationFn: (body) => postLmsAttemptOverride(attempt.id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.lms.attempt(attempt.id), updated)
      if (courseId) void queryClient.invalidateQueries({ queryKey: keys.lms.students(courseId) })
    },
  })

  const value = Number(score)
  const valid =
    score.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= attempt.max_score && comment.trim() !== ""

  function submit(event: FormEvent) {
    event.preventDefault()
    if (valid) override.mutate({ score: value, comment: comment.trim() })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <h2 className="text-base font-semibold">{t("overrideTitle")}</h2>
      <Field>
        <FieldLabel htmlFor="override-score">{t("overrideScore", { max: attempt.max_score })}</FieldLabel>
        <Input
          id="override-score"
          type="number"
          step="any"
          min={0}
          max={attempt.max_score}
          value={score}
          onChange={(event) => setScore(event.target.value)}
          className="h-11 max-w-40 md:h-8"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="override-comment">{t("overrideComment")}</FieldLabel>
        <Textarea
          id="override-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder={t("overrideCommentPlaceholder")}
        />
      </Field>
      {override.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(override.error)}</AlertDescription>
        </Alert>
      ) : null}
      {override.isSuccess ? (
        <Alert role="status">
          <AlertDescription>{t("overrideSaved")}</AlertDescription>
        </Alert>
      ) : null}
      <div>
        <LoadingButton type="submit" disabled={!valid} className="min-h-11 md:min-h-8" loading={override.isPending}>
          {t("overrideSubmit")}
        </LoadingButton>
      </div>
    </form>
  )
}

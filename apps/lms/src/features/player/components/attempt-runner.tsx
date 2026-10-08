"use client"

import {
  isApiError,
  postLmsAttemptSubmit,
  putLmsAttemptAnswers,
  type Answer,
  type AttemptResult,
  type AttemptView,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Badge, Button, Spinner, cn } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { formatCountdown } from "../../shared/utils/time"
import { useCountdown } from "../hooks/use-countdown"
import { isAnswered, withAnswer } from "../utils/answers"
import { QuestionField } from "./question-field"

/** How long to wait after the last change before the answers are saved to the server. */
export const ANSWER_SAVE_DELAY_MS = 600

type SaveState = "idle" | "saving" | "saved" | "error"

/**
 * An open attempt: the questions with the saved answers, the timer, and Submit. Answers are saved as the student goes
 * (UF-LMS-04, step 3); when the time runs out the attempt is submitted by itself (step 4).
 */
export function AttemptRunner({
  attempt,
  onSubmitted,
  onClosed,
  saveDelayMs = ANSWER_SAVE_DELAY_MS,
}: {
  attempt: AttemptView
  onSubmitted: (result: AttemptResult, answers: Record<string, Answer>) => void
  /** The server answered `lms/attempt-closed`: the attempt was already submitted (for example when time ran out). */
  onClosed: () => void
  saveDelayMs?: number
}) {
  const t = useT("test")
  const errorMessage = useErrorMessage()
  const [answers, setAnswers] = useState<Record<string, Answer>>(attempt.answers)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  const answersRef = useRef(answers)
  const dirtyRef = useRef(false)
  const savingRef = useRef<Promise<void> | null>(null)
  const submittedRef = useRef(false)
  const closedRef = useRef(false)
  const saveTimer = useRef<number | null>(null)

  /** `lms/attempt-closed` means the server already finished this attempt; hand over to the block once. */
  const closeIfClosed = useCallback(
    (error: unknown): boolean => {
      if (!isApiError(error) || error.type !== "lms/attempt-closed") return false
      if (!closedRef.current) {
        closedRef.current = true
        onClosed()
      }
      return true
    },
    [onClosed],
  )

  const flush = useCallback(async () => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    if (savingRef.current) await savingRef.current
    if (!dirtyRef.current) return
    dirtyRef.current = false
    setSaveState("saving")
    const run = putLmsAttemptAnswers(attempt.id, { answers: answersRef.current }).then(
      () => setSaveState("saved"),
      (error: unknown) => {
        dirtyRef.current = true
        setSaveState("error")
        closeIfClosed(error)
      },
    )
    savingRef.current = run
    await run
    savingRef.current = null
  }, [attempt.id, closeIfClosed])

  const submit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      await flush()
      const result = await postLmsAttemptSubmit(attempt.id)
      onSubmitted(result, answersRef.current)
    } catch (error) {
      if (closeIfClosed(error)) return
      submittedRef.current = false
      setSubmitError(error)
      setSubmitting(false)
    }
  }, [attempt.id, closeIfClosed, flush, onSubmitted])

  const submitRef = useRef(submit)
  useEffect(() => {
    submitRef.current = submit
  }, [submit])
  const remaining = useCountdown(attempt.deadline_at, () => void submitRef.current())

  useEffect(
    () => () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    },
    [],
  )

  function change(questionId: string, answer: Answer | null) {
    const next = withAnswer(answersRef.current, questionId, answer)
    answersRef.current = next
    setAnswers(next)
    dirtyRef.current = true
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void flush(), saveDelayMs)
  }

  const answered = attempt.questions.filter((question) => isAnswered(answers[question.id])).length
  const urgent = remaining !== null && remaining <= 60

  return (
    <section aria-label={t("attemptLabel", { number: attempt.attempt_no })} className="flex flex-col gap-4">
      <div className="bg-background/90 sticky top-14 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t("attemptLabel", { number: attempt.attempt_no })}</Badge>
          <span className="text-muted-foreground text-xs">
            {t("answered", { done: answered, total: attempt.questions.length })}
          </span>
          <span className="text-muted-foreground text-xs" role="status">
            {saveState === "saving"
              ? t("saving")
              : saveState === "saved"
                ? t("saved")
                : saveState === "error"
                  ? t("saveFailed")
                  : ""}
          </span>
        </div>
        {remaining !== null ? (
          <span
            role="timer"
            aria-label={t("timeLeft")}
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-sm tabular-nums",
              urgent && "border-destructive text-destructive",
            )}
          >
            {formatCountdown(remaining)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {attempt.questions.map((question, index) => (
          <QuestionField
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id]}
            onChange={(answer) => change(question.id, answer)}
            disabled={submitting}
          />
        ))}
      </div>

      {submitError !== null ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(submitError)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={() => void submit()} disabled={submitting} className="min-h-11 md:min-h-8">
          {submitting ? <Spinner aria-hidden /> : null}
          {t("submit")}
        </Button>
      </div>
    </section>
  )
}

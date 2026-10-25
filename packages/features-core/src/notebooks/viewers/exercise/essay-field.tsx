"use client"

import type { ExerciseFeedback, ExerciseQuestion } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, LoadingButton, Textarea } from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { useExerciseFeedback } from "../../api/use-artifacts"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { wordCount } from "./grading"

type EssayFieldProps = {
  notebookId: string
  artifactId: string
  question: ExerciseQuestion
  value: string
  submitted: boolean
  /** A public shared view: no AI feedback (it is charged to the owner). */
  shared: boolean
  onChange: (value: string) => void
}

/** mm:ss of a number of seconds. */
export function clock(seconds: number): string {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`
}

/** A countdown of the task's time; it only runs while the student has it started. */
function EssayTimer({ minutes }: { minutes: number }) {
  const t = useT("notebooks.exercise")
  const [left, setLeft] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((current) => (current <= 1 ? 0 : current - 1)), 1000)
    return () => clearInterval(id)
  }, [running])
  const over = left === 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span role="timer" aria-live="off" className={over ? "text-destructive tabular-nums" : "tabular-nums"}>
        {over ? t("timer.over") : t("timer.left", { time: clock(left) })}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 md:min-h-8"
        disabled={over}
        onClick={() => setRunning((current) => !current)}
      >
        {running ? t("timer.pause") : t("timer.start")}
      </Button>
    </div>
  )
}

function Rubric({ question }: { question: ExerciseQuestion }) {
  const t = useT("notebooks.exercise")
  return (
    <div className="flex flex-col gap-3 text-sm">
      <h4 className="font-semibold">{t("rubric")}</h4>
      {question.criteria.map((criterion) => (
        <div key={criterion.name} className="flex flex-col gap-1">
          <p className="font-medium">{criterion.name}</p>
          {criterion.description ? <p className="text-muted-foreground">{criterion.description}</p> : null}
          <ul className="flex flex-col gap-0.5">
            {criterion.bands.map((band) => (
              <li key={band.band}>
                <span className="font-medium tabular-nums">{band.band}</span>: {band.descriptor}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {question.model_outline.length > 0 ? (
        <>
          <h4 className="font-semibold">{t("outline")}</h4>
          <ul className="list-disc pl-5">
            {question.model_outline.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

function FeedbackView({ feedback }: { feedback: ExerciseFeedback }) {
  const t = useT("notebooks.exercise")
  return (
    <section aria-label={t("feedback.title")} className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3 text-sm">
      <h4 className="font-semibold">{t("feedback.band", { band: feedback.estimated_band })}</h4>
      <p>{feedback.overall}</p>
      <ul className="flex flex-col gap-1">
        {feedback.criteria.map((criterion) => (
          <li key={criterion.name}>
            <span className="font-medium">
              {criterion.name}: {criterion.band}
            </span>{" "}
            {criterion.comment}
          </li>
        ))}
      </ul>
      {feedback.strengths.length > 0 ? (
        <>
          <p className="font-medium">{t("feedback.strengths")}</p>
          <ul className="list-disc pl-5">
            {feedback.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      {feedback.improvements.length > 0 ? (
        <>
          <p className="font-medium">{t("feedback.improvements")}</p>
          <ul className="list-disc pl-5">
            {feedback.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

/** The essay: a textarea with a word counter and a timer; after Submit the rubric and "Get AI feedback". */
export function EssayField({ notebookId, artifactId, question, value, submitted, shared, onChange }: EssayFieldProps) {
  const t = useT("notebooks.exercise")
  const errorMessage = useNotebookErrorMessage()
  const counterId = useId()
  const feedback = useExerciseFeedback(notebookId, artifactId)
  const words = wordCount(value)
  const short = words < question.min_words
  return (
    <div className="flex flex-col gap-3">
      {question.time_minutes > 0 && !submitted ? <EssayTimer minutes={question.time_minutes} /> : null}
      <Textarea
        value={value}
        readOnly={submitted}
        aria-label={t("essay")}
        aria-describedby={counterId}
        rows={12}
        className="min-h-48 text-base md:text-sm"
        onChange={(event) => onChange(event.target.value)}
      />
      <p
        id={counterId}
        className={short ? "text-muted-foreground text-xs" : "text-xs text-emerald-700 dark:text-emerald-300"}
      >
        {t("words", { count: words, min: question.min_words })}
      </p>
      {submitted ? (
        <>
          <Rubric question={question} />
          {shared ? null : feedback.data ? (
            <FeedbackView feedback={feedback.data} />
          ) : (
            <div className="flex flex-col gap-1">
              <LoadingButton
                type="button"
                className="min-h-11 self-start md:min-h-8"
                loading={feedback.isPending}
                loadingLabel={t("feedback.loading")}
                disabled={words < 10}
                onClick={() => feedback.mutate({ question_id: question.id, answer: value })}
              >
                {t("feedback.get")}
              </LoadingButton>
              {words < 10 ? <p className="text-muted-foreground text-xs">{t("feedback.tooShort")}</p> : null}
              {feedback.isError ? (
                <p role="alert" className="text-destructive text-sm">
                  {errorMessage(feedback.error)}
                </p>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

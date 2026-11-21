"use client"

import { Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { firstUnanswered, StepperWizard, type StepAnswers, type StepperLabels } from "../../../components/stepper"
import { useAlgorithm } from "../hooks"
import { mergeValues } from "../mapping"
import { AlgorithmSummary } from "./algorithm-summary"

/**
 * The 13-question college-search questionnaire, then the summary of the student's tags. `onFinished` runs when the
 * last answer is saved; `withContinue` shows the summary's own link on to the swipe page (the stepper flow has its own).
 */
export function AlgorithmFlow({ onFinished, withContinue = true }: { onFinished?: () => void; withContinue?: boolean }) {
  const { t, preferences, quiz, majors, sources, questions, save } = useAlgorithm()
  const [answers, setAnswers] = useState<StepAnswers | null>(null)
  const [editing, setEditing] = useState(false)
  const data = preferences.data

  const labels: StepperLabels = {
    back: t("back"),
    next: t("next"),
    finish: t("finish"),
    saving: t("saving"),
    saveError: t("saveError"),
    step: (current, total) => t("step", { current, total }),
    progress: t("progress"),
  }
  // The wizard mounts once the questions (majors, regions) and the stored answers are there, so it can resume.
  const ready = data !== undefined && majors.isSuccess && !quiz.isLoading
  const stored = data ? mergeValues(quiz.data?.answers, data.answers) : {}
  const current = answers ?? stored
  const showSummary = ready && !editing && firstUnanswered(questions, stored) === questions.length

  return (
    <div className="flex flex-col gap-4">
      {preferences.isError && (
        <StateView state="error" error={preferences.error} onRetry={() => void preferences.refetch()} />
      )}
      {majors.isError && <StateView state="error" error={majors.error} onRetry={() => void majors.refetch()} />}
      {!ready && !preferences.isError && !majors.isError && <Skeleton className="h-80 w-full" />}
      {ready && showSummary && (
        <AlgorithmSummary
          preferences={data}
          sources={sources}
          t={(key, values) => t(key, values)}
          withContinue={withContinue}
            onEdit={() => {
            setAnswers(stored)
            setEditing(true)
          }}
        />
      )}
      {ready && !showSummary && (
        <StepperWizard
          questions={questions}
          answers={current}
          initialStep={editing ? 0 : firstUnanswered(questions, stored)}
          onAnswer={(id, value) => setAnswers({ ...current, [id]: value })}
          onStepDone={(question, all) => save.mutateAsync({ field: question.id, value: all[question.id] })}
          onFinish={() => {
              setEditing(false)
              onFinished?.()
            }}
          labels={labels}
        />
      )}
    </div>
  )
}

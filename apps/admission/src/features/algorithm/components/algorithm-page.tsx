"use client"

import { PageHeader, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { StepperWizard, type StepAnswers, type StepperLabels } from "../../../components/stepper"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useAlgorithm } from "../hooks"
import { answersToValues, resumeIndex } from "../mapping"
import { AlgorithmSummary } from "./algorithm-summary"

/** `/colleges/algorithm`: the 13-question college-search questionnaire, then the summary of the student's tags. */
export function AlgorithmPage() {
  const { t, preferences, majors, sources, questions, save } = useAlgorithm()
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
    guide: t("guide"),
  }
  // The wizard mounts once the questions (majors, regions) and the stored answers are there, so it can resume.
  const ready = data !== undefined && majors.isSuccess
  const stored = data ? answersToValues(data.answers) : {}
  const current = answers ?? stored
  const showSummary = ready && !editing && resumeIndex(questions, data.answers) === questions.length

  return (
    <AdmissionShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
        <PageHeader title={t("title")} />
        {preferences.isError && (
          <StateView state="error" error={preferences.error} onRetry={() => void preferences.refetch()} />
        )}
        {majors.isError && <StateView state="error" error={majors.error} onRetry={() => void majors.refetch()} />}
        {!ready && !preferences.isError && !majors.isError && <Skeleton className="h-80 w-full" />}
        {ready && showSummary && (
          <AlgorithmSummary
            preferences={data}
            questions={questions}
            sources={sources}
            t={(key, values) => t(key, values)}
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
            initialStep={editing ? 0 : resumeIndex(questions, data.answers)}
            onAnswer={(id, value) => setAnswers({ ...current, [id]: value })}
            onStepDone={(question, all) => save.mutateAsync({ field: question.id, value: all[question.id] })}
            onFinish={() => setEditing(false)}
            labels={labels}
          />
        )}
      </div>
    </AdmissionShell>
  )
}

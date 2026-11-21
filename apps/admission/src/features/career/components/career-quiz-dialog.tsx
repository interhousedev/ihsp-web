"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { StepperWizard, type StepQuestion } from "../../../components/stepper"
import { useQuiz, useSaveQuiz } from "../../profile/details-api"
import { STUDY_FIELDS_KEY, readStudyFields } from "../../profile/study-fields"
import { careerMajorsQuery } from "../api"
import { QUIZ, recommend, type Recommendation } from "../quiz"

/** The stored quiz answers as plain strings. */
export function useQuizAnswers() {
  const quiz = useQuiz("career")
  const answers: Record<string, string> = Object.fromEntries(
    Object.entries(quiz.data?.answers ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
  return { quiz, answers, done: quiz.data?.completed === true }
}

/** The majors the finished quiz points at (empty until it is finished). */
export function useQuizMajors(): { recommendations: Recommendation[]; done: boolean } {
  const { answers, done } = useQuizAnswers()
  const majors = useQuery(careerMajorsQuery())
  const available = (majors.data?.items ?? []).filter((m) => m.active).map((m) => m.code)
  return { recommendations: done ? recommend(answers, available) : [], done }
}

/** "Take the test (2 min)": the 10-question quiz in a dialog; the answers are stored with the account. */
export function CareerQuizButton({ variant = "outline" }: { variant?: "outline" | "secondary" | "ghost" }) {
  const t = useT("career")
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  const { quiz, answers, done } = useQuizAnswers()
  const saveQuiz = useSaveQuiz("career")
  const studyFields = readStudyFields(quiz.data?.answers)
  /** The quiz is stored whole: the study fields chosen on the profile ride along with every answer. */
  const withStudyFields = (next: Record<string, string>) => ({
    ...next,
    ...(studyFields.length > 0 ? { [STUDY_FIELDS_KEY]: studyFields } : {}),
  })
  const questions: StepQuestion[] = QUIZ.map((q) => ({
    id: q.id,
    section: "career",
    sectionLabel: t("title"),
    title: t(`quiz.${q.id}.title`),
    kind: "single",
    options: q.options.map((o) => ({
      value: o.key,
      label: t(`quiz.${q.id}.${o.key}`),
      description: q.kind === "track" ? t(`quiz.${q.id}.${o.key}Text`) : undefined,
    })),
  }))
  const start = () => {
    if (done) {
      saveQuiz.mutate({ answers: withStudyFields({}), completed: false })
      setRound((n) => n + 1)
    }
    setOpen(true)
  }
  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={start} disabled={!quiz.isSuccess && !quiz.isError}>
        <Icons.sparkles aria-hidden />
        {t(done ? "quizAgain" : "quizTake")}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("quizTitle")} description={t("quizHint")} size="lg">
        <StepperWizard
          key={round}
          questions={questions}
          answers={answers}
          onAnswer={(id, value) =>
            saveQuiz.mutate({
              answers: withStudyFields({ ...answers, [id]: typeof value === "string" ? value : "" }),
              completed: false,
            })
          }
          onFinish={() => {
            saveQuiz.mutate({ answers: withStudyFields(answers), completed: true })
            setOpen(false)
          }}
          labels={{
            back: t("back"),
            next: t("next"),
            finish: t("seeResults"),
            saving: t("saving"),
            saveError: t("saveError"),
            step: (current, total) => t("progress", { current, total }),
            progress: t("title"),
          }}
        />
      </ResponsiveDialog>
    </>
  )
}

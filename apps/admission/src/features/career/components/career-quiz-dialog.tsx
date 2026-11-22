"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { useQuiz, useSaveQuiz, type QuizAnswer } from "../../profile/details-api"
import { STUDY_FIELDS_KEY, readStudyFields } from "../../profile/study-fields"
import { ikigaiQuery, professionKeys, putIkigai } from "../../professions/api"
import { EMPTY_IKIGAI } from "../../professions/model"
import { careerMajorsQuery } from "../api"
import { IKIGAI_QUESTIONS, deriveIkigai, ikigaiKey, ikigaiTextKey, mergeIkigai } from "../ikigai-questions"
import { QuizVoice } from "./quiz-voice"
import { QUIZ, recommend, type Recommendation } from "../quiz"
import { QuestionnaireWizard, type QuestionnaireExtraContext, type QuestionnaireQuestion } from "./questionnaire-wizard"

/** The stored quiz answers as plain strings (the major-voting part), and all of them as stored. */
export function useQuizAnswers() {
  const quiz = useQuiz("career")
  const raw: Record<string, QuizAnswer> = quiz.data?.answers ?? {}
  const answers: Record<string, string> = Object.fromEntries(
    Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
  return { quiz, answers, raw, done: quiz.data?.completed === true }
}

/** The majors the finished quiz points at (empty until it is finished). */
export function useQuizMajors(): { recommendations: Recommendation[]; done: boolean } {
  const { answers, done } = useQuizAnswers()
  const majors = useQuery(careerMajorsQuery())
  const available = (majors.data?.items ?? []).filter((m) => m.active).map((m) => m.code)
  return { recommendations: done ? recommend(answers, available) : [], done }
}

/**
 * "Take the test (5 min)": the career questionnaire in a dialog. Its first part votes for fields of study, its second
 * part (about people, work, AI and the world) fills the four ikigai circles; the student edits the result in the
 * ikigai step. The answers are stored with the account. `renderExtra` is the slot for a voice-fill component.
 */
export function CareerQuizButton({
  variant = "outline",
  renderExtra,
}: {
  variant?: "outline" | "secondary" | "ghost"
  renderExtra?: (context: QuestionnaireExtraContext) => ReactNode
}) {
  const t = useT("career")
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  const { quiz, raw: stored, done } = useQuizAnswers()
  /** The answers of this run: a late server reply of an earlier save must not undo a newer pick. */
  const [local, setLocal] = useState<Record<string, QuizAnswer> | null>(null)
  const raw = local ?? stored
  const saveQuiz = useSaveQuiz("career")
  const studyFields = readStudyFields(quiz.data?.answers)
  /** The quiz is stored whole: the study fields chosen on the profile ride along with every answer. */
  const withStudyFields = (next: Record<string, QuizAnswer>) => ({
    ...next,
    ...(studyFields.length > 0 ? { [STUDY_FIELDS_KEY]: studyFields } : {}),
  })
  const tests = t("ikigaiQ.sectionTests")
  const about = t("ikigaiQ.sectionIkigai")
  const questions: QuestionnaireQuestion[] = [
    ...QUIZ.map((q): QuestionnaireQuestion => ({
      id: q.id,
      section: "career",
      sectionLabel: tests,
      title: t(`quiz.${q.id}.title`),
      kind: "single",
      options: q.options.map((o) => ({
        value: o.key,
        label: t(`quiz.${q.id}.${o.key}`),
        description: q.kind === "track" ? t(`quiz.${q.id}.${o.key}Text`) : undefined,
      })),
    })),
    ...IKIGAI_QUESTIONS.map((q): QuestionnaireQuestion => ({
      id: ikigaiKey(q.id),
      section: "ikigai",
      sectionLabel: about,
      title: t(`ikigaiQ.${q.id}.title`),
      guide: t(`ikigaiQ.${q.id}.guide`),
      kind: q.kind === "single" ? "single" : "multi",
      optional: q.id === "people",
      max: q.max,
      options: q.options.map((o) => ({ value: o, label: t(`ikigaiQ.${q.id}.${o}`) })),
      ...(q.text
        ? {
            textKey: ikigaiTextKey(q.id),
            textLabel: t("ikigaiQ.textLabel"),
            textPlaceholder: t("ikigaiQ.textPlaceholder"),
          }
        : {}),
    })),
  ]

  /** The ikigai the answers imply is added to the student's own chips and saved; then the quiz is marked finished. */
  async function finish(texts: Record<string, string>) {
    const answers = withStudyFields({ ...raw, ...texts })
    const derived = deriveIkigai(answers, (id, option) => t(`ikigaiQ.${id}.${option}`))
    const current = await client.fetchQuery({ ...ikigaiQuery(), staleTime: 0 }).catch(() => EMPTY_IKIGAI)
    const saved = await putIkigai(mergeIkigai(current, derived))
    client.setQueryData(professionKeys.ikigai(), saved)
    await saveQuiz.mutateAsync({ answers, completed: true })
    setOpen(false)
  }

  const start = () => {
    if (done) {
      saveQuiz.mutate({ answers: withStudyFields({}), completed: false })
      setRound((n) => n + 1)
      setLocal(null)
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
        <QuestionnaireWizard
          key={round}
          questions={questions}
          answers={raw}
          onAnswer={(key, value) => {
            const next = { ...raw, [key]: value }
            setLocal(next)
            saveQuiz.mutate({ answers: withStudyFields(next), completed: false })
          }}
          onFinish={finish}
          renderExtra={renderExtra ?? ((context) => <QuizVoice {...context} />)}
          labels={{
            back: t("back"),
            next: t("next"),
            finish: t("ikigaiQ.done"),
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

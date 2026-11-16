"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { careerKeys, careerMajorsQuery, careerPlanQuery, putChoice, type CareerPlan } from "../api"
import { StepperWizard, type StepQuestion } from "../../../components/stepper"
import { QUIZ, recommend } from "../quiz"
import { CareerDeepDive } from "./career-deep-dive"
import { CareerResults } from "./career-results"

const MAJORS_MAX = 3

const storageKey = (userId: string) => `admission.career.quiz.${userId}`

function loadQuiz(userId: string): { answers: Record<string, string>; done: boolean } | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { answers?: Record<string, string>; done?: boolean }
    return { answers: parsed.answers ?? {}, done: parsed.done === true }
  } catch {
    return null
  }
}

function saveQuiz(userId: string, answers: Record<string, string>, done: boolean) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify({ answers, done }))
  } catch {
    /* storage unavailable: the quiz still works in memory */
  }
}

export function CareerPage() {
  const t = useT("career")
  const { session } = useSession()
  const userId = session?.user.id
  const client = useQueryClient()
  const plan = useQuery(careerPlanQuery())
  const majors = useQuery(careerMajorsQuery())
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [round, setRound] = useState(0)
  const [done, setDone] = useState(false)
  const [retaking, setRetaking] = useState(false)
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    if (!userId) return
    const saved = loadQuiz(userId)
    if (saved) {
      setAnswers(saved.answers)
      setDone(saved.done)
    }
    setRestored(true)
  }, [userId])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const data = plan.data
  const showResults = done || (!retaking && (data?.majors.length ?? 0) > 0 && Object.keys(answers).length === 0)
  const taxonomy = majors.data?.items ?? []

  async function add(code: string, current: CareerPlan) {
    setBusy(true)
    setError(null)
    try {
      const next = [...current.majors.filter((c) => c !== code), code].slice(-MAJORS_MAX)
      const saved = await putChoice(
        next,
        current.minors.filter((c) => c !== code),
        current.lock_version,
      )
      client.setQueryData(careerKeys.plan(), saved)
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

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
  return (
    <AdmissionShell>
      {error != null && <StateView state="error" error={error} />}
      {plan.isError && <StateView state="error" error={plan.error} onRetry={() => void plan.refetch()} />}
      {majors.isError && <StateView state="error" error={majors.error} onRetry={() => void majors.refetch()} />}
      {data && majors.data && restored && showResults && (
        <div className="space-y-6 pb-6">
          <CareerResults
            recommendations={recommend(
              answers,
              taxonomy.filter((m) => m.active).map((m) => m.code),
            )}
            majors={taxonomy}
            plan={data}
            busy={busy}
            onAdd={(code) => void add(code, data)}
            onRedo={() => {
              if (userId) window.localStorage.removeItem(storageKey(userId))
              setAnswers({})
              setDone(false)
              setRetaking(true)
              setRound(round + 1)
            }}
          />
          <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
            <CareerDeepDive data={data} />
          </div>
        </div>
      )}
      {data && majors.data && restored && !showResults && (
        <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
          <StepperWizard
            key={round}
            questions={questions}
            answers={answers}
            onAnswer={(id, value) => {
              const next = { ...answers, [id]: typeof value === "string" ? value : "" }
              setAnswers(next)
              if (userId) saveQuiz(userId, next, false)
            }}
            onFinish={() => {
              setDone(true)
              if (userId) saveQuiz(userId, answers, true)
            }}
            labels={{
              back: t("back"),
              next: t("next"),
              finish: t("seeResults"),
              saving: t("saving"),
              saveError: t("saveError"),
              step: (current, total) => t("progress", { current, total }),
              progress: t("title"),
              guide: t("hint"),
            }}
          />
        </div>
      )}
    </AdmissionShell>
  )
}

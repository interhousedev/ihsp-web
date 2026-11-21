"use client"

import { pageClass } from "../../../components/lib/page"
import { useLocale, useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { NextStep } from "../../../components/next-step"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { READINESS_KEY } from "../../readiness/api"
import { careerKeys, careerMajorsQuery, careerPlanQuery, putChoice, type CareerPlan } from "../api"
import { StudyFieldsPicker } from "../../profile/components/study-fields-picker"
import { detailsKey, useSaveQuiz } from "../../profile/details-api"
import { STUDY_FIELDS_KEY, readStudyFields } from "../../profile/study-fields"
import { listLabels } from "../list-labels"
import { CareerResults } from "./career-results"
import { useQuizAnswers, useQuizMajors } from "./career-quiz-dialog"

const MAJORS_MAX = 3

function InterestsSection() {
  const t = useT("profilePage")
  return (
    <section aria-labelledby="career-interests" className="flex w-full min-w-0 flex-col gap-4">
      <h2 id="career-interests" className="text-lg font-semibold">
        {t("interests.fields")}
      </h2>
      <StudyFieldsPicker />
    </section>
  )
}

function FieldTab() {
  const t = useT("career")
  const locale = useLocale()
  const plan = useQuery(careerPlanQuery())
  const labels = plan.data?.study_focus?.labels ?? []
  return (
    <div className={pageClass()}>
      <InterestsSection />
      {labels.length > 0 && (
        <NextStep href="/opportunities/" label={t("nextActivities", { fields: listLabels(labels, locale) })} />
      )}
    </div>
  )
}

export function CareerPage() {
  return <CareerContent />
}

/**
 * "Направление": the fields of study, and what the career test (taken on Профессии) suggests. One page, no tabs of its
 * own: the profile section tabs are the only tab bar.
 */
function CareerContent() {
  const client = useQueryClient()
  const router = useRouter()
  const plan = useQuery(careerPlanQuery())
  const majors = useQuery(careerMajorsQuery())
  const saveQuiz = useSaveQuiz("career")
  const { quiz } = useQuizAnswers()
  const { recommendations, done } = useQuizMajors()
  const studyFields = readStudyFields(quiz.data?.answers)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const data = plan.data
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
      // The profile's field count and the readiness behind the dashboard read the same plan.
      void client.invalidateQueries({ queryKey: detailsKey })
      void client.invalidateQueries({ queryKey: READINESS_KEY })
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdmissionShell>
      <FieldTab />
      {error != null && <StateView state="error" error={error} />}
      {plan.isError && <StateView state="error" error={plan.error} onRetry={() => void plan.refetch()} />}
      {majors.isError && <StateView state="error" error={majors.error} onRetry={() => void majors.refetch()} />}
      {done && data && majors.data && (
        <CareerResults
          recommendations={recommendations}
          majors={taxonomy}
          plan={data}
          busy={busy}
          onAdd={(code) => void add(code, data)}
          onRedo={() => {
            saveQuiz.mutate({
              answers: studyFields.length > 0 ? { [STUDY_FIELDS_KEY]: studyFields } : {},
              completed: false,
            })
            router.push("/profile/professions/")
          }}
        />
      )}
    </AdmissionShell>
  )
}

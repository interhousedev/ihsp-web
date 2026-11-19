"use client"

import { pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Suspense, useState } from "react"
import { NextStep } from "../../../components/next-step"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { READINESS_KEY } from "../../readiness/api"
import { careerKeys, careerMajorsQuery, careerPlanQuery, putChoice, type CareerPlan } from "../api"
import { StepperWizard, type StepQuestion } from "../../../components/stepper"
import { StudyFieldsPicker } from "../../profile/components/study-fields-picker"
import { detailsKey, useQuiz, useSaveQuiz } from "../../profile/details-api"
import { STUDY_FIELDS_KEY, readStudyFields } from "../../profile/study-fields"
import { QUIZ, recommend } from "../quiz"
import { CareerDeepDive } from "./career-deep-dive"
import { CareerResults } from "./career-results"

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

const TABS = ["explore", "field", "future"] as const
type CareerTab = (typeof TABS)[number]

/** The tab of `?tab=`; anything else is Explore. */
export function careerTab(value: string | null): CareerTab {
  return TABS.find((tab) => tab === value) ?? "explore"
}

function FieldTab() {
  const t = useT("career")
  const plan = useQuery(careerPlanQuery())
  const labels = plan.data?.study_focus?.labels ?? []
  return (
    <div className={pageClass("narrow")}>
      <InterestsSection />
      {labels.length > 0 && (
        <NextStep href="/opportunities/" label={t("nextActivities", { fields: labels.join(", ") })} />
      )}
    </div>
  )
}

function TabStrip({ tab }: { tab: CareerTab }) {
  const t = useT("career")
  const router = useRouter()
  const plan = useQuery(careerPlanQuery())
  return (
    <div className={pageClass("narrow", "pb-0 md:pb-0")}>
      <UnderlineTabs
        label={t("tabs.label")}
        value={tab}
        onValueChange={(next) => router.replace(`/career/?tab=${next}`)}
        tabs={[
          { value: "explore", label: t("tabs.explore") },
          { value: "field", label: t("tabs.field"), count: plan.data?.study_focus?.field_ids.length ?? 0 },
          { value: "future", label: t("tabs.future") },
        ]}
      />
    </div>
  )
}

export function CareerPage() {
  return (
    <Suspense>
      <CareerContent />
    </Suspense>
  )
}

function CareerContent() {
  const t = useT("career")
  const tab = careerTab(useSearchParams().get("tab"))
  const client = useQueryClient()
  const plan = useQuery(careerPlanQuery())
  const majors = useQuery(careerMajorsQuery())
  // The answers and the "done" flag are stored with the account (`/me/quizzes/career`), so they survive a reload.
  const quiz = useQuiz("career")
  const saveQuiz = useSaveQuiz("career")
  const [round, setRound] = useState(0)
  const [retaking, setRetaking] = useState(false)
  const answers: Record<string, string> = Object.fromEntries(
    Object.entries(quiz.data?.answers ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
  const studyFields = readStudyFields(quiz.data?.answers)
  /** The quiz is stored whole: the study fields chosen on the profile ride along with every answer. */
  const withStudyFields = (next: Record<string, string>) => ({
    ...next,
    ...(studyFields.length > 0 ? { [STUDY_FIELDS_KEY]: studyFields } : {}),
  })
  const done = quiz.data?.completed === true
  const restored = quiz.isSuccess || quiz.isError
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
      // The profile's field count and the readiness behind the dashboard read the same plan.
      void client.invalidateQueries({ queryKey: detailsKey })
      void client.invalidateQueries({ queryKey: READINESS_KEY })
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
      <TabStrip tab={tab} />
      {tab === "field" && <FieldTab />}
      {tab === "future" && data && (
        <div className={pageClass("narrow")}>
          <CareerDeepDive data={data} />
        </div>
      )}
      {error != null && <StateView state="error" error={error} />}
      {plan.isError && <StateView state="error" error={plan.error} onRetry={() => void plan.refetch()} />}
      {majors.isError && <StateView state="error" error={majors.error} onRetry={() => void majors.refetch()} />}
      {tab === "explore" && data && majors.data && restored && showResults && (
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
              saveQuiz.mutate({ answers: withStudyFields({}), completed: false })
              setRetaking(true)
              setRound(round + 1)
            }}
          />
        </div>
      )}
      {tab === "explore" && data && majors.data && restored && !showResults && (
        <div className={pageClass("narrow")}>
          <StepperWizard
            key={round}
            questions={questions}
            answers={answers}
            onAnswer={(id, value) => {
              saveQuiz.mutate({
                answers: withStudyFields({ ...answers, [id]: typeof value === "string" ? value : "" }),
                completed: false,
              })
            }}
            onFinish={() => {
              saveQuiz.mutate({ answers: withStudyFields(answers), completed: true })
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
        </div>
      )}
    </AdmissionShell>
  )
}

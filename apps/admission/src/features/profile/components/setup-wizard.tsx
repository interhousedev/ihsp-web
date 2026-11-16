"use client"

import { useT } from "@ihsp/i18n"
import { AnimatedPresence, Button, Icons, PageHeader, Progress, Reveal, StateView } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useProfile, useWizardConfig } from "../api"
import { useProfileAnswers } from "../hooks/use-profile-answers"
import { useProfileText } from "../lib/use-profile-text"
import { isAnswered, missingRequired, visibleQuestions } from "../lib/visibility"
import type { AdmissionConfig, Profile } from "../types"
import { PrefillBadge, QuestionField } from "./question-field"
import { ReviewScreen } from "./review-screen"
import { SaveBadge } from "./save-badge"

const REVIEW = "review"

function WizardBody({ config, initial }: { config: AdmissionConfig; initial: Profile }) {
  const t = useT("profile")
  const text = useProfileText()
  const router = useRouter()
  const params = useSearchParams()
  const { answers, profile, state, setAnswer, flush, retry } = useProfileAnswers(initial)
  const questions = visibleQuestions(config, { answers, accountKind: initial.account_kind })
  const missing = missingRequired(questions, answers)

  const [current, setCurrent] = useState<string>(() => {
    const wanted = params.get("q")
    if (wanted === REVIEW || questions.some((question) => question.id === wanted)) return wanted as string
    return initial.next_question ?? (initial.setup_completed ? REVIEW : (questions[0]?.id ?? REVIEW))
  })
  const heading = useRef<HTMLHeadingElement>(null)
  const [finishing, setFinishing] = useState(false)

  const index = questions.findIndex((question) => question.id === current)
  // A question that became hidden (the answer it depended on changed) falls back to the review.
  const question = index >= 0 ? questions[index] : null
  const showReview = current === REVIEW || question === null

  useEffect(() => heading.current?.focus(), [current])

  function go(id: string) {
    setCurrent(id)
    router.replace(`/setup/?q=${id}`)
  }

  async function advance() {
    await flush()
    go(index + 1 < questions.length ? questions[index + 1].id : REVIEW)
  }

  async function back() {
    await flush()
    if (showReview) go(questions[questions.length - 1]?.id ?? REVIEW)
    else if (index > 0) go(questions[index - 1].id)
    else router.push("/")
  }

  async function finish() {
    setFinishing(true)
    await flush()
    setFinishing(false)
    router.push("/words/")
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (question && (!question.required || isAnswered(answers[question.id]) || question.kind === "locked")) {
      void advance()
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault()
      void back()
    }
  }

  const stepLabel = question ? t("step", { current: index + 1, total: questions.length }) : t("reviewTitle")
  const percent = question ? Math.round((index / Math.max(questions.length, 1)) * 100) : 100
  const canContinue =
    question !== null && (!question.required || question.kind === "locked" || isAnswered(answers[question.id]))
  const intro = question && (index === 0 || questions[index - 1].section !== question.section)

  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("title")} actions={<SaveBadge state={state} onRetry={() => void retry()} />} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <Button type="button" variant="ghost" size="sm" onClick={() => void back()}>
              <Icons.chevronLeft aria-hidden />
              {t("back")}
            </Button>
            <span aria-live="polite" className="text-muted-foreground tabular-nums">
              {stepLabel}
            </span>
          </div>
          <Progress value={percent} aria-label={t("progress")} />
        </div>
        {/* Enter advances the wizard from any field; the handler only forwards a key already pressed in a control. */}
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <form onSubmit={onSubmit} onKeyDown={onKeyDown} className="flex flex-col gap-6">
          <AnimatedPresence mode="wait" initial>
            <Reveal key={current} className="flex flex-col gap-4">
              {showReview ? (
                <>
                  <h1 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
                    {t("reviewTitle")}
                  </h1>
                  <ReviewScreen
                    questions={questions}
                    answers={answers}
                    missing={missing}
                    busy={finishing || state === "saving"}
                    onEdit={go}
                    onFinish={() => void finish()}
                  />
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    {intro
                      ? (text.sectionIntro(question.section) ?? text.section(question.section))
                      : text.section(question.section)}
                  </p>
                  <h1 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
                    {text.label(question.id)}
                  </h1>
                  {text.hint(question.id) ? (
                    <p className="text-muted-foreground text-sm">{text.hint(question.id)}</p>
                  ) : null}
                  <PrefillBadge question={question} />
                  <QuestionField
                    question={question}
                    value={answers[question.id]}
                    onChange={(value) => setAnswer(question.id, value)}
                  />
                </>
              )}
            </Reveal>
          </AnimatedPresence>
          {showReview ? null : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => void flush().then(() => router.push("/"))}>
                {t("saveExit")}
              </Button>
              <div className="flex items-center gap-2">
                {question && !question.required ? (
                  <Button type="button" variant="ghost" onClick={() => void advance()}>
                    {t("skip")}
                  </Button>
                ) : null}
                <Button type="submit" disabled={!canContinue}>
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AdmissionShell>
  )
}

/** The profile wizard: one question per screen, resumable (`/setup/` jumps to the first unanswered question). */
export function SetupWizard() {
  const t = useT("profile")
  const config = useWizardConfig()
  const profile = useProfile()
  if (config.isError || profile.isError) {
    return (
      <AdmissionShell>
        <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
          <StateView
            state="error"
            error={config.error ?? profile.error}
            onRetry={() => {
              void config.refetch()
              void profile.refetch()
            }}
          />
        </div>
      </AdmissionShell>
    )
  }
  if (!config.data || !profile.data) {
    return (
      <AdmissionShell>
        <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
          <PageHeader title={t("title")} />
          <StateView state="loading" />
        </div>
      </AdmissionShell>
    )
  }
  return <WizardBody config={config.data} initial={profile.data} />
}

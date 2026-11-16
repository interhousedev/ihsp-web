"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons } from "@ihsp/ui"
import { isAnswered, sectionsOf } from "../lib/visibility"
import { useProfileText } from "../lib/use-profile-text"
import type { AnswerValue, Answers, Question } from "../types"

function useDisplay() {
  const t = useT("profile")
  const text = useProfileText()
  return (question: Question, value: AnswerValue | undefined): string => {
    if (!isAnswered(value)) return t("notAnswered")
    if (typeof value === "boolean") return t(value ? "yes" : "no")
    if (Array.isArray(value)) {
      return (value as unknown[]).map((item) => text.option(question.id, String(item))).join(", ")
    }
    return typeof value === "string" ? text.option(question.id, value) : String(value)
  }
}

/** All visible answers by section with an Edit link; Finish needs every required answer. */
export function ReviewScreen({
  questions,
  answers,
  missing,
  busy,
  onEdit,
  onFinish,
}: {
  questions: Question[]
  answers: Answers
  missing: string[]
  busy: boolean
  onEdit: (id: string) => void
  onFinish: () => void
}) {
  const t = useT("profile")
  const text = useProfileText()
  const display = useDisplay()
  return (
    <div className="flex flex-col gap-6">
      {missing.length > 0 ? (
        <Alert>
          <Icons.alertCircle aria-hidden />
          <AlertDescription>{t("missing", { count: missing.length })}</AlertDescription>
        </Alert>
      ) : null}
      {sectionsOf(questions).map((section) => (
        <section key={section} aria-labelledby={`review-${section}`} className="flex flex-col gap-2">
          <h2 id={`review-${section}`} className="text-base font-semibold">
            {text.section(section)}
          </h2>
          <dl className="divide-hairline flex flex-col divide-y rounded-card border">
            {questions
              .filter((question) => question.section === section)
              .map((question) => (
                <div key={question.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground text-xs">{text.label(question.id)}</dt>
                    <dd className="text-sm break-words">{display(question, answers[question.id])}</dd>
                  </div>
                  {question.kind === "locked" ? null : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(question.id)}>
                      {t("edit")}
                      <span className="sr-only"> {text.label(question.id)}</span>
                    </Button>
                  )}
                </div>
              ))}
          </dl>
        </section>
      ))}
      <Button type="button" disabled={missing.length > 0 || busy} onClick={onFinish} className="self-end">
        {t("finish")}
      </Button>
    </div>
  )
}

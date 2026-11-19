"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Skeleton, StateView, cn } from "@ihsp/ui"
import { useState } from "react"
import { QuestionField, type StepAnswers, type StepValue } from "../../../components/stepper"
import { useAlgorithm } from "../hooks"
import { mergeValues, SECTION_OF } from "../mapping"
import { tagLabel } from "../questions"
import { TagChips } from "./tag-chips"

const SECTIONS = ["vibe", "academics", "financials"] as const

export type AlgorithmPanelProps = {
  className?: string
  /** Sections open at first; defaults to the first one. */
  defaultOpen?: ("vibe" | "academics" | "financials")[]
  /** Called after each saved answer (the swipe page refreshes its deck). */
  onSaved?: () => void
}

/**
 * "Your Algorithm": the tags the student's answers produced and a compact accordion of the same 13 questions, each
 * saved with PUT /v1/admission/preferences as soon as it changes. Self-contained: it loads and saves by itself.
 */
export function AlgorithmPanel({ className, defaultOpen = ["vibe"], onSaved }: AlgorithmPanelProps) {
  const { t, preferences, quiz, sources, questions, save } = useAlgorithm()
  const [failed, setFailed] = useState(false)
  if (preferences.isError) {
    return <StateView state="error" error={preferences.error} onRetry={() => void preferences.refetch()} />
  }
  if (!preferences.data) return <Skeleton className={cn("h-64 w-full", className)} />
  const values: StepAnswers = mergeValues(quiz.data?.answers, preferences.data.answers)

  function change(field: string, value: StepValue) {
    setFailed(false)
    save.mutate({ field, value }, { onSuccess: () => onSaved?.(), onError: () => setFailed(true) })
  }

  return (
    <section aria-label={t("panel.title")} className={cn("flex flex-col gap-4", className)}>
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("panel.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("panel.tagsHint")}</p>
        {preferences.data.tags.length > 0 ? (
          <TagChips
            tags={preferences.data.tags.map((tag) => ({ key: tag, label: tagLabel(tag, (key) => t(key), sources) }))}
          />
        ) : (
          <p className="text-muted-foreground text-sm">{t("panel.noTags")}</p>
        )}
      </header>
      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          {t("saveError")}
        </p>
      ) : null}
      <Accordion defaultValue={defaultOpen} multiple>
        {SECTIONS.map((section) => (
          <AccordionItem key={section} value={section}>
            <AccordionTrigger>{t(`sections.${section}`)}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-5">
                {questions
                  .filter((question) => SECTION_OF[question.id as keyof typeof SECTION_OF] === section)
                  .map((question) => (
                    <QuestionField
                      key={question.id}
                      question={question}
                      compact
                      value={values[question.id] ?? ""}
                      disabled={save.isPending}
                      onChange={(value) => change(question.id, value)}
                    />
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

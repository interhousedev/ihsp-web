"use client"

import type { ExerciseContent, ExerciseQuestion, ExerciseSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { useRef, useState } from "react"
import { StudioMarkdown } from "../../openui"
import { EssayField } from "./exercise/essay-field"
import {
  gradeExercise,
  gradeQuestion,
  readProgress,
  type ExerciseAnswer,
  type ExerciseAnswers,
} from "./exercise/grading"
import { QuestionInput } from "./exercise/question-input"
import { useSharedViewer } from "./shared-viewer"
import { useDebouncedProgress } from "./use-debounced-progress"
import { useNarrow } from "./use-narrow"
import { ViewerEmpty } from "./viewer-empty"
import type { ViewerProps } from "./viewer-props"

/** Below this pane width the passage goes above the questions and can be folded away. */
const TWO_COLUMNS_MIN = 880

/**
 * A practice exercise (IELTS, SAT, AP style): per section the passage on the left and its questions on the right
 * (stacked on narrow panes, the passage collapsible). Submit grades the objective questions in the browser with the
 * backend's rules and shows the explanations; an essay shows its rubric and can get AI feedback on request.
 */
export function ExerciseViewer({ notebookId, artifact }: ViewerProps<"exercise">) {
  const content = artifact.content
  if (!content) return <ViewerEmpty />
  return (
    <ExerciseBody notebookId={notebookId} artifactId={artifact.id} content={content} saved={artifact.progress_state} />
  )
}

type BodyProps = { notebookId: string; artifactId: string; content: ExerciseContent; saved: unknown }

function ExerciseBody({ notebookId, artifactId, content, saved }: BodyProps) {
  const t = useT("notebooks.exercise")
  const shared = useSharedViewer()
  const save = useDebouncedProgress(notebookId, artifactId)
  const [progress, setProgress] = useState(() => readProgress(saved))
  const ref = useRef<HTMLElement>(null)
  const narrow = useNarrow(ref, TWO_COLUMNS_MIN)

  const update = (answers: ExerciseAnswers, submitted: boolean) => {
    const next = { answers, submitted }
    setProgress(next)
    if (!shared) save(next)
  }
  const answer = (id: string, value: ExerciseAnswer) => update({ ...progress.answers, [id]: value }, progress.submitted)
  const score = gradeExercise(content, progress.answers)

  return (
    <section ref={ref} aria-label={t("region")} className="flex w-full flex-col gap-6 p-4 md:p-6">
      {content.instructions ? <p className="text-sm">{content.instructions}</p> : null}
      {content.sections.map((section, index) => (
        <SectionView
          key={section.id}
          section={section}
          index={index}
          narrow={narrow}
          answers={progress.answers}
          submitted={progress.submitted}
          onAnswer={answer}
          renderEssay={(question) => (
            <EssayField
              notebookId={notebookId}
              artifactId={artifactId}
              question={question}
              value={typeof progress.answers[question.id] === "string" ? (progress.answers[question.id] as string) : ""}
              submitted={progress.submitted}
              shared={shared}
              onChange={(value) => answer(question.id, value)}
            />
          )}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        {progress.submitted ? (
          <>
            {score.possible > 0 ? (
              <p role="status" className="text-lg font-semibold tabular-nums">
                {t("score", { earned: score.earned, possible: score.possible })}
              </p>
            ) : null}
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => update({}, false)}>
              {t("retry")}
            </Button>
          </>
        ) : (
          <Button type="button" className="min-h-11 md:min-h-8" onClick={() => update(progress.answers, true)}>
            {t("submit")}
          </Button>
        )}
      </div>
    </section>
  )
}

type SectionProps = {
  section: ExerciseSection
  index: number
  narrow: boolean
  answers: ExerciseAnswers
  submitted: boolean
  onAnswer: (id: string, value: ExerciseAnswer) => void
  renderEssay: (question: ExerciseQuestion) => React.ReactNode
}

function SectionView({ section, index, narrow, answers, submitted, onAnswer, renderEssay }: SectionProps) {
  const t = useT("notebooks.exercise")
  const title = section.title || t("part", { n: index + 1 })
  const passage = <StudioMarkdown className="text-base leading-relaxed">{section.stimulus}</StudioMarkdown>
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className={cn("grid gap-6", narrow ? "grid-cols-1" : "grid-cols-2")}>
        {narrow ? (
          <details open className="bg-muted/30 rounded-lg border p-3">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{t("passage")}</summary>
            {passage}
          </details>
        ) : (
          <div aria-label={t("passage")} role="region" className="max-h-[75vh] overflow-y-auto rounded-lg border p-4">
            {passage}
          </div>
        )}
        <ol className="flex min-w-0 flex-col gap-6" aria-label={t("questions")}>
          {section.questions.map((question) => (
            <QuestionBlock
              key={question.id}
              question={question}
              answer={answers[question.id]}
              submitted={submitted}
              onAnswer={(value) => onAnswer(question.id, value)}
              essay={question.type === "free_response" ? renderEssay(question) : null}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}

type BlockProps = {
  question: ExerciseQuestion
  answer: ExerciseAnswer | undefined
  submitted: boolean
  onAnswer: (value: ExerciseAnswer) => void
  essay: React.ReactNode
}

function QuestionBlock({ question, answer, submitted, onAnswer, essay }: BlockProps) {
  const t = useT("notebooks.exercise")
  const grade = gradeQuestion(question, answer)
  const graded = submitted && grade.possible > 0
  const right = grade.earned === grade.possible
  return (
    <li className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        <span className="tabular-nums">{question.number}.</span> {question.prompt}
      </p>
      {question.type === "free_response" ? (
        <p className="text-muted-foreground text-xs">
          {t("essayTask", { min: question.min_words, minutes: question.time_minutes })}
        </p>
      ) : null}
      {essay ?? <QuestionInput question={question} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {graded ? (
        <div className="flex flex-col gap-1 text-sm">
          <p className={right ? "font-medium text-emerald-700 dark:text-emerald-300" : "text-destructive font-medium"}>
            {right ? t("correct") : t("wrong", { earned: grade.earned, possible: grade.possible })}
          </p>
          {question.explanation ? <p className="text-muted-foreground">{question.explanation}</p> : null}
        </div>
      ) : null}
    </li>
  )
}

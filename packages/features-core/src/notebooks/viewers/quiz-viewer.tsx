"use client"

import type { QuizContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { ExplainPanel } from "./explain-panel"
import { ViewerProgress } from "./progress-bar"
import { QuizNav } from "./quiz/quiz-nav"
import { QuizResults } from "./quiz/quiz-results"
import { QuizReview } from "./quiz/quiz-review"
import { summarize } from "./quiz/quiz-state"
import { QuestionView } from "./quiz/question-view"
import { useQuiz } from "./quiz/use-quiz"
import { anchorFromRefs } from "./refs-anchor"
import { useSharedViewer } from "./shared-viewer"
import { useExplain } from "./use-explain"
import { ViewerEmpty } from "./viewer-empty"
import type { ViewerProps } from "./viewer-props"

/**
 * A quiz, one question per screen: instant feedback for single choice and
 * true/false, Check for multiple choice, hints, Explain through the notebook chat, results with a review, and
 * retries of all or only the wrong questions. Answers stay in the browser; the progress is saved with the artifact.
 */
export function QuizViewer({ notebookId, artifact }: ViewerProps<"quiz">) {
  const content = artifact.content
  if (!content) return <ViewerEmpty />
  return <QuizBody notebookId={notebookId} artifact={artifact} content={content} />
}

function QuizBody({ notebookId, artifact, content }: ViewerProps<"quiz"> & { content: QuizContent }) {
  const t = useT("notebooks")
  const explain = useExplain(notebookId)
  const shared = useSharedViewer()
  const { state, round, actions } = useQuiz(notebookId, artifact.id, content.questions, artifact.progress_state)
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [hinted, setHinted] = useState<ReadonlySet<string>>(() => new Set())
  const [reviewing, setReviewing] = useState(false)

  const question = round[state.current]
  if (!question) {
    return <p className="text-muted-foreground p-8 text-center text-sm">{t("viewers.quiz.empty")}</p>
  }

  const counter = t("quiz.progress", {
    current: state.current + 1,
    total: round.length,
  })
  const isLast = state.current >= round.length - 1
  const committed = state.answers[question.id]
  const draft = drafts[question.id] ?? []

  const choose = (optionId: string) => {
    if (question.type !== "multiple") {
      actions.answer(question.id, [optionId])
      return
    }
    setDrafts((current) => {
      const picked = current[question.id] ?? []
      const next = picked.includes(optionId) ? picked.filter((id) => id !== optionId) : [...picked, optionId]
      return { ...current, [question.id]: next }
    })
  }
  const next = () => (isLast ? actions.finish() : actions.go(state.current + 1))
  const restart = (retry: () => void) => {
    setReviewing(false)
    setDrafts({})
    retry()
  }

  return (
    <section aria-label={t("viewers.quiz.region")} className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 md:p-6">
      {state.submitted ? (
        reviewing ? (
          <QuizReview
            questions={round}
            answers={state.answers}
            refsIndex={artifact.refs_index}
            onBack={() => setReviewing(false)}
          />
        ) : (
          <QuizResults
            summary={summarize(round, state.answers)}
            onReview={() => setReviewing(true)}
            onRetryAll={() => restart(actions.retryAll)}
            onRetryWrong={() => restart(actions.retryWrong)}
          />
        )
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm tabular-nums">{counter}</p>
            <ViewerProgress value={state.current + 1} max={round.length} label={counter} />
          </div>
          <QuestionView
            key={question.id}
            question={question}
            refsIndex={artifact.refs_index}
            committed={committed}
            draft={draft}
            hintShown={hinted.has(question.id)}
            onChoose={choose}
            onCheck={() => actions.answer(question.id, draft)}
            onHint={() => setHinted((current) => new Set(current).add(question.id))}
            onExplain={
              shared
                ? undefined
                : () =>
                    explain.start({
                      text: t("viewers.quiz.explainPrompt", {
                        text: question.prompt,
                      }),
                      heading: question.prompt,
                      anchor: anchorFromRefs(question.refs, artifact.refs_index),
                    })
            }
          />
          <QuizNav
            canPrevious={state.current > 0}
            answered={committed !== undefined}
            isLast={isLast}
            onPrevious={() => actions.go(state.current - 1)}
            onSkip={next}
            onNext={next}
          />
        </>
      )}
      <ExplainPanel explain={explain} />
    </section>
  )
}

"use client"

import type { QuizQuestion } from "@ihsp/api"
import { useCallback, useMemo, useRef, useState } from "react"
import { useDebouncedProgress } from "../use-debounced-progress"
import {
  answerQuestion,
  finish,
  goTo,
  parseQuiz,
  retryAll,
  retryWrong,
  roundQuestions,
  type QuizState,
} from "./quiz-state"

export type QuizActions = {
  answer: (questionId: string, chosen: readonly string[]) => void
  go: (index: number) => void
  finish: () => void
  retryAll: () => void
  retryWrong: () => void
}

/**
 * The state of a quiz: restored from `artifact.progress_state`, changed through `actions`, and saved (debounced) on
 * every change.
 */
export function useQuiz(
  notebookId: string,
  artifactId: string,
  questions: readonly QuizQuestion[],
  progressState: unknown,
): { state: QuizState; round: QuizQuestion[]; actions: QuizActions } {
  const save = useDebouncedProgress(notebookId, artifactId)
  const [state, setState] = useState(() => parseQuiz(progressState, questions))
  const latest = useRef(state)

  const apply = useCallback(
    (change: (current: QuizState) => QuizState) => {
      const next = change(latest.current)
      if (next === latest.current) return
      latest.current = next
      setState(next)
      save(next)
    },
    [save],
  )

  const actions = useMemo<QuizActions>(
    () => ({
      answer: (questionId, chosen) => apply((current) => answerQuestion(current, questionId, chosen)),
      go: (index) => apply((current) => (current.current === index ? current : goTo(current, index, questions))),
      finish: () => apply(finish),
      retryAll: () => apply(() => retryAll()),
      retryWrong: () => apply((current) => retryWrong(current, questions)),
    }),
    [apply, questions],
  )

  const round = useMemo(() => roundQuestions(state, questions), [state, questions])
  return { state, round, actions }
}

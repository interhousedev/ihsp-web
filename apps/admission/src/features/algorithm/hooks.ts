"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import type { StepValue } from "../../components/stepper"
import { fetchQuiz, putQuiz, quizKey, type QuizAnswers } from "../profile/details-api"
import { careerMajorsQuery, pick } from "../career/api"
import { useFacets } from "../chooser/hooks"
import { preferencesKey, preferencesQuery, putPreferences } from "./api"
import { answerToPayload, mergeValues } from "./mapping"
import { firstUnanswered } from "../../components/stepper"
import { buildQuestions, type QuestionSources } from "./questions"

/** Stored preferences, the question definitions (majors and regions come from the API) and the saver. */
export function useAlgorithm() {
  const t = useT("prefs")
  const locale = useLocale()
  const client = useQueryClient()
  const preferences = useQuery(preferencesQuery())
  const quiz = useQuery({ queryKey: quizKey("algorithm"), queryFn: () => fetchQuiz("algorithm") })
  const majors = useQuery(careerMajorsQuery())
  const { facets } = useFacets()

  const sources = useMemo<QuestionSources>(
    () => ({
      majors: (majors.data?.items ?? [])
        .filter((major) => major.active)
        .map((major) => ({ value: major.code, label: pick(major.name, locale) })),
      regions: facets?.countries ?? [],
      regionName: (region) =>
        /^[a-z]{2}$/i.test(region)
          ? (new Intl.DisplayNames([locale], { type: "region" }).of(region.toUpperCase()) ?? region)
          : region,
    }),
    [majors.data, facets, locale],
  )
  const questions = useMemo(() => buildQuestions((key) => t(key), sources), [t, sources])

  const save = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: StepValue }) => {
      const payload = answerToPayload(field, value)
      const prefs = Object.keys(payload).length > 0 ? await putPreferences(payload) : preferences.data
      const stored = client.getQueryData<QuizAnswers>(quizKey("algorithm"))?.answers ?? {}
      const answers = { ...stored }
      if (value === undefined || value === "") delete answers[field]
      else answers[field] = value
      // The stored quiz mirrors every answer, so the answers survive a reload and mark the quiz as done.
      const merged = mergeValues(answers, prefs?.answers ?? {})
      const completed = firstUnanswered(questions, merged) === questions.length
      const savedQuiz = await putQuiz("algorithm", { answers, completed })
      return { prefs, savedQuiz }
    },
    onSuccess: ({ prefs, savedQuiz }) => {
      if (prefs) client.setQueryData(preferencesKey, prefs)
      client.setQueryData(quizKey("algorithm"), savedQuiz)
      void client.invalidateQueries({ queryKey: ["admission", "profile", "details"] })
      // The deck and the chances depend on the preferences.
      void client.invalidateQueries({ queryKey: ["admission", "matches"] })
    },
  })

  return { t, preferences, quiz, majors, sources, questions, save }
}

/** Whether the algorithm quiz is complete (the discover page shows the quiz first until it is). */
export function useAlgorithmDone() {
  const quiz = useQuery({ queryKey: quizKey("algorithm"), queryFn: () => fetchQuiz("algorithm") })
  return { done: quiz.data?.completed === true, isLoading: quiz.isLoading, isError: quiz.isError }
}

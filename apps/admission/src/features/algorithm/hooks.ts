"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import type { StepValue } from "../../components/stepper"
import { careerMajorsQuery, pick } from "../career/api"
import { useFacets } from "../chooser/hooks"
import { preferencesKey, preferencesQuery, putPreferences } from "./api"
import { answerToPayload } from "./mapping"
import { buildQuestions, type QuestionSources } from "./questions"

/** Stored preferences, the question definitions (majors and regions come from the API) and the saver. */
export function useAlgorithm() {
  const t = useT("prefs")
  const locale = useLocale()
  const client = useQueryClient()
  const preferences = useQuery(preferencesQuery())
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
    mutationFn: ({ field, value }: { field: string; value: StepValue }) =>
      putPreferences(answerToPayload(field, value)),
    onSuccess: (data) => {
      client.setQueryData(preferencesKey, data)
      // The deck and the chances depend on the preferences.
      void client.invalidateQueries({ queryKey: ["admission", "matches"] })
    },
  })

  return { t, preferences, majors, sources, questions, save }
}

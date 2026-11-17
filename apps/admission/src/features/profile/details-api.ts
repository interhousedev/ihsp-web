"use client"

// `/v1/admission/me/profile/details`, `/me/profile/interests` and `/me/quizzes/{quiz}`: completion, interests and
// the saved answers of the career and algorithm quizzes.

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type Interests = { fields: string[]; services: string[] }
export type MissingDetail = { key: string; label: string }
export type ProfileDetails = {
  interests: Interests
  three_words: string[]
  completion_percent: number
  missing: MissingDetail[]
}
export type QuizName = "career" | "algorithm"
export type QuizAnswer = string | number | boolean | string[]
export type QuizAnswers = { answers: Record<string, QuizAnswer>; completed: boolean }

/** The vocabularies of the backend (`domain/profile_details.py`); the labels are messages `profilePage.field.<key>`. */
export const INTEREST_FIELDS = [
  "writing",
  "art_design",
  "music_singing",
  "music_instrumental",
  "photography",
  "theater",
  "filmmaking",
  "leadership",
  "public_speaking",
  "advocacy",
  "entrepreneurship",
  "science_research",
  "technology",
  "engineering",
  "aviation",
  "automotive",
  "foreign_languages",
  "foreign_culture",
  "athletics",
] as const
export const SERVICE_INTERESTS = [
  "community_service",
  "volunteering",
  "tutoring",
  "environment",
  "healthcare",
  "animal_welfare",
  "child_elder_care",
  "civic_political",
] as const

export const detailsKey = ["admission", "profile", "details"] as const
export const quizKey = (quiz: QuizName) => ["admission", "quiz", quiz] as const

export const fetchDetails = () => getApiClient().get<ProfileDetails>("/v1/admission/me/profile/details")
export const putInterests = (interests: Interests) =>
  getApiClient().put<Interests>("/v1/admission/me/profile/interests", interests)
export const fetchQuiz = (quiz: QuizName) => getApiClient().get<QuizAnswers>(`/v1/admission/me/quizzes/${quiz}`)
export const putQuiz = (quiz: QuizName, body: QuizAnswers) =>
  getApiClient().put<QuizAnswers>(`/v1/admission/me/quizzes/${quiz}`, body)

export const useProfileDetails = () => useQuery({ queryKey: detailsKey, queryFn: fetchDetails })
export const useQuiz = (quiz: QuizName) => useQuery({ queryKey: quizKey(quiz), queryFn: () => fetchQuiz(quiz) })

/** Saves the interests and refreshes the completion. */
export function useSaveInterests() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: putInterests,
    onSuccess: (saved) => {
      client.setQueryData<ProfileDetails>(detailsKey, (current) =>
        current ? { ...current, interests: saved } : current,
      )
      void client.invalidateQueries({ queryKey: detailsKey })
    },
  })
}

/** Saves one quiz; the cache holds the stored answers and the completion is refreshed. */
export function useSaveQuiz(quiz: QuizName) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: QuizAnswers) => putQuiz(quiz, body),
    // The wizard reads its answers from the cache, so the new answer shows before the server confirms it.
    onMutate: (body) => client.setQueryData(quizKey(quiz), body),
    onSuccess: (saved) => {
      client.setQueryData(quizKey(quiz), saved)
      void client.invalidateQueries({ queryKey: detailsKey })
    },
  })
}

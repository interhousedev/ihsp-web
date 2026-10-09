"use client"

import {
  getMeAssessmentsQuery,
  getMeProfileQuery,
  getMeSubjectQuery,
  getMeSubjectsQuery,
  keys,
  postMeAssessment,
  type AssessmentItem,
  type AssessmentProposalBody,
} from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { addDays, todayIso } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** How far back and ahead the exams list reaches: a past semester's controls are no use, a year ahead is plenty. */
export const PAST_DAYS = 120
export const AHEAD_DAYS = 365

/** The student's controls in the wide range of the exams list; the prep page reads the same query (and its cache). */
export function useExams() {
  const today = todayIso()
  return useQuery(getMeAssessmentsQuery({ from: addDays(today, -PAST_DAYS), to: addDays(today, AHEAD_DAYS) }))
}

/** Controls from `today` to `today` plus `days` (the Today card); a week running now counts. */
export function useExamsAhead(today: string, days: number) {
  return useQuery(getMeAssessmentsQuery({ from: today, to: addDays(today, days) }))
}

/** A head student is the person the group's profile names as head student (the settings page checks the same way). */
export function useIsHeadStudent(): boolean {
  const { session } = useSession()
  const profile = useQuery(getMeProfileQuery())
  return session !== null && profile.data?.head_student?.id === session.user.id
}

/** The student's subjects, for the "Suggest a date" form. */
export function useSubjectChoices(enabled: boolean) {
  return useQuery({ ...getMeSubjectsQuery(), enabled })
}

/** `POST /v1/me/assessments`: a head student's suggestion; the new tentative control shows up in every list. */
export function useProposeExam() {
  const queryClient = useQueryClient()
  return useMutation<AssessmentItem, unknown, AssessmentProposalBody>({
    mutationFn: (body) => postMeAssessment(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.me.assessments() }),
  })
}

/** Lessons and materials of a subject (current semester) for "Lesson materials since the previous control". */
export function useSubjectMaterials(subjectId: string) {
  return useQuery(getMeSubjectQuery(subjectId))
}

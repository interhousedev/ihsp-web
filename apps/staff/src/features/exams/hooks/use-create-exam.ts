"use client"

import { keys, postStaffAssessment, type AssessmentCreateBody, type StaffAssessmentItem } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** `POST /v1/staff/assessments` (a teacher sets the control date of a subject in a group): the lists refresh. */
export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation<StaffAssessmentItem, unknown, AssessmentCreateBody>({
    mutationFn: (body) => postStaffAssessment(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.staff.assessments() }),
  })
}

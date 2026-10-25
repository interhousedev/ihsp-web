"use client"

import { keys, patchStaffAssessment, type AssessmentPatchBody, type StaffAssessmentItem } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * `PATCH /v1/staff/assessments/{id}`: edit a control, confirm a suggestion (`status: "planned"`) or dismiss and
 * cancel it (`status: "cancelled"`). The lists refresh before the mutation is done.
 */
export function useUpdateExam() {
  const queryClient = useQueryClient()
  return useMutation<StaffAssessmentItem, unknown, { id: string; body: AssessmentPatchBody }>({
    mutationFn: ({ id, body }) => patchStaffAssessment(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.staff.assessments() }),
  })
}

"use client"

import { patchAdminAssessment, type StaffAssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { EXAMS_QUERY_PREFIX } from "../utils/exam-filters"

/** Confirms a date as it is (`status: "planned"`); a failure shows as a toast. */
export function useConfirmExam() {
  const t = useT("exams")
  return useAdminMutation({
    mutationFn: (item: StaffAssessmentItem) => patchAdminAssessment(item.id, { status: "planned" }),
    invalidate: [EXAMS_QUERY_PREFIX],
    success: t("confirmed"),
  })
}

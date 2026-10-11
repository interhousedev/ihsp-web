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

/** Confirms every selected date that is still "not confirmed" (`tentative`), one request each; the toast counts them. */
export function useConfirmExams() {
  const t = useT("shared.selection")
  return useAdminMutation<StaffAssessmentItem[], number>({
    mutationFn: async (items) => {
      const open = items.filter((item) => item.has_date && item.status === "tentative")
      for (const item of open) await patchAdminAssessment(item.id, { status: "planned" })
      return open.length
    },
    invalidate: [EXAMS_QUERY_PREFIX],
    success: (count) => t("confirmSelectedDone", { count }),
  })
}

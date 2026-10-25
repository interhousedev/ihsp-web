"use client"

import { adminFeedbackKeys, patchAdminFeedback, type AdminFeedbackDetail, type AdminFeedbackStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { SelectField } from "../../shared/components/select-field"

const STATUSES: readonly AdminFeedbackStatus[] = ["new", "in_review", "planned", "done", "rejected"]

/** Changes the status of one feedback item (PATCH); the detail and the list refresh after it. */
export function FeedbackStatusSelect({ item }: { item: AdminFeedbackDetail }) {
  const t = useT("callForImprovements")
  const change = useAdminMutation({
    mutationFn: (status: AdminFeedbackStatus) => patchAdminFeedback(item.id, { status }),
    invalidate: [adminFeedbackKeys.all()],
    success: t("detail.statusSaved"),
  })
  return (
    <SelectField
      id="feedback-status"
      aria-label={t("detail.statusLabel")}
      value={item.status}
      disabled={change.isPending}
      className="w-full max-w-xs"
      options={STATUSES.map((value) => ({ value, label: t(`status.${value}`) }))}
      onChange={(value) => change.mutate(value as AdminFeedbackStatus)}
    />
  )
}

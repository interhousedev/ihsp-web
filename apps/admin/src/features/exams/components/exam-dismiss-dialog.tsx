"use client"

import { patchAdminAssessment, type StaffAssessmentItem } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, ConfirmDialog } from "@ihsp/ui"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { audienceLabel } from "../../shared/utils/names"
import { EXAMS_QUERY_PREFIX } from "../utils/exam-filters"

/**
 * Asks before a date is dismissed (not confirmed yet) or an exam is cancelled (planned). Both set the status to
 * `cancelled`; the row stays on the server, so a dismissed EMIS suggestion stays dismissed.
 */
export function ExamDismissDialog({ item, onClose }: { item: StaffAssessmentItem; onClose: () => void }) {
  const t = useT("exams.dismiss")
  const tActions = useT("exams.actions")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const tentative = item.status === "tentative"
  const dismiss = useAdminMutation({
    mutationFn: () => patchAdminAssessment(item.id, { status: "cancelled" }),
    invalidate: [EXAMS_QUERY_PREFIX],
    success: tentative ? t("dismissed") : t("cancelled"),
    onSuccess: onClose,
    inlineError: true,
  })
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={tentative ? t("dismissTitle") : t("cancelTitle")}
      description={t("description", {
        subject: item.subject.name,
        date: f.date(item.date),
        groups: audienceLabel(item.audience),
      })}
      confirmLabel={tentative ? tActions("dismiss") : tActions("cancel")}
      cancelLabel={t("keep")}
      destructive
      loading={dismiss.isPending}
      onConfirm={() => dismiss.mutate()}
    >
      {dismiss.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage(dismiss.error)}</AlertDescription>
        </Alert>
      ) : null}
    </ConfirmDialog>
  )
}

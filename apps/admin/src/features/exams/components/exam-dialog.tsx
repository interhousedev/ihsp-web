"use client"

import {
  patchAdminAssessment,
  postAdminAssessment,
  type AssessmentPatchBody,
  type StaffAssessmentItem,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { useControlPeriods } from "../../shared/hooks/use-control-periods"
import { audienceLabel } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { EXAMS_QUERY_PREFIX } from "../utils/exam-filters"
import {
  emptyExamForm,
  examCreateBody,
  examPatchBody,
  examToForm,
  setDateForm,
  validateExam,
  type ExamForm,
} from "../utils/exam-form"
import { ExamFormFields } from "./exam-form-fields"

/** What the dialog does: add an exam, change one, or give a control week without a date its date. */
export type ExamDialogMode = "create" | "edit" | "setDate"

function startForm(mode: ExamDialogMode, item: StaffAssessmentItem | null): ExamForm {
  if (!item || mode === "create") return emptyExamForm()
  return mode === "setDate" ? setDateForm(item) : examToForm(item)
}

/** A date nobody confirmed is confirmed by saving it, even when nothing was changed. */
function patchFor(form: ExamForm, item: StaffAssessmentItem): AssessmentPatchBody {
  const body = examPatchBody(form, item)
  if (item.status === "tentative" && Object.keys(body).length === 0) body.status = "planned"
  return body
}

/**
 * Add an exam (`create`), change one (`edit`) or set the date of a subject for a control week (`setDate`, UF-ADM-10).
 * The dialog is mounted for one use: its form starts from `item` and is thrown away when it closes.
 */
export function ExamDialog({
  mode,
  item,
  onClose,
}: {
  mode: ExamDialogMode
  item: StaffAssessmentItem | null
  onClose: () => void
}) {
  const t = useT("exams.dialog")
  const tIssues = useT("exams.dialog.issues")
  const errorMessage = useErrorMessage()
  const controlLabel = useControlLabel()
  const periods = useControlPeriods()
  const [form, setForm] = useState<ExamForm>(() => startForm(mode, item))
  const [showIssues, setShowIssues] = useState(false)

  const issues = validateExam(form)
  const patch = mode === "edit" && item ? patchFor(form, item) : null
  const subject = item?.subject.name ?? ""
  const groups = item ? audienceLabel(item.audience) : ""
  const save = useAdminMutation({
    mutationFn: () =>
      item && patch ? patchAdminAssessment(item.id, patch) : postAdminAssessment(examCreateBody(form)),
    invalidate: [EXAMS_QUERY_PREFIX],
    success: mode === "create" ? t("created") : mode === "edit" ? t("saved") : t("dateSet"),
    onSuccess: onClose,
    inlineError: true,
  })

  const title =
    mode === "create"
      ? t("createTitle")
      : mode === "edit"
        ? t("editTitle", { subject })
        : t("setDateTitle", { subject })
  const description =
    mode === "setDate"
      ? t("setDateDescription", { control: item?.control ? controlLabel(item.control) : "", groups })
      : null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <form
          className="grid gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (issues.length > 0) {
              setShowIssues(true)
              return
            }
            // Nothing was changed: there is nothing to send.
            if (patch && Object.keys(patch).length === 0) onClose()
            else save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <ExamFormFields
            form={form}
            onChange={setForm}
            fixedSubject={mode === "create" ? null : subject}
            fixedAudience={mode === "setDate" ? groups : null}
            periods={periods}
          />

          {showIssues && issues.length > 0 ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                <ul className="list-disc ps-4">
                  {issues.map((issue) => (
                    <li key={issue}>{tIssues(issue)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
          {save.isError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorMessage(save.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={save.isPending}>
              {mode === "create" ? t("create") : mode === "edit" ? t("save") : t("setDate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

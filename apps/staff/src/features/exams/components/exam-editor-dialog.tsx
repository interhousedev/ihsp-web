"use client"

import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ihsp/ui"
import type { ControlPeriods } from "../utils/controls"
import type { EditorState } from "../utils/editor-state"
import type { SubjectChoice, TeachingGroup } from "../utils/teaching"
import { ExamForm } from "./exam-form"

/** The dialog around the exam form: Add exam, Set exam date, Edit exam or Edit and confirm (a suggestion). */
export function ExamEditorDialog({
  state,
  group,
  subjects,
  periods,
  onClose,
}: {
  state: EditorState | null
  group: TeachingGroup
  subjects: readonly SubjectChoice[]
  periods: ControlPeriods
  onClose: () => void
}) {
  const t = useT("exams.editor")
  const title =
    state === null
      ? ""
      : state.mode === "add"
        ? t("titleAdd")
        : state.mode === "setDate"
          ? t("titleSetDate")
          : state.item.status === "tentative"
            ? t("titleConfirm")
            : t("titleEdit")

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("group", { name: group.name })}</DialogDescription>
        </DialogHeader>
        {state ? (
          <ExamForm
            key={state.mode === "edit" ? state.item.id : state.mode}
            group={group}
            state={state}
            subjects={subjects}
            periods={periods}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

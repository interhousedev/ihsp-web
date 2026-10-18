"use client"

import { useT } from "@ihsp/i18n"
import { Checkbox, Dropdown } from "@ihsp/ui"
import { useId } from "react"
import { useCourseSteps } from "../../api/use-course-workspace"
import type { FormProps } from "./form-props"
import { LESSON_LENGTHS, type LessonDraftState } from "./form-state"
import { SegmentedField } from "./segmented-field"

/** Lesson draft: which step it is written for (or a new one), how long it is and whether to add a test and cards. */
export function LessonDraftForm({ state, onChange, notebookId }: FormProps<LessonDraftState> & { notebookId: string }) {
  const t = useT("notebooks.opt")
  const selectId = useId()
  const outline = useCourseSteps(notebookId)
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium">
          {t("lessonStep.label")}
        </label>
        <Dropdown
          id={selectId}
          className="min-h-11 w-full md:min-h-8"
          value={state.stepId}
          onValueChange={(value) => onChange({ ...state, stepId: value })}
          options={[
            { value: "new", label: t("lessonStep.new") },
            ...(outline.data?.sections ?? []).flatMap((section) =>
              section.steps.map((step) => ({ value: step.id, label: `${section.title} · ${step.title}` })),
            ),
          ]}
        />
      </div>
      <SegmentedField
        label={t("lessonLength.label")}
        value={state.length}
        options={LESSON_LENGTHS.map((value) => ({ value, label: t(`lessonLength.${value}`) }))}
        onChange={(length) => onChange({ ...state, length })}
      />
      <div className="flex flex-col gap-1">
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Checkbox
            checked={state.includeTest}
            onCheckedChange={(checked) => onChange({ ...state, includeTest: checked === true })}
          />
          <span>{t("includeTest.label")}</span>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Checkbox
            checked={state.includeFlashcards}
            onCheckedChange={(checked) => onChange({ ...state, includeFlashcards: checked === true })}
          />
          <span>{t("includeCards.label")}</span>
        </label>
      </div>
    </>
  )
}

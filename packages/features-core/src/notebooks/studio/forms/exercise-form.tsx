"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label } from "@ihsp/ui"
import { useId } from "react"
import type { FormProps } from "./form-props"
import {
  EXERCISE_COUNT_LIMITS,
  EXERCISE_EXAMS,
  EXERCISE_MODES,
  EXERCISE_SKILLS,
  LEVELS,
  exactCount,
  type ExerciseState,
} from "./form-state"
import { SegmentedField } from "./segmented-field"

/** Exercise: exam style, skill, practice mode, number of questions (empty = the exam's default) and difficulty. */
export function ExerciseForm({ state, onChange }: FormProps<ExerciseState>) {
  const t = useT("notebooks.opt")
  const countId = useId()
  const hintId = useId()
  const invalid = state.count.trim() !== "" && exactCount(state.count, EXERCISE_COUNT_LIMITS) === null

  return (
    <>
      <SegmentedField
        label={t("exam.label")}
        value={state.exam}
        options={EXERCISE_EXAMS.map((value) => ({ value, label: t(`exam.${value}`) }))}
        onChange={(exam) => onChange({ ...state, exam })}
      />
      <SegmentedField
        label={t("skill.label")}
        value={state.skill}
        options={EXERCISE_SKILLS.map((value) => ({ value, label: t(`skill.${value}`) }))}
        onChange={(skill) => onChange({ ...state, skill })}
      />
      <SegmentedField
        label={t("exerciseMode.label")}
        value={state.mode}
        options={EXERCISE_MODES.map((value) => ({ value, label: t(`exerciseMode.${value}`) }))}
        onChange={(mode) => onChange({ ...state, mode })}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={countId}>{t("count.customQuestions")}</Label>
        <Input
          id={countId}
          type="number"
          inputMode="numeric"
          min={EXERCISE_COUNT_LIMITS.min}
          max={EXERCISE_COUNT_LIMITS.max}
          step={1}
          value={state.count}
          placeholder={t("exerciseCount.auto")}
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          className="min-h-11 w-28 md:min-h-8"
          onChange={(event) => onChange({ ...state, count: event.target.value })}
        />
        <p id={hintId} className={invalid ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
          {invalid ? t("count.customRange", EXERCISE_COUNT_LIMITS) : t("exerciseCount.hint")}
        </p>
      </div>
      <SegmentedField
        label={t("difficulty.label")}
        value={state.difficulty}
        options={LEVELS.map((value) => ({ value, label: t(`difficulty.${value}`) }))}
        onChange={(difficulty) => onChange({ ...state, difficulty })}
      />
    </>
  )
}

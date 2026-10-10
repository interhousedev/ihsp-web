"use client"

import type { CoursePlan, CoursePlanContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, Textarea } from "@ihsp/ui"
import { IconArrowDown, IconArrowUp, IconPlus, IconRestore, IconTrash } from "@ihsp/ui"
import { useId, useMemo, useState } from "react"
import type { ViewerProps } from "../viewer-props"
import { ApplyButton } from "./apply-button"
import {
  MAX_TITLE,
  addSection,
  addStep,
  goalsFromText,
  moveSection,
  moveStep,
  planProblem,
  removeSection,
  removeStep,
  renameSection,
  setPlanGoals,
  setPlanText,
  setSectionGoals,
  updateStep,
} from "./plan-edit"
import { useCourseContext } from "./use-course-context"

function toPlan(content: CoursePlanContent): CoursePlan {
  return { summary: content.summary, goals: content.goals, sections: content.sections }
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-9"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function GoalsField({
  label,
  goals,
  onChange,
  disabled,
}: {
  label: string
  goals: string[]
  onChange: (goals: string[]) => void
  disabled: boolean
}) {
  const id = useId()
  // The text is kept while typing (a trailing newline must survive); goals are parsed on every change.
  const [text, setText] = useState(goals.join("\n"))
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        rows={Math.max(2, goals.length + 1)}
        value={text}
        disabled={disabled}
        onChange={(event) => {
          setText(event.target.value)
          onChange(goalsFromText(event.target.value))
        }}
      />
    </div>
  )
}

/**
 * The course plan the model wrote, as an editable tree (docs: LMS workspace). Titles, goals and summaries can be
 * changed, sections and steps reordered, removed or added; Apply sends the edited plan, the output itself stays as
 * the model wrote it.
 */
export function CoursePlanViewer({ notebookId, artifact }: ViewerProps<"course_plan">) {
  const t = useT("notebooks")
  const original = useMemo(() => toPlan(artifact.content as CoursePlanContent), [artifact.content])
  const { canWrite } = useCourseContext(notebookId)
  const [plan, setPlan] = useState<CoursePlan>(original)
  const edited = JSON.stringify(plan) !== JSON.stringify(original)
  const problem = planProblem(plan)
  const readOnly = !canWrite
  const summaryId = useId()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <ApplyButton
          notebookId={notebookId}
          artifact={{ id: artifact.id, kind: "course_plan", title: artifact.title }}
          plan={plan}
          disabled={problem !== null}
        />
        {edited && !readOnly ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 gap-1.5 md:min-h-9"
            onClick={() => setPlan(original)}
          >
            <IconRestore aria-hidden className="size-4" />
            {t("course.plan.reset")}
          </Button>
        ) : null}
        {problem !== null ? (
          <p role="alert" className="text-destructive text-sm">
            {t(`course.plan.problem.${problem}`)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={summaryId} className="text-muted-foreground text-xs font-medium">
          {t("course.plan.summary")}
        </label>
        <Textarea
          id={summaryId}
          rows={3}
          value={plan.summary}
          disabled={readOnly}
          onChange={(event) => setPlan(setPlanText(plan, "summary", event.target.value))}
        />
      </div>
      <GoalsField
        label={t("course.plan.courseGoals")}
        goals={plan.goals}
        disabled={readOnly}
        onChange={(goals) => setPlan(setPlanGoals(plan, goals))}
      />

      <ol className="flex flex-col gap-4">
        {plan.sections.map((section, sectionIndex) => (
          <li key={sectionIndex} className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-6 shrink-0 text-sm">{sectionIndex + 1}.</span>
              <Input
                aria-label={t("course.plan.sectionTitle", { n: sectionIndex + 1 })}
                value={section.title}
                maxLength={MAX_TITLE}
                disabled={readOnly}
                className="min-h-11 flex-1 font-semibold md:min-h-8"
                onChange={(event) => setPlan(renameSection(plan, sectionIndex, event.target.value))}
              />
              {readOnly ? null : (
                <>
                  <IconAction
                    label={t("course.plan.moveUp")}
                    disabled={sectionIndex === 0}
                    onClick={() => setPlan(moveSection(plan, sectionIndex, -1))}
                  >
                    <IconArrowUp aria-hidden />
                  </IconAction>
                  <IconAction
                    label={t("course.plan.moveDown")}
                    disabled={sectionIndex === plan.sections.length - 1}
                    onClick={() => setPlan(moveSection(plan, sectionIndex, 1))}
                  >
                    <IconArrowDown aria-hidden />
                  </IconAction>
                  <IconAction
                    label={t("course.plan.removeSection")}
                    onClick={() => setPlan(removeSection(plan, sectionIndex))}
                  >
                    <IconTrash aria-hidden />
                  </IconAction>
                </>
              )}
            </div>
            <GoalsField
              label={t("course.plan.sectionGoals")}
              goals={section.goals}
              disabled={readOnly}
              onChange={(goals) => setPlan(setSectionGoals(plan, sectionIndex, goals))}
            />
            <ol className="flex flex-col gap-3 ps-4">
              {section.steps.map((step, stepIndex) => (
                <li key={stepIndex} className="bg-muted/30 flex flex-col gap-2 rounded-md p-2">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground w-9 shrink-0 text-xs">
                      {sectionIndex + 1}.{stepIndex + 1}
                    </span>
                    <Input
                      aria-label={t("course.plan.stepTitle", { n: `${sectionIndex + 1}.${stepIndex + 1}` })}
                      value={step.title}
                      maxLength={MAX_TITLE}
                      disabled={readOnly}
                      className="min-h-11 flex-1 md:min-h-8"
                      onChange={(event) =>
                        setPlan(updateStep(plan, sectionIndex, stepIndex, { title: event.target.value }))
                      }
                    />
                    {readOnly ? null : (
                      <>
                        <IconAction
                          label={t("course.plan.moveUp")}
                          disabled={stepIndex === 0}
                          onClick={() => setPlan(moveStep(plan, sectionIndex, stepIndex, -1))}
                        >
                          <IconArrowUp aria-hidden />
                        </IconAction>
                        <IconAction
                          label={t("course.plan.moveDown")}
                          disabled={stepIndex === section.steps.length - 1}
                          onClick={() => setPlan(moveStep(plan, sectionIndex, stepIndex, 1))}
                        >
                          <IconArrowDown aria-hidden />
                        </IconAction>
                        <IconAction
                          label={t("course.plan.removeStep")}
                          onClick={() => setPlan(removeStep(plan, sectionIndex, stepIndex))}
                        >
                          <IconTrash aria-hidden />
                        </IconAction>
                      </>
                    )}
                  </div>
                  <GoalsField
                    label={t("course.plan.stepGoals")}
                    goals={step.goals}
                    disabled={readOnly}
                    onChange={(goals) => setPlan(updateStep(plan, sectionIndex, stepIndex, { goals }))}
                  />
                  <Textarea
                    aria-label={t("course.plan.stepSummary")}
                    placeholder={t("course.plan.stepSummary")}
                    rows={2}
                    value={step.summary}
                    disabled={readOnly}
                    onChange={(event) =>
                      setPlan(updateStep(plan, sectionIndex, stepIndex, { summary: event.target.value }))
                    }
                  />
                </li>
              ))}
            </ol>
            {readOnly ? null : (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-fit gap-1.5 md:min-h-9"
                onClick={() => setPlan(addStep(plan, sectionIndex))}
              >
                <IconPlus aria-hidden className="size-4" />
                {t("course.plan.addStep")}
              </Button>
            )}
          </li>
        ))}
      </ol>
      {readOnly ? null : (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-fit gap-1.5 md:min-h-9"
          onClick={() => setPlan(addSection(plan, ""))}
        >
          <IconPlus aria-hidden className="size-4" />
          {t("course.plan.addSection")}
        </Button>
      )}
    </div>
  )
}

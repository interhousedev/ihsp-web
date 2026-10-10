"use client"

import { isApiError } from "@ihsp/api"
import type { ApplyBody, ApplyPreview, ApplyResult, ArtifactKind, CoursePlan, LessonDraft } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Checkbox,
  LoadingButton,
  buttonVariants,
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  cn,
} from "@ihsp/ui"
import { IconAlertTriangle, IconCheck, IconExternalLink } from "@ihsp/ui"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useApplyArtifact, useApplyPreview, useCourseSteps } from "../../api/use-course-workspace"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { ResponsiveDialog } from "../../studio/responsive-dialog"
import { BlockPreview } from "./block-preview"
import { blockText, lineDiff, toDisplayBlocks } from "./blocks"
import { cleanPlan } from "./plan-edit"

export type ApplyArtifactRef = { id: string; kind: ArtifactKind; title: string }

export type ApplyDialogProps = {
  notebookId: string
  courseId: string
  artifact: ApplyArtifactRef
  /** The plan as edited in the viewer (course plans). */
  plan?: CoursePlan
  /** The lesson as edited in the viewer (lesson drafts). */
  draft?: LessonDraft
  /** The step the output was written for (lesson drafts), preselected as the target. */
  defaultStepId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful apply; the link "Open in editor" is shown in the dialog. */
  onApplied?: (result: ApplyResult) => void
  /** Where "Open in editor" goes (a step or the course outline). */
  editorHref: (result: ApplyResult) => string
}

const NEW_STEP = "new"

function Diff({ before, after }: { before: string; after: string }) {
  const lines = useMemo(() => lineDiff(before, after), [before, after])
  return (
    <pre className="bg-muted/30 max-h-64 overflow-auto rounded-md border p-2 text-xs leading-5 whitespace-pre-wrap">
      {lines.map((line, i) => (
        <span
          key={i}
          data-kind={line.kind}
          className={cn(
            "block",
            line.kind === "added" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
            line.kind === "removed" && "bg-destructive/15 text-destructive line-through",
          )}
        >
          {line.kind === "added" ? "+ " : line.kind === "removed" ? "- " : "  "}
          {line.text || " "}
        </span>
      ))}
    </pre>
  )
}

function PlanPreview({ preview }: { preview: NonNullable<ApplyPreview["plan"]> }) {
  const t = useT("notebooks")
  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="text-sm">
        {t("course.apply.planCounts", {
          sections: preview.new_sections,
          steps: preview.new_steps,
          existing: preview.existing_steps,
        })}
      </p>
      <ul className="flex flex-col gap-2">
        {preview.sections.map((section, i) => (
          <li key={i} className="rounded-md border p-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="min-w-0 flex-1 truncate">{section.title}</span>
              <Badge variant={section.action === "new" ? "default" : "outline"}>
                {t(section.action === "new" ? "course.apply.new" : "course.apply.exists")}
              </Badge>
            </div>
            <ul className="mt-1 flex flex-col gap-1 ps-4">
              {section.steps.map((step, j) => (
                <li key={j} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{step.title}</span>
                  <Badge variant={step.action === "new" ? "default" : "outline"}>
                    {t(step.action === "new" ? "course.apply.new" : "course.apply.exists")}
                  </Badge>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepPreview({ step }: { step: NonNullable<ApplyPreview["step"]> }) {
  const t = useT("notebooks")
  const current = step.current_blocks ? toDisplayBlocks(step.current_blocks) : []
  const proposed = toDisplayBlocks(step.new_blocks)
  const append = step.mode === "append"
  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="text-sm">
        {step.step_id === null
          ? t("course.apply.newStep", { title: step.title })
          : t(append ? "course.apply.appendTo" : "course.apply.replaceIn", { title: step.title })}
      </p>
      {proposed.map((block, i) => {
        const before = !append && current[i] ? current[i] : null
        if (block.type === "text" && before?.type === "text") {
          return <Diff key={i} before={blockText(before)} after={blockText(block)} />
        }
        return (
          <div key={i} className="flex flex-col gap-1">
            <Badge variant="default" className="w-fit">
              {t("course.apply.added")}
            </Badge>
            <BlockPreview block={block} />
          </div>
        )
      })}
      {!append && current.length > proposed.length ? (
        <p className="text-muted-foreground text-xs">
          {t("course.apply.removedBlocks", { count: current.length - proposed.length })}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Apply: shows what writing a course output into the course draft would change (the server's dry run), lets the
 * author pick the target step and the mode, and writes it on confirm. A stale step (409) reloads the preview.
 */
export function ApplyDialog(props: ApplyDialogProps) {
  const { notebookId, courseId, artifact, plan, draft, defaultStepId, open, onOpenChange, onApplied, editorHref } =
    props
  const t = useT("notebooks")
  const root = useT()
  const errorMessage = useNotebookErrorMessage()
  const stepSelectId = useId()
  const sectionSelectId = useId()
  const outline = useCourseSteps(open ? notebookId : null)
  const previewMutation = useApplyPreview(notebookId, artifact.id)
  const apply = useApplyArtifact(notebookId, artifact.id, courseId)

  const isPlan = artifact.kind === "course_plan"
  const isLesson = artifact.kind === "lesson_draft"
  const [stepId, setStepId] = useState<string>(defaultStepId ?? (isLesson ? NEW_STEP : ""))
  const [sectionId, setSectionId] = useState<string>("")
  const [mode, setMode] = useState<"append" | "replace">(isLesson ? "replace" : "append")
  const [addBriefs, setAddBriefs] = useState(true)
  const [result, setResult] = useState<ApplyResult | null>(null)
  const [conflict, setConflict] = useState(false)

  // The first section is the default home of a new step.
  const firstSection = outline.data?.sections[0]?.id ?? ""
  useEffect(() => {
    if (sectionId === "" && firstSection !== "") setSectionId(firstSection)
  }, [firstSection, sectionId])

  const body = useMemo<ApplyBody | null>(() => {
    if (isPlan) return { ...(plan ? { plan: cleanPlan(plan) } : {}), add_briefs: addBriefs }
    if (stepId === "") return null
    const target =
      stepId === NEW_STEP
        ? { target_step_id: null, target_section_id: sectionId === "" ? null : sectionId }
        : { target_step_id: stepId }
    return { ...target, mode: stepId === NEW_STEP ? "replace" : mode, ...(draft ? { draft } : {}) }
  }, [isPlan, plan, draft, addBriefs, stepId, sectionId, mode])

  const bodyKey = body ? JSON.stringify(body) : ""
  const requested = useRef("")
  const { mutate: requestPreview, reset: resetPreview } = previewMutation
  useEffect(() => {
    if (!open) {
      requested.current = ""
      return
    }
    if (!body || bodyKey === requested.current) return
    requested.current = bodyKey
    requestPreview(body)
  }, [open, body, bodyKey, requestPreview])

  // A new opening starts clean.
  const { reset: resetApply } = apply
  useEffect(() => {
    if (open) {
      setResult(null)
      setConflict(false)
      resetApply()
    } else {
      resetPreview()
    }
  }, [open, resetApply, resetPreview])

  const preview = previewMutation.data
  const canConfirm = preview?.can_apply === true && !previewMutation.isPending && !apply.isPending && result === null

  const confirm = () => {
    if (!body) return
    const lock = preview?.step?.lock_version ?? undefined
    apply.mutate(
      { ...body, ...(lock !== undefined ? { lock_version: lock } : {}) },
      {
        onSuccess: (applied) => {
          setResult(applied)
          onApplied?.(applied)
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) {
            setConflict(true)
            requested.current = ""
            if (body) requestPreview(body)
          }
        },
      },
    )
  }

  const footer = result ? (
    <>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => onOpenChange(false)}>
        {root("common.close")}
      </Button>
      <a href={editorHref(result)} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
        <IconExternalLink aria-hidden />
        {t("course.apply.openEditor")}
      </a>
    </>
  ) : (
    <>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => onOpenChange(false)}>
        {root("common.cancel")}
      </Button>
      <LoadingButton
        type="button"
        className="min-h-11 md:min-h-8"
        loading={apply.isPending}
        loadingLabel={root("common.loading")}
        disabled={!canConfirm}
        onClick={confirm}
      >
        {t("course.apply.confirm")}
      </LoadingButton>
    </>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("course.apply.title", { title: artifact.title })}
      description={t(`course.apply.description.${artifact.kind}`)}
      footer={footer}
    >
      {result ? (
        <p role="status" className="flex items-start gap-2 text-sm">
          <IconCheck aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
          {isPlan
            ? t("course.apply.donePlan", {
                sections: result.created_sections.length,
                steps: result.created_steps.length,
              })
            : t("course.apply.doneStep")}
        </p>
      ) : (
        <>
          {isPlan ? (
            <label className="flex min-h-11 items-start gap-2 text-sm md:min-h-8">
              <Checkbox checked={addBriefs} onCheckedChange={(checked) => setAddBriefs(checked === true)} />
              <span>{t("course.apply.addBriefs")}</span>
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={stepSelectId} className="text-sm font-medium">
                  {t("course.apply.target")}
                </label>
                <NativeSelect
                  id={stepSelectId}
                  className="min-h-11 w-full md:min-h-8"
                  value={stepId}
                  onChange={(event) => setStepId(event.target.value)}
                >
                  {isLesson ? (
                    <NativeSelectOption value={NEW_STEP}>{t("course.apply.newStepOption")}</NativeSelectOption>
                  ) : (
                    <NativeSelectOption value="">{t("course.apply.pickStep")}</NativeSelectOption>
                  )}
                  {(outline.data?.sections ?? []).map((section) => (
                    <NativeSelectOptGroup key={section.id} label={section.title}>
                      {section.steps.map((step) => (
                        <NativeSelectOption key={step.id} value={step.id}>
                          {step.title}
                        </NativeSelectOption>
                      ))}
                    </NativeSelectOptGroup>
                  ))}
                </NativeSelect>
              </div>
              {isLesson && stepId === NEW_STEP ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={sectionSelectId} className="text-sm font-medium">
                    {t("course.apply.section")}
                  </label>
                  <NativeSelect
                    id={sectionSelectId}
                    className="min-h-11 w-full md:min-h-8"
                    value={sectionId}
                    onChange={(event) => setSectionId(event.target.value)}
                  >
                    {(outline.data?.sections ?? []).map((section) => (
                      <NativeSelectOption key={section.id} value={section.id}>
                        {section.title}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              ) : null}
              {isLesson && stepId !== NEW_STEP ? (
                <fieldset className="flex flex-wrap gap-4">
                  <legend className="sr-only">{t("course.apply.mode")}</legend>
                  {(["replace", "append"] as const).map((value) => (
                    <label key={value} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                      <input type="radio" name="apply-mode" checked={mode === value} onChange={() => setMode(value)} />
                      {t(`course.apply.mode_${value}`)}
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </div>
          )}

          {conflict ? (
            <p role="alert" className="text-destructive flex items-start gap-2 text-sm">
              <IconAlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("course.apply.conflict")}
            </p>
          ) : null}
          {previewMutation.isPending ? (
            <p role="status" className="text-muted-foreground text-sm">
              {t("course.apply.loading")}
            </p>
          ) : null}
          {previewMutation.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(previewMutation.error)}
            </p>
          ) : null}
          {preview && preview.problems.length > 0 ? (
            <div role="alert" className="border-destructive/40 rounded-md border p-2 text-sm">
              <p className="font-medium">{t("course.apply.problems")}</p>
              <ul className="list-disc ps-5">
                {preview.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {preview && (preview.notes ?? []).length > 0 ? (
            <ul className="text-muted-foreground list-disc ps-5 text-xs" aria-label={t("course.apply.notes")}>
              {preview.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          {preview?.plan ? <PlanPreview preview={preview.plan} /> : null}
          {preview?.step ? <StepPreview step={preview.step} /> : null}
          {apply.isError && !conflict ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(apply.error)}
            </p>
          ) : null}
        </>
      )}
    </ResponsiveDialog>
  )
}

"use client"

import type { ArtifactKind, NotebookDetail, ReportFormat } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, LoadingButton } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { useCreateArtifact } from "../api/use-artifacts"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { buildCreate } from "./forms/build-create"
import { CoursePlanForm } from "./forms/course-plan-form"
import { DataTableForm } from "./forms/data-table-form"
import { FlashcardsForm } from "./forms/flashcards-form"
import { FocusField } from "./forms/focus-field"
import { formProblem, hasForm, initialState, type FormKind, type FormState } from "./forms/form-state"
import { InfographicForm } from "./forms/infographic-form"
import { LessonDraftForm } from "./forms/lesson-draft-form"
import { LanguageField } from "./forms/language-field"
import { MindMapForm } from "./forms/mind-map-form"
import { QuizForm } from "./forms/quiz-form"
import { ReportForm } from "./forms/report-form"
import { SlidesForm } from "./forms/slides-form"
import { SourcesLine } from "./forms/sources-line"
import { ResponsiveDialog } from "./responsive-dialog"
import { useKindLabel } from "./use-kind-label"
import { useStudioGate } from "./use-studio-gate"

export type CustomizeDialogProps = {
  kind: ArtifactKind
  /** For `report`: the format chosen in the picker (or `conspect` from its own tile). */
  format?: ReportFormat
  notebook: NotebookDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The per-kind form of the pencil button. Closing keeps nothing: the next opening starts from the defaults. */
export function CustomizeDialog({ kind, ...rest }: CustomizeDialogProps) {
  // Audio overviews are not offered and have no form.
  if (!hasForm(kind)) return null
  return <CustomizeForm kind={kind} {...rest} />
}

function KindFields({
  state,
  onChange,
  notebookId,
}: {
  state: FormState
  onChange: (next: FormState) => void
  notebookId: string
}) {
  switch (state.kind) {
    case "report":
      return <ReportForm state={state} onChange={onChange} />
    case "mind_map":
      return <MindMapForm state={state} onChange={onChange} />
    case "flashcards":
      return <FlashcardsForm state={state} onChange={onChange} />
    case "quiz":
      return <QuizForm state={state} onChange={onChange} />
    case "data_table":
      return <DataTableForm state={state} onChange={onChange} />
    case "slides":
      return <SlidesForm state={state} onChange={onChange} />
    case "infographic":
      return <InfographicForm state={state} onChange={onChange} />
    case "course_plan":
      return <CoursePlanForm state={state} onChange={onChange} />
    case "lesson_draft":
      return <LessonDraftForm state={state} onChange={onChange} notebookId={notebookId} />
  }
}

function CustomizeForm({
  kind,
  format,
  notebook,
  open,
  onOpenChange,
}: Omit<CustomizeDialogProps, "kind"> & { kind: FormKind }) {
  const t = useT("notebooks")
  const root = useT()
  const errorMessage = useNotebookErrorMessage()
  const kindLabel = useKindLabel()
  const create = useCreateArtifact(notebook.id)
  const gate = useStudioGate(notebook)

  const identity = `${kind}:${format ?? ""}`
  const [state, setState] = useState<FormState>(() => initialState(kind, format))
  const [seen, setSeen] = useState({ open, identity })
  if (seen.open !== open || seen.identity !== identity) {
    // Every opening starts from the defaults (adjusting state while rendering, so there is no flash of old values).
    setSeen({ open, identity })
    if (open) setState(initialState(kind, format))
  }

  const reset = create.reset
  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const blocked = gate.forKind(kind)
  const problem = formProblem(state)
  const label = kindLabel({ kind, format: kind === "report" ? (format ?? "conspect") : null })

  const submit = () => {
    create.mutate(buildCreate(state), { onSuccess: () => onOpenChange(false) })
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("studio.customize", { kind: label })}
      footer={
        <>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => onOpenChange(false)}>
            {root("common.cancel")}
          </Button>
          <LoadingButton
            type="button"
            className="min-h-11 md:min-h-8"
            loading={create.isPending}
            loadingLabel={root("common.loading")}
            disabled={blocked !== null || problem !== null}
            onClick={submit}
          >
            {t("opt.generate")}
          </LoadingButton>
        </>
      }
    >
      <KindFields state={state} onChange={setState} notebookId={notebook.id} />
      <LanguageField value={state.language} onChange={(language) => setState({ ...state, language })} />
      <FocusField
        value={state.focus}
        required={state.kind === "report" && state.format === "custom"}
        onChange={(focus) => setState({ ...state, focus })}
      />
      <SourcesLine count={notebook.selected_source_count} onNavigate={() => onOpenChange(false)} />
      {blocked ? (
        <p role="status" className="text-muted-foreground text-sm">
          {blocked.message}
        </p>
      ) : null}
      {create.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}

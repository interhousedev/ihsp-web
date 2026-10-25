"use client"

import type { ArtifactKind, FileItem, NotebookDetail, ReportFormat, SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, LoadingButton } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { DrivePicker } from "../../file-upload-button"
import { useCreateArtifact } from "../api/use-artifacts"
import { useAddSources, useSelectSources, useSources } from "../api/use-sources"
import { PlanSheet } from "../plans/plan-sheet"
import { useCreatePresentationPlan } from "../plans/use-presentation-plan"
import { isUsable } from "../lib/sort-sources"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { useOptionalWorkspace } from "../workspace-context"
import { buildCreate, withSourceIds } from "./forms/build-create"
import { CoursePlanForm } from "./forms/course-plan-form"
import { DataTableForm } from "./forms/data-table-form"
import { ExerciseForm } from "./forms/exercise-form"
import { FlashcardsForm } from "./forms/flashcards-form"
import { FocusField } from "./forms/focus-field"
import { formProblem, initialState, type FormKind, type FormState } from "./forms/form-state"
import { InfographicForm } from "./forms/infographic-form"
import { LessonDraftForm } from "./forms/lesson-draft-form"
import { LanguageField } from "./forms/language-field"
import { MindMapForm } from "./forms/mind-map-form"
import { QuizForm } from "./forms/quiz-form"
import { ReportForm } from "./forms/report-form"
import { SlidesForm } from "./forms/slides-form"
import { defaultSelection, SourceChooser } from "./forms/source-chooser"
import { ResponsiveDialog } from "./responsive-dialog"
import { useKindLabel } from "./use-kind-label"
import { useStudioGate } from "./use-studio-gate"
import { suggestedQuery, WebSearchHint } from "./web-search-hint"

export type CustomizeDialogProps = {
  kind: ArtifactKind
  /** For `report`: the format chosen in the picker (or `conspect` from its own tile). */
  format?: ReportFormat
  notebook: NotebookDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The per-kind form behind every Studio tile. Closing keeps nothing: the next opening starts from the defaults. */
export function CustomizeDialog({ kind, ...rest }: CustomizeDialogProps) {
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
    case "exercise":
      return <ExerciseForm state={state} onChange={onChange} />
    case "course_plan":
      return <CoursePlanForm state={state} onChange={onChange} />
    case "lesson_draft":
      return <LessonDraftForm state={state} onChange={onChange} notebookId={notebookId} />
  }
}

/** Files with readable text can be sources. */
function hasReadableText(file: FileItem): boolean {
  return file.assistant_ready && file.text_bytes !== null
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false
  for (const id of a) if (!b.has(id)) return false
  return true
}

/** About how many slides each deck length has (the server keeps a plan within its limit). */
const PLAN_SLIDES = { short: 6, default: 10, long: 16 } as const

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
  const sources = useSources(notebook.id)
  const add = useAddSources(notebook.id)
  const select = useSelectSources(notebook.id)
  // A deck is planned first (PLAN): the outline opens in a side panel and Generate there makes the deck.
  const planCreate = useCreatePresentationPlan(notebook.id)
  const [planId, setPlanId] = useState<string | null>(null)

  const identity = `${kind}:${format ?? ""}`
  const [state, setState] = useState<FormState>(() => initialState(kind, format))
  // `null` until the person changes the ticks: the default follows the Sources pane even if it loads later.
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [browsing, setBrowsing] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  // The web search the server suggests when the sources were thin (the output is already queued then).
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const workspace = useOptionalWorkspace()
  const [seen, setSeen] = useState({ open, identity })
  if (seen.open !== open || seen.identity !== identity) {
    // Every opening starts from the defaults (adjusting state while rendering, so there is no flash of old values).
    setSeen({ open, identity })
    if (open) {
      setState(initialState(kind, format))
      setPicked(null)
      setAddError(null)
      setSuggestion(null)
    }
  }

  const reset = create.reset
  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const all: readonly SourceItem[] = sources.data ?? []
  const paneSelection = defaultSelection(sources.data)
  const selection: ReadonlySet<string> = picked ?? paneSelection
  const chosen = all.filter((source) => selection.has(source.id))
  const readyChosen = chosen.filter(isUsable)
  const waiting = chosen.length - readyChosen.length

  const blocked = gate.forKind(kind)
  const problem = formProblem(state)
  // Everything ticked is still being read: wait for it rather than send a request the server would refuse.
  const onlyWaiting = chosen.length > 0 && readyChosen.length === 0
  const label = kindLabel({
    kind,
    format: kind === "report" ? (format ?? "conspect") : null,
  })

  const submit = async () => {
    let body = buildCreate(state)
    const ids = readyChosen.map((source) => source.id)
    if (ids.length === 0 && paneSelection.size > 0) {
      // "None" cannot be said in the request (no ids means the pane's selection), so the pane is cleared first.
      try {
        await select.mutateAsync({ selected: false })
      } catch {
        return // the mutation shows nothing itself; the rolled-back pane keeps its ticks
      }
    } else if (!sameSet(new Set(ids), paneSelection)) {
      body = withSourceIds(body, ids)
    }
    if (state.kind === "slides") {
      const planBody = {
        prompt: body.prompt ?? null,
        source_ids: ids.length > 0 ? ids : null,
        slide_count: PLAN_SLIDES[state.length],
        format: state.format,
      }
      planCreate.mutate(planBody, {
        onSuccess: (plan) => {
          setPlanId(plan.id)
          onOpenChange(false)
        },
      })
      return
    }
    create.mutate(body, {
      onSuccess: (item) => {
        // Thin sources: the output is queued anyway, so the dialog stays open with the web search offer.
        const query = suggestedQuery(item)
        if (query && workspace) setSuggestion(query)
        else onOpenChange(false)
      },
    })
  }

  const addFiles = async (files: FileItem[]) => {
    const readable = files.filter(hasReadableText)
    setBrowsing(false)
    if (readable.length === 0) return
    setAddError(null)
    try {
      const result = await add.mutateAsync(readable.map((file) => ({ kind: "file", file_id: file.id })))
      const next = new Set(selection)
      for (const item of result.items) next.add(item.id)
      setPicked(next)
      const rejected = result.rejected[0]
      if (rejected) setAddError(errorMessage(rejected.error))
    } catch (error) {
      setAddError(errorMessage(error))
    }
  }

  const pending = create.isPending || select.isPending || planCreate.isPending

  return (
    <>
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
              loading={pending}
              loadingLabel={root("common.loading")}
              disabled={blocked !== null || problem !== null || onlyWaiting || suggestion !== null}
              onClick={() => void submit()}
            >
              {kind === "slides" ? t("plan.makePlan") : t("opt.generate")}
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
        <SourceChooser
          sources={sources.data}
          loading={sources.isPending}
          error={sources.isError ? sources.error : null}
          onRetry={() => void sources.refetch()}
          selected={selection}
          onChange={setPicked}
          onAdd={() => setBrowsing(true)}
          adding={add.isPending}
        />
        {sources.isSuccess && chosen.length === 0 ? (
          <p role="status" className="text-sm text-amber-900 dark:text-amber-100">
            {t("studio.noSources")}
          </p>
        ) : null}
        {waiting > 0 ? (
          <p role="status" className="text-sm text-amber-900 dark:text-amber-100">
            {onlyWaiting ? t("studio.sources.waitAll") : t("studio.sources.skipped", { count: waiting })}
          </p>
        ) : null}
        {addError ? (
          <p role="alert" className="text-destructive text-sm">
            {addError}
          </p>
        ) : null}
        {suggestion && workspace ? (
          <WebSearchHint
            query={suggestion}
            onSearch={(query) => {
              workspace.openWebSearch(query)
              onOpenChange(false)
            }}
          />
        ) : null}
        {blocked ? (
          <p role="status" className="text-muted-foreground text-sm">
            {blocked.message}
          </p>
        ) : null}
        {create.isError || planCreate.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(create.isError ? create.error : planCreate.error)}
          </p>
        ) : null}
        <DrivePicker
          open={browsing}
          onOpenChange={setBrowsing}
          multiple
          uploadPurpose="ai_upload"
          busy={add.isPending}
          onSelect={(files) => void addFiles(files)}
        />
      </ResponsiveDialog>
      {planId ? (
        <PlanSheet
          notebookId={notebook.id}
          planId={planId}
          open
          onOpenChange={(next) => (next ? undefined : setPlanId(null))}
        />
      ) : null}
    </>
  )
}

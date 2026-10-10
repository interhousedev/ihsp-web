"use client"

import { postLmsStepCheckpoints, postLmsStepDiscard, type StepDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Badge, Button, ConfirmDialog, Field, FieldLabel, Icons, Input } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { SaveIndicator } from "../../editor/components/save-indicator"
import { OutlineBadge } from "../../shared/components/outline-badge"
import { hrefs } from "../../shared/utils/hrefs"
import { useStepEditor } from "../hooks/use-step-editor"
import { AddBlockBar } from "./add-block-bar"
import { BlockList } from "./block-list"
import { CheckpointDialog } from "./checkpoint-dialog"
import { ConflictDialog } from "./conflict-dialog"
import { ContentIssues } from "./content-issues"
import { HistorySheet } from "./history-sheet"
import { LinkButton } from "../../shared/components/link-button"

/** The step editor (UF-LMS-08, 13, 14): title, blocks, test builder, save state, conflict, checkpoints and history. */
export function StepEditorBody({
  draft,
  canEdit,
  autosaveMs,
}: {
  draft: StepDraft
  canEdit: boolean
  autosaveMs?: number
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const editor = useStepEditor(draft, { canEdit, autosaveMs })
  const [checkpointOpen, setCheckpointOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  const checkpoint = useMutation({
    mutationFn: async (label: string) => {
      await editor.save()
      return postLmsStepCheckpoints(draft.step_id, { label })
    },
    onSuccess: () => setCheckpointOpen(false),
  })
  const discard = useMutation<StepDraft, unknown, void>({
    mutationFn: () => postLmsStepDiscard(draft.step_id),
    onSuccess: (next) => {
      setDiscardOpen(false)
      editor.replaceFromServer(next)
    },
  })

  return (
    <div className="flex flex-col gap-4" onBlurCapture={canEdit ? editor.flush : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <SaveIndicator status={editor.status} />
        {draft.status !== "unchanged" ? <Badge variant="secondary">{t(`status.${draft.status}`)}</Badge> : null}
        {draft.updated_via === "mcp" ? <Badge variant="outline">{t("viaMcp")}</Badge> : null}
        {draft.updated_via === "ai" ? <OutlineBadge kind="ai" /> : null}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {canEdit ? (
            <>
              <Button variant="outline" onClick={() => setCheckpointOpen(true)} className="min-h-11 md:min-h-8">
                {t("checkpoint")}
              </Button>
              <Button variant="outline" onClick={() => setHistoryOpen(true)} className="min-h-11 md:min-h-8">
                <Icons.clock aria-hidden />
                {t("history")}
              </Button>
              <Button variant="outline" onClick={() => setDiscardOpen(true)} className="min-h-11 md:min-h-8">
                {t("discard")}
              </Button>
            </>
          ) : null}
          <LinkButton
            href={hrefs.preview(draft.course_id, draft.step_id)}
            variant="outline"
            className="min-h-11 md:min-h-8"
          >
            {t("preview")}
          </LinkButton>
        </div>
      </div>

      {!canEdit ? (
        <Alert>
          <AlertDescription>{t("readOnly")}</AlertDescription>
        </Alert>
      ) : null}
      {editor.restorable ? (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{t("bufferFound")}</span>
            <Button size="sm" onClick={editor.restore} className="min-h-11 md:min-h-7">
              {t("bufferRestore")}
            </Button>
            <Button size="sm" variant="outline" onClick={editor.discardBuffer} className="min-h-11 md:min-h-7">
              {t("bufferDiscard")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {editor.status === "offline" ? (
        <Alert>
          <AlertDescription>{t("offlineKept")}</AlertDescription>
        </Alert>
      ) : null}
      {editor.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(editor.error)}</AlertDescription>
        </Alert>
      ) : null}
      {editor.status === "conflict" && !editor.conflictOpen ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{t("conflictPending")}</span>
            <Button size="sm" onClick={editor.openConflict} className="min-h-11 md:min-h-7">
              {t("reviewConflict")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Field>
        <FieldLabel htmlFor="step-title">{t("stepTitle")}</FieldLabel>
        <Input
          id="step-title"
          value={editor.content.title}
          onChange={(event) =>
            editor.edit((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          disabled={!canEdit}
          maxLength={200}
          className="h-11 md:h-8"
        />
      </Field>

      <ContentIssues content={editor.content} />

      {editor.content.blocks.length === 0 ? <p className="text-muted-foreground text-sm">{t("noBlocks")}</p> : null}
      <BlockList
        content={editor.content}
        keyOf={editor.keyOf}
        edit={canEdit ? editor.edit : () => undefined}
        courseId={draft.course_id}
        stepId={draft.step_id}
      />
      {canEdit ? (
        <AddBlockBar
          onAdd={(block) =>
            editor.edit((current) => ({
              ...current,
              blocks: [...current.blocks, block],
            }))
          }
        />
      ) : null}

      {editor.conflict ? (
        <ConflictDialog
          open={editor.conflictOpen}
          onOpenChange={(open) => (open ? editor.openConflict() : editor.closeConflict())}
          mine={editor.content}
          theirs={editor.conflict}
          onKeepMine={() => void editor.keepMine()}
          onTakeTheirs={editor.takeTheirs}
        />
      ) : null}
      <CheckpointDialog
        open={checkpointOpen}
        onOpenChange={setCheckpointOpen}
        pending={checkpoint.isPending}
        error={checkpoint.error}
        onCreate={(label) => checkpoint.mutate(label)}
      />
      <HistorySheet
        stepId={draft.step_id}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        hasUnsavedEdits={editor.dirty}
        onRestored={editor.replaceFromServer}
      />
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t("discardTitle")}
        description={t("discardDescription")}
        confirmLabel={t("discard")}
        destructive
        loading={discard.isPending}
        onConfirm={() => discard.mutate()}
      />
      {discard.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(discard.error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

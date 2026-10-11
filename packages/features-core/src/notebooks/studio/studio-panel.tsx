"use client"

import type { ArtifactItem, ArtifactKind, NotebookDetail, ReportFormat } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconLayoutSidebarRightCollapse, IconNotes } from "@ihsp/ui"
import { useId, useState } from "react"
import { useCreateArtifact } from "../api/use-artifacts"
import { defaultCreate, isActive, studioTilesFor, type StudioTile as StudioTileDef } from "../lib/artifact-kinds"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { useWorkspace } from "../workspace-context"
import { CustomizeDialog } from "./customize-dialog"
import { ReportPicker } from "./report-picker"
import { StudioList } from "./studio-list"
import { StudioTile } from "./studio-tile"
import { useArtifactPolling } from "./use-artifact-polling"
import { quotaHintVisible, useStudioGate } from "./use-studio-gate"

export type StudioPanelProps = {
  notebook: NotebookDetail
  /** Shows a collapse button in the header (desktop panes); absent in tabs and sheets. */
  onCollapse?: () => void
}

type CustomizeTarget = { kind: ArtifactKind; format?: ReportFormat }

/** Whether a running item belongs to a tile: the conspect and the Reports tile are both `report` items. */
function belongsTo(tile: StudioTileDef, item: ArtifactItem): boolean {
  if (item.kind !== tile.kind) return false
  if (tile.kind !== "report") return true
  return tile.format === "conspect" ? item.format === "conspect" : item.format !== "conspect"
}

/** The Studio pane: tile grid, the list of outputs, the empty state and the Add note pill (§ 5.4.4). */
export function StudioPanel({ notebook, onCollapse }: StudioPanelProps) {
  const t = useT("notebooks")
  const workspace = useWorkspace()
  const errorMessage = useNotebookErrorMessage()
  const headingId = useId()
  const gate = useStudioGate(notebook)
  const list = useArtifactPolling(notebook.id)
  const create = useCreateArtifact(notebook.id)

  const [picking, setPicking] = useState(false)
  const [target, setTarget] = useState<CustomizeTarget>({
    kind: "report",
    format: "conspect",
  })
  const [customizing, setCustomizing] = useState(false)

  const tiles = studioTilesFor(notebook)
  const readOnly = notebook.can_write === false
  const running = (list.data ?? []).filter(isActive)
  const gates = tiles.map((tile) => gate.forKind(tile.kind))
  // Reasons shown as text under the grid (the tooltip alone does not help on a touch screen).
  const notes = [...new Set(gates.flatMap((entry) => (entry ? [entry.message] : [])))]

  const customize = (next: CustomizeTarget) => {
    setTarget(next)
    setCustomizing(true)
  }
  const start = (tile: StudioTileDef) => {
    if (tile.id === "report") setPicking(true)
    else create.mutate(defaultCreate(tile))
  }
  const edit = (tile: StudioTileDef) => {
    if (tile.id === "report") setPicking(true)
    else
      customize({
        kind: tile.kind,
        ...(tile.format ? { format: tile.format } : {}),
      })
  }

  const usage = gate.usage.data
  const quotas = usage?.quotas.artifacts

  return (
    <section aria-labelledby={headingId} className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 px-4">
        <h2 id={headingId} className="text-base font-semibold">
          {t("studio.title")}
        </h2>
        {onCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("studio.collapse")}
            onClick={onCollapse}
          >
            <IconLayoutSidebarRightCollapse aria-hidden />
          </Button>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <ul aria-label={t("studio.tiles")} className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {tiles.map((tile, index) => (
            <StudioTile
              key={tile.id}
              tile={tile}
              label={t(`kind.${tile.labelKey}`)}
              busy={running.some((item) => belongsTo(tile, item))}
              disabledReason={gates[index]?.message ?? null}
              pending={create.isPending}
              onStart={() => start(tile)}
              onCustomize={() => edit(tile)}
            />
          ))}
        </ul>
        {notes.map((note) => (
          <p key={note} role="status" className="text-muted-foreground text-xs">
            {note}
          </p>
        ))}
        {notebook.selected_source_count === 0 ? (
          <p role="status" className="text-xs text-amber-900 dark:text-amber-100">
            {t("studio.noSources")}
          </p>
        ) : null}
        {quotas && quotaHintVisible(usage) ? (
          <p className="text-muted-foreground text-xs">
            {t("usage.materials", { used: quotas.used, limit: quotas.limit ?? 0 })}
          </p>
        ) : null}
        {create.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(create.error)}
          </p>
        ) : null}
        <StudioList notebookId={notebook.id} query={list} />
      </div>

      {readOnly ? null : (
        <div className="flex shrink-0 justify-center border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-full px-5 md:min-h-9"
            onClick={() => workspace.openNoteEditor()}
          >
            <IconNotes aria-hidden />
            {t("studio.addNote")}
          </Button>
        </div>
      )}

      <ReportPicker
        open={picking}
        onOpenChange={setPicking}
        onPick={(format) => {
          setPicking(false)
          customize({ kind: "report", format })
        }}
      />
      <CustomizeDialog
        kind={target.kind}
        {...(target.format ? { format: target.format } : {})}
        notebook={notebook}
        open={customizing}
        onOpenChange={setCustomizing}
      />
    </section>
  )
}

"use client"

import { type DashboardWidgetKind, type DashboardWidgetSize, isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import { useCallback, useState } from "react"
import { AddWidget } from "./editor/add-widget"
import { WidgetEditor } from "./editor/widget-editor"
import { ConnectAiNotice } from "./connect-ai-notice"
import { DashboardGrid } from "./grid"
import {
  addWidget,
  colorWidget,
  inOrder,
  moveWidget,
  removeWidget,
  resizeWidget,
  shownWidgets,
  type Widget,
} from "./model"
import { useDashboard, useSaveDashboard } from "./use-dashboard"

/**
 * The widget grid on Today. "Edit" starts a draft (add from the catalogue, select a tile to resize, recolour or delete it,
 * drag to reorder); "Done" saves the draft with the version it was read at. A failed save keeps the draft.
 */
export function Dashboard() {
  const t = useT("today.dashboard")
  const query = useDashboard()
  const save = useSaveDashboard()
  const [draft, setDraft] = useState<Widget[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [saveError, setSaveError] = useState<"conflict" | "failed" | null>(null)

  const change = useCallback((fn: (widgets: readonly Widget[]) => Widget[]) => {
    setDraft((current) => (current ? fn(current) : current))
  }, [])
  const onMove = useCallback((id: string, to: number) => change((w) => moveWidget(w, id, to)), [change])
  const onColor = useCallback((id: string, color: string | null) => change((w) => colorWidget(w, id, color)), [change])

  if (query.isPending) return <StateView state="loading" rows={2} />
  if (!query.data) {
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  }
  const editing = draft !== null
  const widgets = draft ?? shownWidgets(query.data.widgets)
  const selected = draft?.find((widget) => widget.id === selectedId) ?? null

  const finish = () => {
    setDraft(null)
    setSelectedId(null)
    setAdding(false)
  }
  const done = () => {
    if (!draft) return
    save.mutate(
      { version: query.data.version, widgets: draft },
      {
        onSuccess: () => {
          setSaveError(null)
          finish()
        },
        // The draft stays so the student can try again; a conflict is answered by the refetch the hook starts.
        onError: (error) => {
          setSaveError(isApiError(error) && error.status === 409 ? "conflict" : "failed")
        },
      },
    )
  }

  return (
    <section aria-labelledby="dashboard-title" className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="dashboard-title" className="text-base font-semibold">
          {t("title")}
        </h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdding((open) => !open)}>
                <Icons.plusCircle aria-hidden />
                {t("add")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={finish}>
                {t("cancel")}
              </Button>
              <Button type="button" size="sm" disabled={save.isPending} onClick={done}>
                {t("done")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraft(inOrder(shownWidgets(query.data.widgets)))}
            >
              <Icons.edit aria-hidden />
              {t("edit")}
            </Button>
          )}
        </div>
      </div>
      {saveError ? (
        <p role="alert" className="text-destructive text-sm">
          {saveError === "conflict" ? t("conflict") : t("saveFailed")}
        </p>
      ) : null}
      {editing && adding ? (
        <AddWidget
          onAdd={(kind: DashboardWidgetKind) => {
            change((w) => addWidget(w, kind))
            setAdding(false)
          }}
        />
      ) : null}
      <ConnectAiNotice />
      <DashboardGrid
        widgets={widgets}
        editing={editing}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onMove={onMove}
        onColor={onColor}
      />
      {editing && selected ? (
        <WidgetEditor
          widget={selected}
          onResize={(size: DashboardWidgetSize) => change((w) => resizeWidget(w, selected.id, size))}
          onRemove={() => {
            change((w) => removeWidget(w, selected.id))
            setSelectedId(null)
          }}
        />
      ) : null}
    </section>
  )
}

"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useBackButton } from "@ihsp/telegram"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CitationNavigationProvider } from "../chat/use-citation-navigation"
import type { AskRequest, WorkspaceTab } from "../types"
import { WorkspaceProvider } from "../workspace-context"
import { DesktopLayout } from "./desktop-layout"
import { NotebookHeader } from "./notebook-header"
import { PaneSheetButtons } from "./pane-sheet-buttons"
import { AddSourcesDialog } from "./panes"
import { PhoneLayout } from "./phone-layout"
import { TabletLayout } from "./tablet-layout"
import { usePaneState } from "./use-pane-state"
import { useWorkspaceActions } from "./use-workspace-actions"
import { useWorkspaceKeys } from "./use-workspace-keys"
import type { WorkspaceLayout } from "./use-workspace-layout"
import { useWorkspaceUrlState } from "./use-workspace-state"

const COMPOSER = "[data-notebook-composer]"

/** The workspace of a loaded notebook: URL state, the actions of the panes, the header and the layout of the width. */
export function LoadedWorkspace({ notebook, layout }: { notebook: NotebookDetail; layout: WorkspaceLayout }) {
  const router = useRouter()
  const url = useWorkspaceUrlState()
  const panes = usePaneState()
  const [pendingAsk, setPendingAsk] = useState<AskRequest | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [focusRequested, setFocusRequested] = useState(false)
  const handledAsk = useCallback(() => setPendingAsk(null), [])

  const { viewer, closeViewer } = url
  const phoneTab: WorkspaceTab = url.tab ?? (notebook.source_count > 0 ? "chat" : "sources")
  const composerVisible = viewer === null && (layout !== "phone" || phoneTab === "chat")

  const actions = useWorkspaceActions({
    notebookId: notebook.id,
    layout,
    url,
    panes,
    onAsk: setPendingAsk,
    onOpenAddSources: () => setAddOpen(true),
  })

  // `?add=1` (a new notebook) opens the Add sources dialog once, then leaves the address clean.
  const { addRequested, clearAdd } = url
  useEffect(() => {
    if (!addRequested) return
    setAddOpen(true)
    clearAdd()
  }, [addRequested, clearAdd])

  // `/` shows the chat first when a viewer or another tab covers it, then focuses the composer.
  const focusComposer = useRef<() => void>(() => undefined)
  useEffect(() => {
    focusComposer.current = () => {
      if (composerVisible) document.querySelector<HTMLElement>(COMPOSER)?.focus()
      else {
        actions.showTab("chat")
        setFocusRequested(true)
      }
    }
  })
  useEffect(() => {
    if (!focusRequested || !composerVisible) return
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(COMPOSER)?.focus()
      setFocusRequested(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [focusRequested, composerVisible])

  useWorkspaceKeys({
    collapsePanes: layout === "desktop",
    viewerOpen: viewer !== null,
    onCloseViewer: closeViewer,
    onToggle: panes.toggleCollapsed,
    onFocusComposer: () => focusComposer.current(),
  })

  // Telegram's own Back button: the viewer first, then the list.
  const onBack = useCallback(() => {
    if (viewer) closeViewer()
    else router.push(notebook.course_id ? `/edit/?id=${encodeURIComponent(notebook.course_id)}` : "/notebooks/")
  }, [viewer, closeViewer, router, notebook.course_id])
  useBackButton(onBack)

  const body = { notebook, viewer, pendingAsk, onAskHandled: handledAsk }
  const phoneViewerOpen = layout === "phone" && viewer !== null

  return (
    <WorkspaceProvider value={actions}>
      <CitationNavigationProvider>
        <div className="flex h-[calc(100dvh-3.5rem-var(--safe-top))] min-h-0 min-w-0 flex-col print:block print:h-auto">
          {phoneViewerOpen ? null : (
            <NotebookHeader
              notebook={notebook}
              extras={layout === "tablet" ? <PaneSheetButtons notebook={notebook} onOpen={panes.setSheet} /> : null}
            />
          )}
          {layout === "desktop" ? <DesktopLayout {...body} panes={panes} /> : null}
          {layout === "tablet" ? <TabletLayout {...body} panes={panes} /> : null}
          {layout === "phone" ? <PhoneLayout {...body} tab={phoneTab} onTabChange={url.showTab} /> : null}
        </div>
        <AddSourcesDialog notebookId={notebook.id} open={addOpen} onOpenChange={setAddOpen} />
      </CitationNavigationProvider>
    </WorkspaceProvider>
  )
}

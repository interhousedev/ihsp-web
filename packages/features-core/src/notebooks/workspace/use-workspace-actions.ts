"use client"

import { useLayoutEffect, useMemo, useRef } from "react"
import type { AskRequest } from "../types"
import type { WorkspaceActions } from "../workspace-context"
import type { PaneState } from "./use-pane-state"
import type { WorkspaceLayout } from "./use-workspace-layout"
import type { WorkspaceUrlState } from "./use-workspace-state"

type ActionSources = {
  notebookId: string
  layout: WorkspaceLayout
  url: WorkspaceUrlState
  panes: PaneState
  onAsk: (request: AskRequest) => void
  onOpenAddSources: () => void
}

/** What each action means in the current layout (a phone switches tabs, a tablet opens sheets, a desktop expands). */
function createActions({ notebookId, layout, url, panes, onAsk, onOpenAddSources }: ActionSources): WorkspaceActions {
  const closeSheet = () => panes.setSheet(null)
  return {
    notebookId,
    openSource: (sourceId, passageId) => {
      closeSheet()
      url.openSource(sourceId, passageId)
    },
    openArtifact: (artifactId) => {
      closeSheet()
      url.openArtifact(artifactId)
    },
    openNoteEditor: (sourceId) => {
      closeSheet()
      url.openNote(sourceId)
    },
    closeViewer: () => url.closeViewer(),
    showTab: (tab) => {
      if (layout === "phone") url.showTab(tab)
      else if (tab === "chat") {
        closeSheet()
        url.closeViewer()
      } else if (layout === "tablet") panes.setSheet(tab)
      else panes.setCollapsed(tab, false)
    },
    ask: (request) => {
      onAsk(request)
      closeSheet()
      if (layout === "phone") url.showTab("chat")
      else url.closeViewer()
    },
    openAddSources: onOpenAddSources,
  }
}

/**
 * The `WorkspaceActions` for the panes. The returned object never changes (panes put it in effect dependencies); the
 * functions always act on the latest state.
 */
export function useWorkspaceActions(sources: ActionSources): WorkspaceActions {
  const latest = useRef<WorkspaceActions>(createActions(sources))
  useLayoutEffect(() => {
    latest.current = createActions(sources)
  })
  const { notebookId } = sources
  return useMemo<WorkspaceActions>(
    () => ({
      notebookId,
      openSource: (sourceId, passageId) => latest.current.openSource(sourceId, passageId),
      openArtifact: (artifactId) => latest.current.openArtifact(artifactId),
      closeViewer: () => latest.current.closeViewer(),
      showTab: (tab) => latest.current.showTab(tab),
      ask: (request) => latest.current.ask(request),
      openAddSources: () => latest.current.openAddSources(),
      openNoteEditor: (sourceId) => latest.current.openNoteEditor(sourceId),
    }),
    [notebookId],
  )
}

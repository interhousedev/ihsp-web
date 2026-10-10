"use client"

import { createContext, useContext, type ReactNode } from "react"
import { WorkspaceProvider, type WorkspaceActions } from "../workspace-context"

const SharedViewerContext = createContext(false)

const NO_ACTIONS: WorkspaceActions = {
  notebookId: "",
  openSource: () => undefined,
  openArtifact: () => undefined,
  closeViewer: () => undefined,
  showTab: () => undefined,
  ask: () => undefined,
  openAddSources: () => undefined,
  openNoteEditor: () => undefined,
}

/**
 * Marks the viewers inside as a public, read-only view of a shared output: nothing is saved (progress, edits), and the
 * actions that need the owner's notebook (Explain, Ask in chat, Add as source, Save as set, Revise) are hidden. The
 * workspace actions are no-ops, so the same viewers render outside a notebook.
 */
export function SharedViewerProvider({ children }: { children: ReactNode }) {
  return (
    <SharedViewerContext.Provider value={true}>
      <WorkspaceProvider value={NO_ACTIONS}>{children}</WorkspaceProvider>
    </SharedViewerContext.Provider>
  )
}

/** True inside `SharedViewerProvider`. */
export function useSharedViewer(): boolean {
  return useContext(SharedViewerContext)
}

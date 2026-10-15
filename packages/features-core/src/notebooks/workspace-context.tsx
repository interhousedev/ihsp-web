"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { AskRequest, WorkspaceTab } from "./types"

/**
 * What the panes of a notebook workspace can ask of each other. `NotebookWorkspace` provides the real
 * implementation (URL state, chat); tests of single components provide spies (see `renderNotebook`).
 */
export type WorkspaceActions = {
  notebookId: string
  /** Opens the source viewer; with a passage it scrolls to it and highlights it. */
  openSource: (sourceId: string, passageId?: string) => void
  /** Opens an artifact viewer in the middle pane (a full screen on phones). */
  openArtifact: (artifactId: string) => void
  /** Closes any viewer and shows the chat again. */
  closeViewer: () => void
  showTab: (tab: WorkspaceTab) => void
  /** Closes any viewer, shows the chat and sends the question there. */
  ask: (request: AskRequest) => void
  openAddSources: () => void
  /** Shows the Sources pane with the web search box filled in (not started): the student sends it. */
  openWebSearch: (query: string) => void
  /** Opens the note editor; without a source id it creates a new note. */
  openNoteEditor: (sourceId?: string) => void
}

const WorkspaceContext = createContext<WorkspaceActions | null>(null)

export function WorkspaceProvider({ value, children }: { value: WorkspaceActions; children: ReactNode }) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

/** The actions of the workspace when there is one, else `null` (components that also work in isolation). */
export function useOptionalWorkspace(): WorkspaceActions | null {
  return useContext(WorkspaceContext)
}

/** The actions of the workspace the component is rendered in; throws outside a `WorkspaceProvider`. */
export function useWorkspace(): WorkspaceActions {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error("useWorkspace must be used inside a WorkspaceProvider (NotebookWorkspace)")
  return value
}

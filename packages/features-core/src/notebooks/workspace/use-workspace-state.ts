"use client"

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useCallback, useMemo } from "react"
import type { WorkspaceTab } from "../types"

export const WORKSPACE_TABS = ["sources", "chat", "studio"] as const

/** What the middle pane shows instead of the chat. */
export type WorkspaceViewer =
  | { kind: "source"; sourceId: string; passageId: string | null }
  | { kind: "artifact"; artifactId: string }
  /** The note editor; no `sourceId` means a new note. */
  | { kind: "note"; sourceId: string | null }

export const NEW_NOTE = "new"

const parsers = {
  tab: parseAsStringLiteral(WORKSPACE_TABS),
  source: parseAsString,
  passage: parseAsString,
  artifact: parseAsString,
  note: parseAsString,
  add: parseAsString,
}

const CLEARED = { source: null, passage: null, artifact: null, note: null } as const

export type WorkspaceUrlState = {
  /** The phone tab from `?tab=`; null when absent. */
  tab: WorkspaceTab | null
  viewer: WorkspaceViewer | null
  /** `?add=1` asks for the Add sources dialog once. */
  addRequested: boolean
  setTab: (tab: WorkspaceTab) => void
  /** Closes any viewer and sets the phone tab in one URL update. */
  showTab: (tab: WorkspaceTab) => void
  openSource: (sourceId: string, passageId?: string) => void
  openArtifact: (artifactId: string) => void
  openNote: (sourceId?: string) => void
  closeViewer: () => void
  clearAdd: () => void
}

/**
 * The workspace state that lives in the address (deep links): `tab`, `source`, `passage`, `artifact`, `note`, `add`.
 * Opening a viewer pushes a history entry so the browser Back closes the viewer first; tab and cleanup use `replace`.
 * Only one viewer is open at a time: opening one clears the others.
 */
export function useWorkspaceUrlState(): WorkspaceUrlState {
  const [query, setQuery] = useQueryStates(parsers)

  const viewer = useMemo<WorkspaceViewer | null>(() => {
    if (query.source) return { kind: "source", sourceId: query.source, passageId: query.passage }
    if (query.artifact) return { kind: "artifact", artifactId: query.artifact }
    if (query.note) return { kind: "note", sourceId: query.note === NEW_NOTE ? null : query.note }
    return null
  }, [query.source, query.passage, query.artifact, query.note])

  const setTab = useCallback((tab: WorkspaceTab) => void setQuery({ tab }, { history: "replace" }), [setQuery])
  const showTab = useCallback(
    (tab: WorkspaceTab) => void setQuery({ tab, ...CLEARED }, { history: "replace" }),
    [setQuery],
  )
  const openSource = useCallback(
    (sourceId: string, passageId?: string) =>
      void setQuery({ ...CLEARED, source: sourceId, passage: passageId ?? null }, { history: "push" }),
    [setQuery],
  )
  const openArtifact = useCallback(
    (artifactId: string) => void setQuery({ ...CLEARED, artifact: artifactId }, { history: "push" }),
    [setQuery],
  )
  const openNote = useCallback(
    (sourceId?: string) => void setQuery({ ...CLEARED, note: sourceId ?? NEW_NOTE }, { history: "push" }),
    [setQuery],
  )
  const closeViewer = useCallback(() => void setQuery(CLEARED, { history: "replace" }), [setQuery])
  const clearAdd = useCallback(() => void setQuery({ add: null }, { history: "replace" }), [setQuery])

  return {
    tab: query.tab,
    viewer,
    addRequested: query.add === "1",
    setTab,
    showTab,
    openSource,
    openArtifact,
    openNote,
    closeViewer,
    clearAdd,
  }
}

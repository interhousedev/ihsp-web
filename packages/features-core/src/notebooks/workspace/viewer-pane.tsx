"use client"

import { ArtifactViewer, NoteEditor, SourceViewer } from "./panes"
import type { WorkspaceViewer } from "./use-workspace-state"

type ViewerPaneProps = {
  notebookId: string
  viewer: WorkspaceViewer
}

/** The viewer that replaces the chat: a source, an artifact or the note editor. They have their own Back button. */
export function ViewerPane({ notebookId, viewer }: ViewerPaneProps) {
  switch (viewer.kind) {
    case "source":
      return (
        <SourceViewer
          key={`source:${viewer.sourceId}`}
          notebookId={notebookId}
          sourceId={viewer.sourceId}
          passageId={viewer.passageId}
        />
      )
    case "artifact":
      return (
        <ArtifactViewer key={`artifact:${viewer.artifactId}`} notebookId={notebookId} artifactId={viewer.artifactId} />
      )
    case "note":
      return <NoteEditor key={`note:${viewer.sourceId ?? "new"}`} notebookId={notebookId} sourceId={viewer.sourceId} />
  }
}

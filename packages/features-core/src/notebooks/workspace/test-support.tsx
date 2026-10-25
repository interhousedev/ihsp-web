// Test helpers of the workspace (not exported from the package): stand-ins for the panes other tasks own, and the
// viewport width the way `useWorkspaceLayout` reads it.
import type { NotebookDetail } from "@ihsp/api"
import type { ReactNode } from "react"
import type { AskRequest } from "../types"
import { useWorkspace } from "../workspace-context"

/** Sets `window.innerWidth` and tells the hooks that listen to `resize`. */
export function setWindowWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
  window.dispatchEvent(new Event("resize"))
}

function SourcesPanel({ notebook, onCollapse }: { notebook: NotebookDetail; onCollapse?: () => void }) {
  const workspace = useWorkspace()
  return (
    <div data-testid="sources-panel">
      <span>{`sources of ${notebook.title}`}</span>
      <button type="button" onClick={() => workspace.openSource("src-1", "pas-1")}>
        open source
      </button>
      <button type="button" onClick={() => workspace.openNoteEditor()}>
        new note
      </button>
      <button type="button" onClick={() => workspace.ask({ text: "Explain the topic" })}>
        ask from sources
      </button>
      {onCollapse ? (
        <button type="button" onClick={onCollapse}>
          collapse sources
        </button>
      ) : null}
    </div>
  )
}

function StudioPanel({ notebook, onCollapse }: { notebook: NotebookDetail; onCollapse?: () => void }) {
  const workspace = useWorkspace()
  return (
    <div data-testid="studio-panel">
      <span>{`studio of ${notebook.title}`}</span>
      <button type="button" onClick={() => workspace.openArtifact("art-1")}>
        open artifact
      </button>
      {onCollapse ? (
        <button type="button" onClick={onCollapse}>
          collapse studio
        </button>
      ) : null}
    </div>
  )
}

function NotebookChat({
  pendingAsk,
  onAskHandled,
}: {
  notebook: NotebookDetail
  pendingAsk: AskRequest | null
  onAskHandled: () => void
}) {
  return (
    <div data-testid="notebook-chat">
      <textarea data-notebook-composer aria-label="composer" />
      <output data-testid="pending-ask">{pendingAsk?.text ?? ""}</output>
      <button type="button" onClick={onAskHandled}>
        handle ask
      </button>
    </div>
  )
}

function ViewerFrame({ testId, children }: { testId: string; children: ReactNode }) {
  const workspace = useWorkspace()
  return (
    <div data-testid={testId}>
      {children}
      <button type="button" onClick={() => workspace.closeViewer()}>
        back to chat
      </button>
    </div>
  )
}

function SourceViewer({ sourceId, passageId }: { notebookId: string; sourceId: string; passageId?: string | null }) {
  return (
    <ViewerFrame testId="source-viewer">
      <span data-testid="viewer-source">{sourceId}</span>
      <span data-testid="viewer-passage">{passageId ?? ""}</span>
    </ViewerFrame>
  )
}

function ArtifactViewer({ artifactId }: { notebookId: string; artifactId: string }) {
  return (
    <ViewerFrame testId="artifact-viewer">
      <span data-testid="viewer-artifact">{artifactId}</span>
    </ViewerFrame>
  )
}

function NoteEditor({ sourceId }: { notebookId: string; sourceId?: string | null }) {
  return (
    <ViewerFrame testId="note-editor">
      <span data-testid="viewer-note">{sourceId ?? "new"}</span>
    </ViewerFrame>
  )
}

function AddSourcesDialog({ open }: { notebookId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return open ? <div data-testid="add-sources-dialog" /> : null
}

function ChatConfigDialog({
  open,
}: {
  notebook: NotebookDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return open ? <div data-testid="chat-config-dialog" /> : null
}

function UsageDialog({ open }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return open ? <div data-testid="usage-dialog" /> : null
}

/** The factory for `mock.module("./panes", paneMocks)`. */
export function paneMocks() {
  return {
    SourcesPanel,
    StudioPanel,
    NotebookChat,
    SourceViewer,
    ArtifactViewer,
    NoteEditor,
    AddSourcesDialog,
    ChatConfigDialog,
    UsageDialog,
  }
}

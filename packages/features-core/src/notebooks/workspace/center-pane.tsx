"use client"

import type { NotebookDetail } from "@ihsp/api"
import type { AskRequest } from "../types"
import { ChatPane } from "./chat-pane"
import type { WorkspaceViewer } from "./use-workspace-state"
import { ViewerPane } from "./viewer-pane"

export type CenterPaneProps = {
  notebook: NotebookDetail
  viewer: WorkspaceViewer | null
  pendingAsk: AskRequest | null
  onAskHandled: () => void
}

/** The middle of the desktop and the whole tablet layout: the chat, replaced by a viewer while one is open. */
export function CenterPane({ notebook, viewer, pendingAsk, onAskHandled }: CenterPaneProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col print:block">
      {viewer ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto print:h-auto print:overflow-visible">
          <ViewerPane notebookId={notebook.id} viewer={viewer} />
        </div>
      ) : null}
      <ChatPane notebook={notebook} pendingAsk={pendingAsk} onAskHandled={onAskHandled} covered={viewer !== null} />
    </div>
  )
}

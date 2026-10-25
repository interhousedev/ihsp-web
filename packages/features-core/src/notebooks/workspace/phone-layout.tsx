"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useState } from "react"
import type { AskRequest, WorkspaceTab } from "../types"
import { ChatPane } from "./chat-pane"
import { PhoneTabBar, TAB_PANEL_IDS } from "./phone-tab-bar"
import { SourcesSection } from "./sources-section"
import { StudioSection } from "./studio-section"
import type { WorkspaceViewer } from "./use-workspace-state"
import { ViewerPane } from "./viewer-pane"

type PhoneLayoutProps = {
  notebook: NotebookDetail
  /** The tab shown now (from `?tab=`, else Chat when the notebook has sources, else Sources). */
  tab: WorkspaceTab
  onTabChange: (tab: WorkspaceTab) => void
  viewer: WorkspaceViewer | null
  pendingAsk: AskRequest | null
  onAskHandled: () => void
}

/**
 * Below 768 px: one full-height page per tab under a top tab bar. A viewer takes the whole screen (no header, no tab
 * bar). The chat is always mounted so a running answer survives tab changes; Sources and Studio mount on first visit.
 */
export function PhoneLayout({ notebook, tab, onTabChange, viewer, pendingAsk, onAskHandled }: PhoneLayoutProps) {
  const [visited, setVisited] = useState<ReadonlySet<WorkspaceTab>>(() => new Set([tab]))
  if (!visited.has(tab)) setVisited(new Set([...visited, tab]))

  const covered = viewer !== null
  return (
    <>
      {viewer ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto print:h-auto print:overflow-visible">
          <ViewerPane notebookId={notebook.id} viewer={viewer} />
        </div>
      ) : null}
      <div hidden={covered} className="flex min-h-0 flex-1 flex-col print:hidden">
        <PhoneTabBar active={tab} onSelect={onTabChange} />
        <div className="flex min-h-0 flex-1 flex-col">
          {visited.has("sources") ? (
            <div hidden={tab !== "sources"} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <SourcesSection notebook={notebook} id={TAB_PANEL_IDS.sources} />
            </div>
          ) : null}
          <ChatPane
            id={TAB_PANEL_IDS.chat}
            notebook={notebook}
            pendingAsk={pendingAsk}
            onAskHandled={onAskHandled}
            covered={covered || tab !== "chat"}
          />
          {visited.has("studio") ? (
            <div hidden={tab !== "studio"} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <StudioSection notebook={notebook} id={TAB_PANEL_IDS.studio} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

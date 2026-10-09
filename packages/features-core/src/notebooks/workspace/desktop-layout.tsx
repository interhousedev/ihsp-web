"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@ihsp/ui"
import { IconBooks, IconWand } from "@tabler/icons-react"
import { useDefaultLayout, type LayoutStorage } from "react-resizable-panels"
import type { AskRequest } from "../types"
import { CenterPane } from "./center-pane"
import { CollapsiblePane } from "./collapsible-pane"
import { PaneRail } from "./pane-rail"
import { SourcesSection } from "./sources-section"
import { StudioSection } from "./studio-section"
import type { PaneState } from "./use-pane-state"
import type { WorkspaceViewer } from "./use-workspace-state"

const LAYOUT_ID = "ihsp-notebook-workspace"

/** localStorage that never throws (private windows, blocked storage, prerendering). */
const safeStorage: LayoutStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // The layout is a convenience; losing it is fine.
    }
  },
}

type DesktopLayoutProps = {
  notebook: NotebookDetail
  viewer: WorkspaceViewer | null
  pendingAsk: AskRequest | null
  onAskHandled: () => void
  panes: PaneState
}

/** From 1280 px: Sources 320 | Chat or viewer | Studio 360, resizable, side panels collapse to a 56 px rail. */
export function DesktopLayout({ notebook, viewer, pendingAsk, onAskHandled, panes }: DesktopLayoutProps) {
  const t = useT("notebooks")
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    panelIds: ["sources", "chat", "studio"],
    storage: safeStorage,
  })

  return (
    <ResizablePanelGroup
      id={LAYOUT_ID}
      orientation="horizontal"
      className="min-h-0 flex-1 print:block! print:h-auto! print:overflow-visible!"
      {...(defaultLayout ? { defaultLayout } : {})}
      onLayoutChanged={onLayoutChanged}
    >
      <CollapsiblePane
        id="sources"
        defaultSize={320}
        minSize={260}
        collapsed={panes.collapsed.sources}
        onCollapsedChange={(collapsed) => panes.setCollapsed("sources", collapsed)}
        rail={
          <PaneRail
            label={t("workspace.showSources")}
            icon={<IconBooks />}
            badge={notebook.source_count}
            onExpand={() => panes.setCollapsed("sources", false)}
          />
        }
      >
        <SourcesSection notebook={notebook} onCollapse={() => panes.setCollapsed("sources", true)} />
      </CollapsiblePane>
      <ResizableHandle withHandle aria-label={t("workspace.resizeSources")} className="print:hidden" />
      <ResizablePanel
        id="chat"
        minSize={480}
        className="flex min-w-0 flex-col print:block! print:overflow-visible!"
        style={{ overflow: "hidden" }}
      >
        <CenterPane notebook={notebook} viewer={viewer} pendingAsk={pendingAsk} onAskHandled={onAskHandled} />
      </ResizablePanel>
      <ResizableHandle withHandle aria-label={t("workspace.resizeStudio")} className="print:hidden" />
      <CollapsiblePane
        id="studio"
        defaultSize={360}
        minSize={300}
        collapsed={panes.collapsed.studio}
        onCollapsedChange={(collapsed) => panes.setCollapsed("studio", collapsed)}
        rail={
          <PaneRail
            label={t("workspace.showStudio")}
            icon={<IconWand />}
            onExpand={() => panes.setCollapsed("studio", false)}
          />
        }
      >
        <StudioSection notebook={notebook} onCollapse={() => panes.setCollapsed("studio", true)} />
      </CollapsiblePane>
    </ResizablePanelGroup>
  )
}

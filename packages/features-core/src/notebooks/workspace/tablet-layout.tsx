"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@ihsp/ui"
import type { AskRequest } from "../types"
import { CenterPane } from "./center-pane"
import { SourcesSection } from "./sources-section"
import { StudioSection } from "./studio-section"
import type { PaneState } from "./use-pane-state"
import type { WorkspaceViewer } from "./use-workspace-state"

type TabletLayoutProps = {
  notebook: NotebookDetail
  viewer: WorkspaceViewer | null
  pendingAsk: AskRequest | null
  onAskHandled: () => void
  panes: PaneState
}

const SHEET_CLASS =
  "w-[min(26rem,100vw)] gap-0 p-0 print:hidden data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md"

/** 768 to 1279 px: the chat fills the page, Sources and Studio open as side sheets from the header. */
export function TabletLayout({ notebook, viewer, pendingAsk, onAskHandled, panes }: TabletLayoutProps) {
  const t = useT("notebooks")
  return (
    <>
      <CenterPane notebook={notebook} viewer={viewer} pendingAsk={pendingAsk} onAskHandled={onAskHandled} />
      <Sheet open={panes.sheet === "sources"} onOpenChange={(open) => panes.setSheet(open ? "sources" : null)}>
        <SheetContent side="left" showCloseButton className={SHEET_CLASS}>
          <SheetTitle className="sr-only">{t("tabs.sources")}</SheetTitle>
          <SheetDescription className="sr-only">{t("workspace.sheetDescription")}</SheetDescription>
          <SourcesSection notebook={notebook} />
        </SheetContent>
      </Sheet>
      <Sheet open={panes.sheet === "studio"} onOpenChange={(open) => panes.setSheet(open ? "studio" : null)}>
        <SheetContent side="right" showCloseButton className={SHEET_CLASS}>
          <SheetTitle className="sr-only">{t("tabs.studio")}</SheetTitle>
          <SheetDescription className="sr-only">{t("workspace.sheetDescription")}</SheetDescription>
          <StudioSection notebook={notebook} />
        </SheetContent>
      </Sheet>
    </>
  )
}

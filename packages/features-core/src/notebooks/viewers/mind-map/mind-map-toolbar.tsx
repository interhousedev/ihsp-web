"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCopy,
  IconDownload,
  IconFileText,
  IconFocusCentered,
  IconFoldUp,
  IconListTree,
  IconNote,
  IconZoomIn,
  IconZoomOut,
} from "@ihsp/ui"
import type { ComponentType, SVGProps } from "react"

export type MindMapView = "map" | "outline"

type MindMapToolbarProps = {
  view: MindMapView
  /** Floats over the canvas in the map view; a plain bar above the list in the outline view. */
  floating: boolean
  /** Inside Telegram downloads can be blocked, so the outline can also be copied. */
  showCopy: boolean
  onToggleView: () => void
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onDownloadPng: () => void
  onDownloadOutline: () => void
  onCopyOutline: () => void
  /** «Сжать»: the automatic layout again. */
  onTidy: () => void
  onAddBlock: () => void
}

type ToolButtonProps = {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  onClick: () => void
  pressed?: boolean
}

function ToolButton({ label, icon: Icon, onClick, pressed }: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant={pressed ? "secondary" : "ghost"}
      size="icon"
      className="size-11 md:size-8"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon aria-hidden />
    </Button>
  )
}

/** The toolbar of the mind map: fit and zoom (map view only), expand/collapse all, the view switch and downloads. */
export function MindMapToolbar({
  view,
  floating,
  showCopy,
  onToggleView,
  onFit,
  onZoomIn,
  onZoomOut,
  onExpandAll,
  onCollapseAll,
  onDownloadPng,
  onDownloadOutline,
  onCopyOutline,
  onTidy,
  onAddBlock,
}: MindMapToolbarProps) {
  const t = useT("notebooks")
  return (
    <div
      role="group"
      aria-label={t("mindmap.toolbar")}
      data-slot="mind-map-toolbar"
      className={cn(
        "bg-background/90 flex flex-wrap items-center gap-0.5 rounded-xl border p-1 shadow-sm backdrop-blur",
        floating
          ? "absolute end-3 top-3 z-10 max-w-[calc(100%-1.5rem)] justify-end"
          : "sticky top-0 z-10 m-2 w-fit max-w-[calc(100%-1rem)] self-end",
      )}
    >
      {view === "map" ? (
        <>
          <ToolButton label={t("mindmap.fit")} icon={IconFocusCentered} onClick={onFit} />
          <ToolButton label={t("mindmap.zoomIn")} icon={IconZoomIn} onClick={onZoomIn} />
          <ToolButton label={t("mindmap.zoomOut")} icon={IconZoomOut} onClick={onZoomOut} />
          <ToolButton label={t("mindmap.addBlock")} icon={IconNote} onClick={onAddBlock} />
          <ToolButton label={t("mindmap.tidy")} icon={IconArrowsMinimize} onClick={onTidy} />
        </>
      ) : null}
      <ToolButton label={t("mindmap.expandAll")} icon={IconArrowsMaximize} onClick={onExpandAll} />
      <ToolButton label={t("mindmap.collapseAll")} icon={IconFoldUp} onClick={onCollapseAll} />
      <ToolButton
        label={t("mindmap.listView")}
        icon={IconListTree}
        onClick={onToggleView}
        pressed={view === "outline"}
      />
      <ToolButton label={t("mindmap.download")} icon={IconDownload} onClick={onDownloadPng} />
      <ToolButton label={t("mindmap.downloadOutline")} icon={IconFileText} onClick={onDownloadOutline} />
      {showCopy ? <ToolButton label={t("mindmap.copyOutline")} icon={IconCopy} onClick={onCopyOutline} /> : null}
    </div>
  )
}

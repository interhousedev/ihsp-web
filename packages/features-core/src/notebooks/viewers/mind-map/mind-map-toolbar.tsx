"use client"

import { useT } from "@ihsp/i18n"
import { IconButton, cn } from "@ihsp/ui"
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
import type { ComponentProps, ComponentType, SVGProps } from "react"
import { OverflowMenu, type OverflowItem } from "../overflow-menu"

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

function ToolButton({ label, icon, onClick, pressed }: ToolButtonProps) {
  return (
    <IconButton
      icon={icon as ComponentProps<typeof IconButton>["icon"]}
      variant={pressed ? "secondary" : "ghost"}
      className="size-11 md:size-8"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    />
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
  const items: OverflowItem[] = [
    ...(view === "map"
      ? [
          { key: "add", label: t("mindmap.addBlock"), icon: IconNote, onSelect: onAddBlock },
          { key: "tidy", label: t("mindmap.tidy"), icon: IconArrowsMinimize, onSelect: onTidy },
        ]
      : []),
    { key: "expand", label: t("mindmap.expandAll"), icon: IconArrowsMaximize, onSelect: onExpandAll },
    { key: "collapse", label: t("mindmap.collapseAll"), icon: IconFoldUp, onSelect: onCollapseAll },
    { key: "png", label: t("mindmap.download"), icon: IconDownload, onSelect: onDownloadPng },
    { key: "md", label: t("mindmap.downloadOutline"), icon: IconFileText, onSelect: onDownloadOutline },
    ...(showCopy ? [{ key: "copy", label: t("mindmap.copyOutline"), icon: IconCopy, onSelect: onCopyOutline }] : []),
  ]
  return (
    <div
      role="group"
      aria-label={t("mindmap.toolbar")}
      data-slot="mind-map-toolbar"
      className={cn(
        "bg-background/90 flex flex-nowrap items-center gap-0.5 rounded-xl border p-1.5 md:p-1 shadow-sm backdrop-blur",
        floating
          ? "absolute end-3 top-3 z-10 max-w-[calc(100%-1.5rem)] justify-end overflow-x-auto"
          : "sticky top-0 z-10 m-2 w-fit max-w-[calc(100%-1rem)] self-end overflow-x-auto",
      )}
    >
      {view === "map" ? (
        <>
          <ToolButton label={t("mindmap.fit")} icon={IconFocusCentered} onClick={onFit} />
          <ToolButton label={t("mindmap.zoomIn")} icon={IconZoomIn} onClick={onZoomIn} />
          <ToolButton label={t("mindmap.zoomOut")} icon={IconZoomOut} onClick={onZoomOut} />
        </>
      ) : null}
      <ToolButton
        label={t("mindmap.listView")}
        icon={IconListTree}
        onClick={onToggleView}
        pressed={view === "outline"}
      />
      <OverflowMenu label={t("mindmap.more")} items={items} />
    </div>
  )
}

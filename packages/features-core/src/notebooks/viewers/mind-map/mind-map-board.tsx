"use client"

import type { MindMapContent, RefsIndex } from "@ihsp/api"
import { isMiniApp } from "@ihsp/telegram"
import { useRef, useState } from "react"
import { MindMapCanvas } from "./mind-map-canvas"
import { MindMapDetails } from "./mind-map-details"
import { MindMapList } from "./mind-map-list"
import { MindMapToolbar } from "./mind-map-toolbar"
import { toScreen } from "./transform"
import { useMindMapExport } from "./use-mind-map-export"
import { useMindMapNavigation } from "./use-mind-map-navigation"
import { useMindMapTree } from "./use-mind-map-tree"
import { useMindMapView } from "./use-mind-map-view"
import { usePanZoom } from "./use-pan-zoom"

type MindMapBoardProps = {
  content: MindMapContent
  refsIndex: RefsIndex
}

/** The mind map: the canvas or the outline, the toolbar and the details of the selected node. */
export function MindMapBoard({ content, refsIndex }: MindMapBoardProps) {
  const state = useMindMapTree(content)
  const panZoom = usePanZoom(state.layout.bounds)
  const nav = useMindMapNavigation(state, panZoom)
  const [view, setView] = useMindMapView()
  const [miniApp] = useState(() => isMiniApp())
  const host = useRef<HTMLDivElement | null>(null)
  const exporter = useMindMapExport({ title: content.title, layout: state.layout, outline: state.outline, host })

  const selected = state.layout.nodes.find((item) => item.id === nav.selectedId)
  const anchor = selected ? toScreen(panZoom.transform, selected) : null
  const mapView = view === "map"

  return (
    <div
      ref={host}
      data-slot="mind-map-viewer"
      className="bg-muted/30 relative flex h-full min-h-96 w-full flex-1 flex-col overflow-hidden"
    >
      <MindMapToolbar
        view={view}
        floating={mapView}
        showCopy={miniApp}
        onToggleView={() => setView(mapView ? "outline" : "map")}
        onFit={() => panZoom.fit()}
        onZoomIn={panZoom.zoomIn}
        onZoomOut={panZoom.zoomOut}
        onExpandAll={nav.expandAll}
        onCollapseAll={nav.collapseAll}
        onDownloadPng={() => void exporter.downloadPng()}
        onDownloadOutline={exporter.downloadOutline}
        onCopyOutline={() => void exporter.copyOutline()}
      />
      {exporter.error ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive absolute start-3 bottom-3 z-10 max-w-[calc(100%-1.5rem)] rounded-lg px-3 py-2 text-sm"
        >
          {exporter.error}
        </p>
      ) : null}
      {mapView ? (
        <MindMapCanvas title={content.title} layout={state.layout} panZoom={panZoom} nav={nav} />
      ) : state.tree ? (
        <MindMapList
          tree={state.tree}
          title={content.title}
          collapsed={state.collapsed}
          refsIndex={refsIndex}
          onToggle={nav.toggle}
        />
      ) : null}
      {mapView && selected && anchor ? (
        <MindMapDetails
          key={selected.id}
          item={selected}
          refsIndex={refsIndex}
          anchor={anchor}
          size={panZoom.size}
          onToggle={() => nav.toggle(selected.id)}
          onClose={nav.closeDetails}
        />
      ) : null}
    </div>
  )
}

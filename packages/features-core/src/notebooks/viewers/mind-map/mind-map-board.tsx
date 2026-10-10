"use client"

import type { MindMapContent, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { isMiniApp } from "@ihsp/telegram"
import { useCallback, useMemo, useRef, useState } from "react"
import { DEFAULT_COLUMN_GAP } from "./layout"
import { MindMapCanvas } from "./mind-map-canvas"
import { MindMapDetails } from "./mind-map-details"
import { MindMapLabelEditor } from "./mind-map-label-editor"
import { MindMapList } from "./mind-map-list"
import { MindMapToolbar } from "./mind-map-toolbar"
import { placeBlocks } from "./positions"
import { toScreen } from "./transform"
import { useMindMapEdit } from "./use-mind-map-edit"
import { useMindMapExport } from "./use-mind-map-export"
import { useMindMapNavigation } from "./use-mind-map-navigation"
import { useMindMapTree } from "./use-mind-map-tree"
import { useMindMapView } from "./use-mind-map-view"
import { useNodeDrag } from "./use-node-drag"
import { usePanZoom } from "./use-pan-zoom"

type MindMapBoardProps = {
  notebookId: string
  artifactId: string
  content: MindMapContent
  refsIndex: RefsIndex
  /** `progress_state` of the artifact: positions and the student's own nodes. */
  saved: Record<string, unknown> | null
}

type Editing = { kind: "node" | "block"; id: string }

const CHILD_STEP = 56

/** The mind map: the canvas or the outline, the toolbar and the details of the selected node. */
export function MindMapBoard({ notebookId, artifactId, content, refsIndex, saved }: MindMapBoardProps) {
  const t = useT("notebooks")
  const edit = useMindMapEdit({
    notebookId,
    artifactId,
    original: content.nodes,
    saved,
    labels: { node: t("mindmap.newNode"), block: t("mindmap.newBlock") },
  })
  const state = useMindMapTree(edit.nodes, edit.positions)
  const panZoom = usePanZoom(state.layout.bounds)
  const blocks = useMemo(
    () => placeBlocks(edit.blocks, edit.positions, state.layout.bounds),
    [edit.blocks, edit.positions, state.layout.bounds],
  )

  // The drag reads the freshest positions through a ref, so that the listeners are attached once.
  const where = useRef<(id: string) => { x: number; y: number } | undefined>(() => undefined)
  where.current = (id) => state.layout.nodes.find((item) => item.id === id) ?? blocks.find((block) => block.id === id)
  const positionOf = useCallback((id: string) => where.current(id), [])
  const drag = useNodeDrag({
    element: panZoom.element,
    getTransform: panZoom.getTransform,
    positionOf,
    onMove: edit.moveTo,
  })
  const { wasDragged: panDragged } = panZoom
  const { wasDragged: nodeDragged } = drag
  const wasDragged = useCallback(() => panDragged() || nodeDragged(), [panDragged, nodeDragged])

  const nav = useMindMapNavigation(state, { ...panZoom, wasDragged })
  const [view, setView] = useMindMapView()
  const [miniApp] = useState(() => isMiniApp())
  const [editing, setEditing] = useState<Editing | null>(null)
  const host = useRef<HTMLDivElement | null>(null)
  const exporter = useMindMapExport({
    title: content.title,
    layout: state.layout,
    outline: state.outline,
    host,
  })

  const selected = state.layout.nodes.find((item) => item.id === nav.selectedId)
  const anchor = selected ? toScreen(panZoom.transform, selected) : null
  const mapView = view === "map"
  const byHand = Object.keys(edit.positions).length > 0

  function openBranch(id: string) {
    if (!state.collapsed.has(id)) return
    const next = new Set(state.collapsed)
    next.delete(id)
    state.setCollapsed(next)
  }

  function addChildOf(parentId: string) {
    const parent = state.layout.nodes.find((item) => item.id === parentId)
    const siblings = edit.nodes.filter((node) => node.parent_id === parentId).length
    // When the map is laid out by hand the newcomer lands next to its parent; otherwise the layout places it.
    const at =
      byHand && parent
        ? {
            x: parent.x + parent.width + DEFAULT_COLUMN_GAP,
            y: parent.y + siblings * CHILD_STEP,
          }
        : undefined
    openBranch(parentId)
    const id = edit.addNode(parentId, at)
    setEditing({ kind: "node", id })
  }

  function addSiblingOf(id: string) {
    const parentId = edit.nodes.find((node) => node.id === id)?.parent_id
    if (parentId) addChildOf(parentId)
  }

  function addBlock() {
    setEditing({ kind: "block", id: edit.addBlock() })
  }

  function tidy() {
    edit.tidy()
    panZoom.fit(true, state.tidyFor(state.collapsed).bounds)
  }

  const editedNode = editing?.kind === "node" ? state.layout.nodes.find((item) => item.id === editing.id) : undefined
  const editedBlock = editing?.kind === "block" ? blocks.find((block) => block.id === editing.id) : undefined
  const editBox = editedNode ?? editedBlock
  const nodeHandlers = selected
    ? {
        isRoot: selected.parentId === null,
        onAddChild: () => addChildOf(selected.id),
        onAddSibling: () => addSiblingOf(selected.id),
        onEdit: () => {
          nav.closeDetails()
          setEditing({ kind: "node", id: selected.id })
        },
        onDelete: () => {
          nav.closeDetails()
          edit.removeNode(selected.id)
        },
      }
    : undefined

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
        onTidy={tidy}
        onAddBlock={addBlock}
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
        <MindMapCanvas
          title={content.title}
          layout={state.layout}
          panZoom={panZoom}
          nav={nav}
          blocks={blocks}
          onEdit={(id) => setEditing({ kind: "node", id })}
          onEditBlock={(id) => setEditing({ kind: "block", id })}
        />
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
          edit={nodeHandlers}
        />
      ) : null}
      {mapView && editing && editBox ? (
        <MindMapLabelEditor
          key={`${editing.kind}:${editing.id}`}
          box={toScreen(panZoom.transform, editBox)}
          value={editedNode ? editedNode.node.label : (editedBlock?.text ?? "")}
          onCancel={() => setEditing(null)}
          onCommit={(value) => {
            setEditing(null)
            if (editing.kind === "node") {
              if (value !== "") edit.renameNode(editing.id, value)
            } else if (value === "") edit.removeBlock(editing.id)
            else edit.renameBlock(editing.id, value)
          }}
          onDelete={
            editing.kind === "block"
              ? () => {
                  setEditing(null)
                  edit.removeBlock(editing.id)
                }
              : undefined
          }
        />
      ) : null}
    </div>
  )
}

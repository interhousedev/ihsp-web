"use client"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { type CSSProperties, useState } from "react"
import { TileColor } from "./editor/tile-color"
import { inOrder, spanOf, type Widget } from "./model"
import { WIDGET_VIEWS } from "./widgets"

/** Arrow keys on a selected tile move it one place. */
const KEY_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
}

/** A finger must rest this long on the handle before the tile lifts, so a swipe still scrolls the page. */
const TOUCH_HOLD_MS = 250

function Tile({
  widget,
  index,
  editing,
  selected,
  onSelect,
  onMove,
  onColor,
}: {
  widget: Widget
  index: number
  editing: boolean
  selected: boolean
  onSelect: (id: string) => void
  onMove: (id: string, toIndex: number) => void
  onColor: (id: string, color: string | null) => void
}) {
  const t = useT("today.dashboard")
  const View = WIDGET_VIEWS[widget.kind]
  const { cols, rows } = spanOf(widget.size)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  })
  const style = {
    "--cols": cols,
    "--scols": Math.min(cols, 2),
    "--rows": rows,
    transform: CSS.Translate.toString(transform),
    transition: transition ?? "transform 200ms ease",
  } as CSSProperties
  return (
    <div
      ref={setNodeRef}
      data-tile-id={widget.id}
      data-widget-cell={widget.size}
      className={`relative min-h-32 min-w-0 sm:[grid-column:span_var(--scols)] md:[grid-column:span_var(--cols)] md:[grid-row:span_var(--rows)] md:min-h-0 ${isDragging ? "border-primary/60 bg-primary/5 rounded-3xl border-2 border-dashed [&>*]:invisible" : ""}`}
      style={style}
    >
      <View widget={widget} editing={editing} />
      {editing ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("editTile", { title: t(`kinds.${widget.kind}`) })}
          aria-pressed={selected}
          title={t("dragHandle")}
          onClick={() => onSelect(widget.id)}
          onPointerDown={(event) => {
            onSelect(widget.id)
            listeners?.onPointerDown?.(event)
          }}
          onKeyDown={(event) => {
            const step = KEY_STEP[event.key]
            if (step === undefined) {
              listeners?.onKeyDown?.(event)
              return
            }
            event.preventDefault()
            onMove(widget.id, index + step)
          }}
          style={{ touchAction: "manipulation" }}
          className={`focus-visible:ring-ring absolute inset-0 z-10 cursor-grab rounded-3xl outline-none focus-visible:ring-2 ${selected ? "ring-primary ring-4" : ""}`}
        >
          {selected ? null : <Icons.gripVertical aria-hidden className="absolute top-2 right-2 size-4 opacity-60" />}
        </button>
      ) : null}
      {editing && selected && !isDragging ? (
        <TileColor
          color={widget.color}
          onColor={(color) => onColor(widget.id, color)}
          className="absolute top-2 right-2 z-20"
        />
      ) : null}
    </div>
  )
}

/**
 * A responsive CSS grid: four columns from `md` (every row `--dashboard-row` tall, so a row's tiles stretch to equal
 * height and long content scrolls inside its card), two columns at `sm`, and one column on a phone where tiles size
 * to their content so nothing is clipped. Outside edit mode nothing intercepts touches, so the page scrolls (also in
 * the Telegram mini app). In edit mode a tile is selected with a click or tap and moved by dragging (mouse, or a finger
 * after a short hold; the page auto-scrolls near its edges) or with the arrow keys / the dnd-kit keyboard; a lifted
 * copy follows the pointer while a dashed slot marks the place.
 */
export function DashboardGrid({
  widgets,
  editing,
  selectedId,
  onSelect,
  onMove,
  onColor,
}: {
  widgets: readonly Widget[]
  editing: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, toIndex: number) => void
  onColor: (id: string, color: string | null) => void
}) {
  const ordered = inOrder(widgets)
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = ordered.find((widget) => widget.id === activeId) ?? null
  const ActiveView = active ? WIDGET_VIEWS[active.kind] : null
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: TOUCH_HOLD_MS, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragStart({ active: dragged }: DragStartEvent) {
    setActiveId(String(dragged.id))
  }

  function onDragEnd({ active: dragged, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || dragged.id === over.id) return
    const to = ordered.findIndex((widget) => widget.id === over.id)
    if (to >= 0) onMove(String(dragged.id), to)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={ordered.map((widget) => widget.id)} strategy={rectSortingStrategy}>
        <div
          className="grid auto-rows-auto grid-flow-dense grid-cols-1 gap-3 [--dashboard-row:10rem] sm:grid-cols-2 md:auto-rows-[var(--dashboard-row)] md:grid-cols-4"
          data-testid="dashboard-grid"
        >
          {ordered.map((widget, index) => (
            <Tile
              key={widget.id}
              widget={widget}
              index={index}
              editing={editing}
              selected={widget.id === selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onColor={onColor}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {active && ActiveView ? (
          <div className="h-full scale-[1.03] rounded-3xl shadow-2xl">
            <ActiveView widget={active} editing />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { type CSSProperties, useEffect, useState } from "react"
import { inOrder, spanOf, type Widget } from "./model"
import { WIDGET_VIEWS } from "./widgets"

/** Arrow keys on a selected tile move it one place. */
const KEY_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
}

/**
 * The widgets in one column (phone) or on a 4-column grid (desktop); each row is as tall as its content. In edit mode a
 * tile is selected with a click or tap and moved by dragging (mouse, pen or finger: pointer events) or with the arrow keys.
 */
export function DashboardGrid({
  widgets,
  editing,
  selectedId,
  onSelect,
  onMove,
}: {
  widgets: readonly Widget[]
  editing: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, toIndex: number) => void
}) {
  const t = useT("today.dashboard")
  const ordered = inOrder(widgets)
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    if (!dragId) return
    const move = (event: PointerEvent) => {
      const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-tile-id]")
      const overId = tile?.dataset.tileId
      if (!overId || overId === dragId) return
      const index = ordered.findIndex((widget) => widget.id === overId)
      if (index >= 0) onMove(dragId, index)
    }
    const stop = () => setDragId(null)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
    window.addEventListener("pointercancel", stop)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
      window.removeEventListener("pointercancel", stop)
    }
  }, [dragId, ordered, onMove])

  return (
    <div
      className="grid auto-rows-min grid-flow-dense grid-cols-1 items-start gap-3 md:grid-cols-4"
      data-testid="dashboard-grid"
    >
      {ordered.map((widget, index) => {
        const View = WIDGET_VIEWS[widget.kind]
        const { cols, rows } = spanOf(widget.size)
        const selected = widget.id === selectedId
        return (
          <div
            key={widget.id}
            data-tile-id={widget.id}
            className={`relative min-w-0 md:[grid-column:span_var(--cols)] md:[grid-row:span_var(--rows)] ${dragId === widget.id ? "opacity-60" : ""}`}
            style={{ "--cols": cols, "--rows": rows } as CSSProperties}
          >
            <View widget={widget} editing={editing} />
            {editing ? (
              <button
                type="button"
                aria-label={t("editTile", { title: t(`kinds.${widget.kind}`) })}
                aria-pressed={selected}
                onClick={() => onSelect(widget.id)}
                onPointerDown={(event) => {
                  onSelect(widget.id)
                  if (event.pointerType !== "mouse" || event.button === 0) setDragId(widget.id)
                }}
                onKeyDown={(event) => {
                  const step = KEY_STEP[event.key]
                  if (step === undefined) return
                  event.preventDefault()
                  onMove(widget.id, index + step)
                }}
                style={{ touchAction: "none" }}
                className={`focus-visible:ring-ring absolute inset-0 z-10 cursor-grab rounded-3xl outline-none focus-visible:ring-2 ${selected ? "ring-primary ring-4" : ""}`}
              >
                <Icons.gripVertical aria-hidden className="absolute top-2 right-2 size-4 opacity-60" />
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

"use client"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import type { EditorEntry } from "./entries"
import { EntryRow } from "./entry-row"

/**
 * The entries in order. Drag the handle (pointer or keyboard: Space, arrows, Space; or Alt plus an arrow key), or use
 * the move buttons of each row. Every change of place is announced in a polite live region.
 */
export function EntryList({
  entries,
  onChange,
  onMove,
  onRemove,
  showProblems,
}: {
  /** The entries that are shown (hidden ones stay in the editor's state). */
  entries: EditorEntry[]
  onChange: (key: string, patch: Partial<EditorEntry>) => void
  /** Moves the entry at shown position `from` to shown position `to`. */
  onMove: (from: number, to: number) => void
  onRemove: (key: string) => void
  showProblems: boolean
}) {
  const t = useT("library.listEditor.entry")
  const [announcement, setAnnouncement] = useState("")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function move(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= entries.length) return
    const key = entries[index]?.key
    onMove(index, target)
    setAnnouncement(t("moved", { n: index + 1, to: target + 1, count: entries.length }))
    // The handle keeps the focus when its row changes place.
    if (key) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-handle="${key}"]`)?.focus()
      })
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = entries.findIndex((entry) => entry.key === active.id)
    const to = entries.findIndex((entry) => entry.key === over.id)
    if (from < 0 || to < 0) return
    onMove(from, to)
    setAnnouncement(t("moved", { n: from + 1, to: to + 1, count: entries.length }))
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={entries.map((entry) => entry.key)} strategy={verticalListSortingStrategy}>
          <ol aria-label={t("list")} className="flex flex-col gap-3">
            {entries.map((entry, index) => (
              <EntryRow
                key={entry.key}
                entry={entry}
                index={index}
                count={entries.length}
                onChange={onChange}
                onMove={move}
                onRemove={onRemove}
                showProblems={showProblems}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  )
}

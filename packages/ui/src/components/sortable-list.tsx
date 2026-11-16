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
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"

function SortableRow({ id, handleLabel, children }: { id: string; handleLabel: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-card border-hairline-strong flex items-center gap-2 rounded-card border p-2",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={handleLabel}
        className="text-muted-foreground hover:bg-accent flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <Icons.gripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  )
}

/**
 * A reorderable list: drag the handle with a pointer or touch, or focus it and use Space, the arrow keys and Space
 * again. `onReorder` gets the items in the new order. The list holds no state; render it from the parent's array.
 * Pass `handleLabel` translated ("Drag to reorder"); dnd-kit's own announcements are not used.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  handleLabel,
  label,
  className,
}: {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  handleLabel: string
  /** Accessible name of the list. */
  label: string
  className?: string
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = items.findIndex((item) => item.id === active.id)
    const to = items.findIndex((item) => item.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements: undefined }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label={label} className={cn("flex flex-col gap-2", className)}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id} handleLabel={handleLabel}>
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

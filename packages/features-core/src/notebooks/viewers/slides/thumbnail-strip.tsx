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
import type { Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { SortableThumbnail } from "./sortable-thumbnail"
import { ThumbnailItem } from "./thumbnail-item"

type ThumbnailStripProps = {
  slides: readonly Slide[]
  currentId: string
  deckSubtitle?: string | null
  /** Edit mode: thumbnails can be dragged to a new place. */
  sortable: boolean
  /** Slides with a pending instruction (revise mode). */
  marked: ReadonlySet<string>
  onSelect: (slide: Slide) => void
  onMove: (from: number, to: number) => void
}

/** The thumbnails on the left of the stage (hidden on phones). */
export function ThumbnailStrip({
  slides,
  currentId,
  deckSubtitle,
  sortable,
  marked,
  onSelect,
  onMove,
}: ThumbnailStripProps) {
  const t = useT("notebooks.slides")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = slides.findIndex((slide) => slide.id === active.id)
    const to = slides.findIndex((slide) => slide.id === over.id)
    if (from >= 0 && to >= 0) onMove(from, to)
  }

  const items = slides.map((slide, index) => {
    const props = {
      slide,
      number: index + 1,
      current: slide.id === currentId,
      marked: marked.has(slide.id),
      deckSubtitle,
      onSelect,
    }
    return sortable ? <SortableThumbnail key={slide.id} {...props} /> : <ThumbnailItem key={slide.id} {...props} />
  })

  return (
    <nav aria-label={t("list")} className="hidden w-44 shrink-0 md:block">
      <div className="sticky top-2 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-1">
        {sortable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{
              screenReaderInstructions: { draggable: t("dragHelp") },
              // The move is announced by the viewer in the user's language.
              announcements: {
                onDragStart: () => undefined,
                onDragOver: () => undefined,
                onDragEnd: () => undefined,
                onDragCancel: () => undefined,
              },
            }}
          >
            <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
              <ol className="flex flex-col gap-1.5">{items}</ol>
            </SortableContext>
          </DndContext>
        ) : (
          <ol className="flex flex-col gap-1.5">{items}</ol>
        )}
      </div>
    </nav>
  )
}

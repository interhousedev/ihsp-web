"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { ThumbnailItem, type ThumbnailItemProps } from "./thumbnail-item"
import { useReducedMotion } from "./use-reduced-motion"

/** A thumbnail with a drag handle; the handle works with the pointer and with the keyboard (Space, arrows, Space). */
export function SortableThumbnail(props: Omit<ThumbnailItemProps, "handle" | "dragging" | "ref" | "style">) {
  const t = useT("notebooks.slides")
  const reduceMotion = useReducedMotion()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.slide.id,
  })
  return (
    <ThumbnailItem
      {...props}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: reduceMotion ? undefined : transition }}
      dragging={isDragging}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("reorder", { n: props.number })}
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md outline-hidden focus-visible:ring-2"
        >
          <Icons.gripVertical className="size-4" aria-hidden />
        </button>
      }
    />
  )
}

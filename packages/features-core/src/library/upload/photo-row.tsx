"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useT } from "@ihsp/i18n"
import { Button, Icons, cn, formatBytes } from "@ihsp/ui"
import { IconArrowDown, IconArrowUp, IconRotateClockwise } from "@ihsp/ui"
import type { KeyboardEvent } from "react"
import type { PhotoItem } from "./material-values"

/** A rotated picture keeps inside its frame: a quarter turn swaps width and height, so it is scaled down. */
const turned = (rotation: number) => rotation === 90 || rotation === 270

/**
 * One photo of the picker: a thumbnail with its number, a drag handle (Alt plus an arrow key also moves it), buttons
 * to move it up or down, turn it by 90 degrees and remove it.
 */
export function PhotoRow({
  photo,
  index,
  count,
  onMove,
  onRotate,
  onRemove,
}: {
  photo: PhotoItem
  /** 0-based position in the list. */
  index: number
  count: number
  onMove: (index: number, delta: -1 | 1) => void
  onRotate: (key: string) => void
  onRemove: (key: string) => void
}) {
  const t = useT("library.upload.photos")
  const n = index + 1
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.key,
  })

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault()
      event.stopPropagation()
      onMove(index, event.key === "ArrowUp" ? -1 : 1)
      return
    }
    listeners?.onKeyDown?.(event)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-photo-key={photo.key}
      className={cn(
        "bg-card flex flex-wrap items-center gap-3 rounded-xl border p-2",
        isDragging && "relative z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onKeyDown={handleKeyDown}
        aria-label={t("reorder", { n })}
        aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
        data-handle={photo.key}
        className="text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 flex size-11 cursor-grab touch-none items-center justify-center rounded-md outline-none focus-visible:ring-3"
      >
        <Icons.gripVertical className="size-5" aria-hidden />
      </button>
      <div className="bg-muted flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {photo.previewUrl ? (
          <img
            src={photo.previewUrl}
            alt={t("alt", { n })}
            className="size-full object-contain transition-transform"
            style={{ transform: `rotate(${photo.rotation}deg) scale(${turned(photo.rotation) ? 0.8 : 1})` }}
          />
        ) : (
          <Icons.media className="text-muted-foreground size-6" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("label", { n, count })}</p>
        <p className="text-muted-foreground truncate text-xs">
          {photo.file.name} · {formatBytes(photo.file.size, { decimals: 1 })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={t("up", { n })}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
        >
          <IconArrowUp aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={t("down", { n })}
          disabled={index === count - 1}
          onClick={() => onMove(index, 1)}
        >
          <IconArrowDown aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={t("rotate", { n })}
          onClick={() => onRotate(photo.key)}
        >
          <IconRotateClockwise aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive size-11"
          aria-label={t("remove", { n })}
          onClick={() => onRemove(photo.key)}
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
    </li>
  )
}

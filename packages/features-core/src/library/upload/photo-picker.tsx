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
import { Button } from "@ihsp/ui"
import { IconCamera, IconPhoto } from "@tabler/icons-react"
import { useRef, useState, type ChangeEvent } from "react"
import type { PhotoItem } from "./material-values"
import { PhotoRow } from "./photo-row"
import { addPhotos, movePhoto, releasePhoto, rotatePhoto } from "./photo-items"
import { MAX_PHOTOS } from "./upload-config"

/**
 * Pictures of paper notes: the camera comes first (`capture="environment"`, several shots one after another), then
 * the gallery. The photos can be reordered by dragging or with the move buttons, turned by 90 degrees and removed;
 * up to 20 are combined into one PDF by the server. Cropping is not offered (the picker says so).
 */
export function PhotoPicker({
  photos,
  onChange,
  max = MAX_PHOTOS,
  invalid = false,
  describedBy,
}: {
  photos: PhotoItem[]
  onChange: (photos: PhotoItem[]) => void
  max?: number
  invalid?: boolean
  describedBy?: string
}) {
  const t = useT("library.upload.photos")
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [announcement, setAnnouncement] = useState("")
  const [dropped, setDropped] = useState(0)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const full = photos.length >= max

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return
    const result = addPhotos(photos, files, max)
    setDropped(result.dropped)
    onChange(result.photos)
    setAnnouncement(t("added", { count: result.photos.length - photos.length }))
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= photos.length) return
    const key = photos[index]?.key
    onChange(movePhoto(photos, index, target))
    setAnnouncement(t("moved", { n: index + 1, to: target + 1, count: photos.length }))
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
    const from = photos.findIndex((photo) => photo.key === active.id)
    const to = photos.findIndex((photo) => photo.key === over.id)
    onChange(movePhoto(photos, from, to))
    setAnnouncement(t("moved", { n: from + 1, to: to + 1, count: photos.length }))
  }

  function remove(key: string) {
    const index = photos.findIndex((photo) => photo.key === key)
    const photo = photos[index]
    if (photo) releasePhoto(photo)
    onChange(photos.filter((item) => item.key !== key))
    setDropped(0)
    setAnnouncement(t("removed", { n: index + 1 }))
  }

  return (
    <div
      role="group"
      aria-label={t("group")}
      aria-describedby={describedBy}
      data-invalid={invalid ? "true" : undefined}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" className="min-h-11" disabled={full} onClick={() => cameraRef.current?.click()}>
          <IconCamera aria-hidden />
          {photos.length === 0 ? t("camera") : t("cameraMore")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={full}
          onClick={() => galleryRef.current?.click()}
        >
          <IconPhoto aria-hidden />
          {t("gallery")}
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          tabIndex={-1}
          aria-hidden
          data-testid="photo-camera-input"
          className="sr-only"
          onChange={onFiles}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          aria-hidden
          data-testid="photo-gallery-input"
          className="sr-only"
          onChange={onFiles}
        />
        <p className="text-muted-foreground text-sm" data-testid="photo-count">
          {t("count", { count: photos.length, max })}
        </p>
      </div>
      <p className="text-muted-foreground text-xs">{t("hint", { max })}</p>
      {dropped > 0 ? (
        <p role="alert" className="text-destructive text-sm">
          {t("tooMany", { max, dropped })}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((photo) => photo.key)} strategy={verticalListSortingStrategy}>
            <ol aria-label={t("list")} className="flex flex-col gap-2">
              {photos.map((photo, index) => (
                <PhotoRow
                  key={photo.key}
                  photo={photo}
                  index={index}
                  count={photos.length}
                  onMove={move}
                  onRotate={(key) => onChange(rotatePhoto(photos, key))}
                  onRemove={remove}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      ) : null}
      <p className="text-muted-foreground text-xs">{t("noCrop")}</p>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

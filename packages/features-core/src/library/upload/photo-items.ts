import { arrayMove } from "@dnd-kit/sortable"
import type { PhotoItem, PhotoRotation } from "./material-values"

let counter = 0

function previewFor(file: File): string | null {
  try {
    return typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null
  } catch {
    return null
  }
}

/** A photo for the picker. The preview address must be released with `releasePhoto` when the photo goes away. */
export function makePhoto(file: File): PhotoItem {
  counter += 1
  return { key: `photo-${Date.now().toString(36)}-${counter}`, file, rotation: 0, previewUrl: previewFor(file) }
}

export function releasePhoto(photo: PhotoItem): void {
  if (photo.previewUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(photo.previewUrl)
  }
}

/** Adds new files after the existing photos, keeping at most `max` (the rest is dropped; `dropped` says how many). */
export function addPhotos(
  photos: readonly PhotoItem[],
  files: readonly File[],
  max: number,
): { photos: PhotoItem[]; dropped: number } {
  const images = files.filter((file) => file.type === "" || file.type.startsWith("image/"))
  const room = Math.max(0, max - photos.length)
  const added = images.slice(0, room).map(makePhoto)
  return { photos: [...photos, ...added], dropped: images.length - added.length }
}

export function movePhoto(photos: readonly PhotoItem[], from: number, to: number): PhotoItem[] {
  if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return [...photos]
  return arrayMove([...photos], from, to)
}

export function rotatePhoto(photos: readonly PhotoItem[], key: string): PhotoItem[] {
  return photos.map((photo) =>
    photo.key === key ? { ...photo, rotation: ((photo.rotation + 90) % 360) as PhotoRotation } : photo,
  )
}

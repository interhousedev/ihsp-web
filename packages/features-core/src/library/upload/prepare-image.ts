import { MAX_IMAGE_SIDE } from "./upload-config"
import type { PhotoRotation } from "./material-values"

/** The size an image gets when its longest side may be at most `max` pixels (never enlarged). */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max || longest === 0) return { width, height }
  const scale = max / longest
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/** `IMG_0042.HEIC` becomes `IMG_0042.jpg`. */
export function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "")
  return `${base || "photo"}.jpg`
}

/** True where a canvas can be made (browsers; not in server rendering or a bare test environment). */
export function canvasAvailable(): boolean {
  return typeof document !== "undefined" && typeof HTMLCanvasElement !== "undefined"
}

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void }

async function decode(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file)
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => undefined }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Scales a photo down to at most `maxSide` pixels on its longest side, applies the requested turns and encodes it as
 * JPEG, so a 12 MB camera picture becomes a few hundred KB before it is sent. When a canvas is not available (or the
 * browser cannot decode the file) the original file is returned unchanged; the server accepts it all the same.
 */
export async function prepareImage(
  file: File,
  rotation: PhotoRotation,
  maxSide: number = MAX_IMAGE_SIDE,
): Promise<File> {
  if (!canvasAvailable()) return file
  let drawable: Drawable | null = null
  try {
    drawable = await decode(file)
    const size = fitWithin(drawable.width, drawable.height, maxSide)
    const turned = rotation === 90 || rotation === 270
    const canvas = document.createElement("canvas")
    canvas.width = turned ? size.height : size.width
    canvas.height = turned ? size.width : size.height
    const context = canvas.getContext("2d")
    if (!context) return file
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate((rotation * Math.PI) / 180)
    context.drawImage(drawable.source, -size.width / 2, -size.height / 2, size.width, size.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85))
    return blob ? new File([blob], jpegName(file.name), { type: "image/jpeg", lastModified: Date.now() }) : file
  } catch {
    return file
  } finally {
    drawable?.release()
  }
}

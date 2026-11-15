/** The selfie is sent as a JPEG of at most this many pixels on the longer side. */
export const SELFIE_MAX_SIDE = 1080
/** Width over height of the preview frame and of the captured picture. */
export const SELFIE_ASPECT = 3 / 4
const JPEG_QUALITY = 0.9

export type Rect = { x: number; y: number; width: number; height: number }

/** The centred rectangle of a `width × height` picture that has the given aspect (width over height). */
export function cropRect(width: number, height: number, aspect: number = SELFIE_ASPECT): Rect {
  if (width / height > aspect) {
    const cropped = Math.round(height * aspect)
    return { x: Math.round((width - cropped) / 2), y: 0, width: cropped, height }
  }
  const cropped = Math.round(width / aspect)
  return { x: 0, y: Math.round((height - cropped) / 2), width, height: cropped }
}

/** The size that fits `max` on the longer side without enlarging. */
export function fitWithin(width: number, height: number, max: number = SELFIE_MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/** Draws `area` of the source scaled down to `SELFIE_MAX_SIDE` and encodes it as JPEG; null when the browser cannot. */
export function encodeJpeg(source: CanvasImageSource, area: Rect): Promise<File | null> {
  const size = fitWithin(area.width, area.height)
  const canvas = document.createElement("canvas")
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext("2d")
  if (!context) return Promise.resolve(null)
  context.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, size.width, size.height)
  return new Promise((resolve) =>
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], "selfie.jpg", { type: "image/jpeg" }) : null),
      "image/jpeg",
      JPEG_QUALITY,
    ),
  )
}

/** A picked photo re-encoded as a downscaled JPEG (phones send HEIC or 12 MP files); null when it cannot be decoded here. */
export async function fileToJpeg(file: File): Promise<File | null> {
  if (typeof createImageBitmap !== "function") return null
  try {
    const bitmap = await createImageBitmap(file)
    try {
      return await encodeJpeg(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height })
    } finally {
      bitmap.close()
    }
  } catch {
    return null
  }
}

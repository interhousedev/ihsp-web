/** Client-side image crop: pure geometry plus a canvas export. */

export type CropRect = { x: number; y: number; w: number; h: number }

/**
 * The source rectangle for an `aspect` (width / height) crop of a natural-size image. `zoom` >= 1 shrinks the window;
 * `fx` and `fy` (0 to 1) slide it over the free space.
 */
export function computeCropRect(natW: number, natH: number, aspect: number, zoom = 1, fx = 0.5, fy = 0.5): CropRect {
  const z = Math.max(1, zoom)
  let w = natW
  let h = natW / aspect
  if (h > natH) {
    h = natH
    w = natH * aspect
  }
  w /= z
  h /= z
  return { x: (natW - w) * clamp01(fx), y: (natH - h) * clamp01(fy), w, h }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.addEventListener("load", () => {
      URL.revokeObjectURL(url)
      resolve(image)
    })
    image.addEventListener("error", () => {
      URL.revokeObjectURL(url)
      reject(new Error("image-load-failed"))
    })
    image.src = url
  })
}

/** Natural size of an image file. */
export async function imageSize(file: Blob): Promise<{ width: number; height: number }> {
  const image = await loadImage(file)
  return { width: image.naturalWidth, height: image.naturalHeight }
}

/** Crops `rect` out of the image and scales it to `outWidth` wide; the result is a JPEG blob. */
export async function cropToBlob(file: Blob, rect: CropRect, aspect: number, outWidth: number): Promise<Blob> {
  const image = await loadImage(file)
  const canvas = document.createElement("canvas")
  canvas.width = outWidth
  canvas.height = Math.round(outWidth / aspect)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas-unavailable")
  context.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("crop-failed"))), "image/jpeg", 0.9),
  )
}

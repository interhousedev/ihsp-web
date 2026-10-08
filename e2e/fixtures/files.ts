/** Small files the specs upload. The backend checks the real content type, so the bytes are real. */

/** A valid 1x1 PNG. */
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

export function textFile(name: string, text: string): { name: string; mimeType: string; buffer: Buffer } {
  return { name, mimeType: "text/plain", buffer: Buffer.from(text, "utf8") }
}

export function pngFile(name: string): { name: string; mimeType: string; buffer: Buffer } {
  return { name, mimeType: "image/png", buffer: PNG_1X1 }
}

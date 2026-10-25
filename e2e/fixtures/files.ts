/** Small files the specs upload. The backend checks the real content type, so the bytes are real. */

import { readFileSync } from "node:fs"
import { join } from "node:path"

/** A short real MP4 (`fixtures/assets/tiny.mp4`) for the video blocks of the LMS step editor. */
export function videoFile(): { name: string; mimeType: string; buffer: Buffer } {
  return { name: "tiny.mp4", mimeType: "video/mp4", buffer: readFileSync(join(__dirname, "assets", "tiny.mp4")) }
}

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

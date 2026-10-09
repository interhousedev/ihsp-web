import type { Annotation } from "@ihsp/api"
import { isCfiLocator, isPageLocator, type Locator } from "./locator"

// LIB-B is adding the saved reading progress to `ItemDetail` (planned shape below). The API types do not have it yet, so
// it is read through this adapter: nothing is assumed about an item that does not carry it.

export type ServerProgress = { file_id: string; locator: Annotation["locator"]; percent: number }

/** The saved position of this file as the server knows it, or `null` (none, another file, or a damaged value). */
export function serverProgressOf(item: unknown, fileId: string): { locator: Locator; fraction: number } | null {
  const progress = (item as { progress?: Partial<ServerProgress> | null } | null)?.progress
  if (!progress || progress.file_id !== fileId || !progress.locator) return null
  const locator = progress.locator
  const valid =
    (isPageLocator(locator) && Number.isInteger(locator.page) && locator.page >= 1) ||
    (isCfiLocator(locator) && typeof locator.cfi === "string" && locator.cfi.startsWith("epubcfi("))
  if (!valid) return null
  const percent = typeof progress.percent === "number" && Number.isFinite(progress.percent) ? progress.percent : 0
  return { locator, fraction: Math.min(Math.max(percent / 100, 0), 1) }
}

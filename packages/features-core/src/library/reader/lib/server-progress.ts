import type { ItemDetail } from "@ihsp/api"
import { isCfiLocator, isPageLocator, type Locator } from "./locator"

/**
 * The saved position of this file as the server knows it (`ItemDetail.progress`, written by
 * `PUT /me/library/progress/{item_id}`), or `null`: none, another file, or a value the reader cannot use.
 */
export function serverProgressOf(
  item: Pick<ItemDetail, "progress">,
  fileId: string,
): { locator: Locator; fraction: number } | null {
  const progress = item.progress
  if (!progress || progress.file_id !== fileId || !progress.locator) return null
  const locator = progress.locator
  const valid =
    (isPageLocator(locator) && Number.isInteger(locator.page) && locator.page >= 1) ||
    (isCfiLocator(locator) && typeof locator.cfi === "string" && locator.cfi.startsWith("epubcfi("))
  if (!valid) return null
  const percent = Number.isFinite(progress.percent) ? progress.percent : 0
  return { locator, fraction: Math.min(Math.max(percent / 100, 0), 1) }
}

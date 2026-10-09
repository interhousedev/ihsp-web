import type { ItemDetail, ItemFile } from "@ihsp/api"

/** The formats the reader can draw in the browser. */
export const READABLE_FORMATS: readonly ItemFile["format"][] = ["pdf", "epub", "md", "txt"]

export const canDraw = (file: ItemFile): boolean => file.readable && READABLE_FORMATS.includes(file.format)

/**
 * The file the reader opens: the one named by `?file=` when it is readable, else the primary readable file, else any
 * readable one. `undefined` when the item has nothing the browser can draw (a PPTX, for example).
 */
export function pickFile(item: Pick<ItemDetail, "files">, wanted: string | null): ItemFile | undefined {
  const named = wanted ? item.files.find((file) => file.id === wanted) : undefined
  if (named && canDraw(named)) return named
  return item.files.find((file) => file.is_primary && canDraw(file)) ?? item.files.find(canDraw)
}

import type { Annotation } from "@ihsp/api"
import { isPageLocator } from "./locator"

/** A number that orders annotations by where they sit in a file: the page for pages, the progress for a CFI. */
export function positionOf(annotation: Pick<Annotation, "locator">): number {
  const locator = annotation.locator
  return isPageLocator(locator) ? locator.page : locator.progress
}

/** In reading order: by place, then oldest first, so two highlights on a page keep the order they were made in. */
export function byPosition<T extends Pick<Annotation, "locator" | "updated_at">>(list: readonly T[]): T[] {
  return list.toSorted((a, b) => positionOf(a) - positionOf(b) || a.updated_at.localeCompare(b.updated_at))
}

/** Newest change first (My library and the notes export). */
export function byNewest<T extends Pick<Annotation, "updated_at">>(list: readonly T[]): T[] {
  return list.toSorted((a, b) => b.updated_at.localeCompare(a.updated_at))
}

import type { Slide } from "@ihsp/api"

/** A copy of `items` with the item at `from` moved to `to` (indexes outside the list leave it unchanged). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items]
  if (from === to || from < 0 || to < 0 || from >= result.length || to >= result.length) return result
  const [item] = result.splice(from, 1)
  if (item === undefined) return result
  result.splice(to, 0, item)
  return result
}

export function replaceItem<T>(items: readonly T[], index: number, value: T): T[] {
  return items.map((item, position) => (position === index ? value : item))
}

export function removeItemAt<T>(items: readonly T[], index: number): T[] {
  return items.filter((_item, position) => position !== index)
}

export function patchSlide(slides: readonly Slide[], id: string, patch: Partial<Slide>): Slide[] {
  return slides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))
}

export function removeSlide(slides: readonly Slide[], id: string): Slide[] {
  return slides.filter((slide) => slide.id !== id)
}

const notBlank = (text: string) => text.trim() !== ""

/** What is saved: blank bullets (added and left empty in the editor) are dropped, everything else is sent as typed. */
export function cleanSlides(slides: readonly Slide[]): Slide[] {
  return slides.map((slide) => {
    const next: Slide = { ...slide }
    if (slide.bullets) next.bullets = slide.bullets.filter(notBlank)
    if (slide.left) next.left = { ...slide.left, bullets: slide.left.bullets.filter(notBlank) }
    if (slide.right) next.right = { ...slide.right, bullets: slide.right.bullets.filter(notBlank) }
    return next
  })
}

export function sameSlides(a: readonly Slide[], b: readonly Slide[]): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b)
}

/** The name of a slide for thumbnails and lists: its title, or the start of its quote; empty when it has neither. */
export function slideName(slide: Slide): string {
  const title = slide.title.trim()
  if (title) return title
  const quote = slide.quote?.text.trim() ?? ""
  return quote.length > 48 ? `${quote.slice(0, 47)}…` : quote
}

/** How much text a slide carries; the renderer picks a smaller type size for dense slides so that they still fit. */
export type TextTier = 0 | 1 | 2

export function textTier(slide: Slide): TextTier {
  const parts = [
    ...(slide.bullets ?? []),
    slide.body ?? "",
    ...(slide.left?.bullets ?? []),
    ...(slide.right?.bullets ?? []),
    ...(slide.table?.rows.flat() ?? []),
  ]
  const characters = parts.reduce((sum, part) => sum + part.length, 0)
  if (characters > 520) return 2
  if (characters > 260) return 1
  return 0
}

import type { PlanSlide } from "@ihsp/api"

/** Moves the slide at `index` one place up (`-1`) or down (`1`); the same list when it cannot move. */
export function moveSlide(slides: readonly PlanSlide[], index: number, by: -1 | 1): readonly PlanSlide[] {
  const target = index + by
  if (target < 0 || target >= slides.length) return slides
  const next = [...slides]
  const [moved] = next.splice(index, 1)
  if (moved) next.splice(target, 0, moved)
  return next
}

export function removeSlide(slides: readonly PlanSlide[], index: number): PlanSlide[] {
  return slides.filter((_, at) => at !== index)
}

function update(slides: readonly PlanSlide[], index: number, change: (slide: PlanSlide) => PlanSlide): PlanSlide[] {
  return slides.map((slide, at) => (at === index ? change(slide) : slide))
}

export function editTitle(slides: readonly PlanSlide[], index: number, title: string): PlanSlide[] {
  return update(slides, index, (slide) => ({ ...slide, title }))
}

export function editBullet(slides: readonly PlanSlide[], index: number, bullet: number, text: string): PlanSlide[] {
  return update(slides, index, (slide) => ({
    ...slide,
    bullets: slide.bullets.map((current, at) => (at === bullet ? text : current)),
  }))
}

export function addBullet(slides: readonly PlanSlide[], index: number): PlanSlide[] {
  return update(slides, index, (slide) => ({ ...slide, bullets: [...slide.bullets, ""] }))
}

export function removeBullet(slides: readonly PlanSlide[], index: number, bullet: number): PlanSlide[] {
  return update(slides, index, (slide) => ({ ...slide, bullets: slide.bullets.filter((_, at) => at !== bullet) }))
}

/** Cuts a plan to `max` slides: the slides before the cut and the closing (summary) slide stay. */
export function trimTo(slides: readonly PlanSlide[], max: number): readonly PlanSlide[] {
  if (slides.length <= max || max < 1) return slides
  const last = slides[slides.length - 1]
  return last ? [...slides.slice(0, max - 1), last] : slides.slice(0, max)
}

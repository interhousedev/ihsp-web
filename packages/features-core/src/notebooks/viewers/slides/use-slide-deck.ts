"use client"

import type { Slide } from "@ihsp/api"
import { useMemo, useState } from "react"
import { moveItem, patchSlide, removeSlide, sameSlides } from "./slide-deck-state"

/**
 * The slides being viewed or edited. `incoming` is what the server has; edits are kept in a draft, and a refetch only
 * replaces the draft while there are no unsaved edits. The selected slide is tracked by id, so that it stays selected
 * when slides are moved around.
 */
export function useSlideDeck(incoming: readonly Slide[]) {
  const [seen, setSeen] = useState(incoming)
  const [base, setBase] = useState(incoming)
  const [slides, setSlides] = useState(incoming)
  const [currentId, setCurrentId] = useState(incoming[0]?.id ?? "")
  const dirty = useMemo(() => !sameSlides(slides, base), [slides, base])

  if (seen !== incoming) {
    setSeen(incoming)
    setBase(incoming)
    if (!dirty) setSlides(incoming)
  }

  const found = slides.findIndex((slide) => slide.id === currentId)
  const index = found >= 0 ? found : 0
  const current: Slide | undefined = slides[index]

  function goTo(target: number) {
    const slide = slides[Math.min(Math.max(target, 0), slides.length - 1)]
    if (slide) setCurrentId(slide.id)
  }

  return {
    slides,
    base,
    dirty,
    index,
    current,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
    select: (id: string) => setCurrentId(id),
    patch: (id: string, patch: Partial<Slide>) => setSlides((list) => patchSlide(list, id, patch)),
    /** Moves the slide at `from` to position `to`; the selected slide stays selected. */
    move: (from: number, to: number) => setSlides((list) => moveItem(list, from, to)),
    /** Removes a slide; when it was the selected one, its neighbour becomes the selected slide. */
    remove: (id: string) => {
      const position = slides.findIndex((slide) => slide.id === id)
      const rest = removeSlide(slides, id)
      setSlides(rest)
      if (id === currentId) setCurrentId(rest[Math.min(position, rest.length - 1)]?.id ?? "")
    },
    discard: () => setSlides(base),
    /** After a successful save: the saved list is both the draft and the new baseline. */
    markSaved: (saved: readonly Slide[]) => {
      setBase(saved)
      setSlides(saved)
    },
  }
}

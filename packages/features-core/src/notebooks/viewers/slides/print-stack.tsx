"use client"

import type { Slide } from "@ihsp/api"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { SlideView } from "./slide-view"

/**
 * While printing, only the slides are on the paper: every other child of `<body>` is hidden and the page is landscape.
 * `@page` cannot sit inside a media query in every browser, so it stands alone (it only matters for printing).
 */
const PRINT_CSS = `@page { size: landscape; margin: 0 }
@media print { body > :not([data-slide-print]) { display: none !important } }`

type PrintStackProps = {
  slides: readonly Slide[]
  deckSubtitle?: string | null
}

/**
 * All slides, one per page, for Print / PDF. On screen the stack is not displayed (Tailwind `hidden`) and it is hidden
 * from assistive technology; `print:block` shows it on paper. It lives in `<body>` so that the print styles can leave
 * the rest of the page out.
 */
export function PrintStack({ slides, deckSubtitle }: PrintStackProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <div data-slide-print aria-hidden className="hidden print:block">
      <style>{PRINT_CSS}</style>
      {slides.map((slide) => (
        <div key={slide.id} className="break-after-page break-inside-avoid last:break-after-auto">
          <SlideView slide={slide} deckSubtitle={deckSubtitle} />
        </div>
      ))}
    </div>,
    document.body,
  )
}

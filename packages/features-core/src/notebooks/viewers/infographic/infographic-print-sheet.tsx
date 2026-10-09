"use client"

import type { InfographicContent } from "@ihsp/api"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { InfographicCanvas } from "./infographic-canvas"
import { CANVAS_SIZES, type InfographicOrientation, type InfographicStyle } from "./infographic-theme"

type InfographicPrintSheetProps = {
  content: InfographicContent
  orientation: InfographicOrientation
  variant: InfographicStyle
  contentScale: number
}

/**
 * The infographic at full size on a page that has exactly its size, for Print / PDF. On screen it is not displayed
 * and hidden from assistive technology; it lives in `<body>` so that the print styles can leave the rest of the page out.
 */
export function InfographicPrintSheet({ content, orientation, variant, contentScale }: InfographicPrintSheetProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const { width, height } = CANVAS_SIZES[orientation]
  const css = `@page { size: ${width}px ${height}px; margin: 0 }
@media print { body > :not([data-ig-print]) { display: none !important } }`
  return createPortal(
    <div data-ig-print aria-hidden className="hidden [print-color-adjust:exact] print:block">
      <style>{css}</style>
      <InfographicCanvas content={content} orientation={orientation} variant={variant} contentScale={contentScale} />
    </div>,
    document.body,
  )
}

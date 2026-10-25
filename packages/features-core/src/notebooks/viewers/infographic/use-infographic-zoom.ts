"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { fitScale, stepZoom } from "./fit-scale"

/**
 * The scale of the canvas: "fit" (as wide as the container, measured with a ResizeObserver where there is one) until
 * the reader uses the zoom buttons, then that value until Fit is pressed.
 */
export function useInfographicZoom(naturalWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  const [zoom, setZoom] = useState<number | null>(null)

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return
    const measure = () => setFit(fitScale(element.clientWidth, naturalWidth))
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [naturalWidth])

  const scale = zoom ?? fit
  return {
    containerRef,
    scale,
    isFit: zoom === null,
    zoomIn: () => setZoom(stepZoom(scale, 1)),
    zoomOut: () => setZoom(stepZoom(scale, -1)),
    fit: () => setZoom(null),
  }
}

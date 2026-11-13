"use client"

import { useEffect, useState } from "react"

/** Whether the page is scrolled down past `threshold` pixels. */
export function useScrolled(threshold = 48): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [threshold])
  return scrolled
}

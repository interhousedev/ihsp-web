"use client"

import { cn } from "@ihsp/ui"
import { useEffect, useRef, useState, type ReactNode } from "react"

/** True when the visitor asked the system for less motion. False before mount, so static HTML is the full page. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return reduced
}

/** Fades and lifts its children (18px, 0.75s) in once they scroll into view; shows them as they are under reduced motion. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (reduced || !node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced])
  const hidden = !reduced && !seen
  return (
    <div
      ref={ref}
      data-hidden={hidden}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("lnd-reveal", className)}
    >
      {children}
    </div>
  )
}

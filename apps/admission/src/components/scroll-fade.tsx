"use client"

import { cn } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

const EDGE = 1

/** A scroll container whose top/bottom edges fade and blur only while content overflows in that direction. */
export function ScrollFade({
  className,
  maxHeight,
  children,
}: {
  className?: string
  maxHeight?: number | string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(false)
  const [bottom, setBottom] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setTop(el.scrollTop > EDGE)
    setBottom(el.scrollTop + el.clientHeight < el.scrollHeight - EDGE)
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [measure, children])

  const mask = "pointer-events-none absolute inset-x-0 z-10 h-8 backdrop-blur-[2px]"
  return (
    <div className="relative min-h-0">
      <div
        ref={ref}
        onScroll={measure}
        style={maxHeight === undefined ? undefined : { maxHeight }}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable (WCAG 2.1.1)
        tabIndex={0}
        className={cn(
          "overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
      >
        {children}
      </div>
      {top ? (
        <div
          aria-hidden
          data-scroll-fade="top"
          className={cn(
            mask,
            "top-0 bg-gradient-to-b from-background to-transparent [mask-image:linear-gradient(to_bottom,black,transparent)]",
          )}
        />
      ) : null}
      {bottom ? (
        <div
          aria-hidden
          data-scroll-fade="bottom"
          className={cn(
            mask,
            "bottom-0 bg-gradient-to-t from-background to-transparent [mask-image:linear-gradient(to_top,black,transparent)]",
          )}
        />
      ) : null}
    </div>
  )
}

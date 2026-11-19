"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

/**
 * A horizontal snap carousel: swipes on touch, arrow buttons (shown only while there is more to reveal) on larger
 * screens. Children are the slides; give each a fixed width.
 */
export function Carousel({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const t = useT("home.dash")
  const ref = useRef<HTMLUListElement>(null)
  const [prev, setPrev] = useState(false)
  const [next, setNext] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setPrev(el.scrollLeft > 1)
    setNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(el)
    return () => observer?.disconnect()
  }, [measure, children])

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className={cn("relative min-w-0 max-w-full", className)}>
      <ul
        ref={ref}
        aria-label={label}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] md:mx-0 md:scroll-px-10 md:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      {prev ? (
        <button
          type="button"
          aria-label={t("previous")}
          onClick={() => scrollBy(-1)}
          className="bg-card border-hairline-strong absolute top-1/2 left-0 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm md:flex"
        >
          <Icons.chevronLeft className="size-4" />
        </button>
      ) : null}
      {next ? (
        <button
          type="button"
          aria-label={t("next")}
          onClick={() => scrollBy(1)}
          className="bg-card border-hairline-strong absolute top-1/2 right-0 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm md:flex"
        >
          <Icons.chevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

/** A slide of a `Carousel`. */
export function Slide({ className, children }: { className?: string; children: ReactNode }) {
  return <li className={cn("w-64 shrink-0 snap-start sm:w-72", className)}>{children}</li>
}

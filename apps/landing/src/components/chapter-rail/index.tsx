"use client"

import { cn } from "@ihsp/ui"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import "./chapter-rail.css"

export type Chapter = { id: string; label: string }

export type ChapterRailProps = {
  /** Sections in page order: the element id and the label shown on hover and focus. */
  chapters: readonly Chapter[]
  /** Height of a fixed header in px; jumps land below it. */
  headerOffset?: number
  /** Element id (e.g. the closing call to action): the rail fades out as its top passes half the viewport. */
  hideBeforeId?: string
  /** `fixed` to the viewport (default) or `absolute` inside a positioned container. */
  position?: "fixed" | "absolute"
  /** Accessible name of the navigation. */
  label: string
  className?: string
  style?: CSSProperties
}

/** A chapter counts as reached when its start is this far into the viewport. */
const REACHED = 0.3
const HIDE_BEFORE = 0.5

/**
 * Where the reader is, on the right edge: one dot per chapter; the current dot morphs into a pill that fills as
 * the chapter scrolls by. A click jumps to the chapter (smooth, instant under reduced motion). Shown from 80rem.
 * Adapted from the component library's `hero-page/chapter-rail` (the scroll story part is not used here).
 */
export function ChapterRail({
  chapters,
  headerOffset = 0,
  hideBeforeId,
  position = "fixed",
  label,
  className,
  style,
}: ChapterRailProps) {
  const fills = useRef<(HTMLSpanElement | null)[]>([])
  const starts = useRef<number[]>([])
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(true)

  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      const reach = y + window.innerHeight * REACHED
      const list = starts.current
      let current = 0
      for (let index = 0; index < list.length; index += 1) if ((list[index] ?? 0) <= reach) current = index
      const end =
        current + 1 < list.length
          ? (list[current + 1] ?? 0)
          : document.documentElement.scrollHeight - window.innerHeight
      const from = current === 0 ? 0 : (list[current] ?? 0) - window.innerHeight * REACHED
      const progress = Math.min(1, Math.max(0, (y - from) / Math.max(1, end - window.innerHeight * REACHED - from)))
      fills.current.forEach((fill, index) => {
        if (fill) fill.style.transform = `scaleY(${index < current ? 1 : index === current ? progress : 0})`
      })
      setActive(current)
      const target = hideBeforeId ? document.getElementById(hideBeforeId) : null
      setShown(target ? target.getBoundingClientRect().top > window.innerHeight * HIDE_BEFORE : true)
    }
    const measure = () => {
      starts.current = chapters.map(({ id }, index) => {
        const section = document.getElementById(id)
        if (!section || index === 0) return 0
        return Math.max(0, Math.round(section.getBoundingClientRect().top + window.scrollY - headerOffset))
      })
      update()
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", update)
    }
  }, [chapters, headerOffset, hideBeforeId])

  const jump = (index: number) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: starts.current[index] ?? 0, behavior: reduced ? "instant" : "smooth" })
  }

  return (
    <nav
      aria-label={label}
      className={cn("chapters", className)}
      data-position={position}
      data-shown={shown}
      inert={!shown}
      style={style}
    >
      <ol>
        {chapters.map(({ id, label: name }, index) => (
          <li key={id}>
            <button
              type="button"
              className="chapter"
              aria-label={name}
              aria-current={index === active ? "location" : undefined}
              onClick={() => jump(index)}
            >
              <span className="chapter-dot" aria-hidden="true">
                <span
                  className="chapter-fill"
                  ref={(element) => {
                    fills.current[index] = element
                  }}
                />
              </span>
              <span className="chapter-label" aria-hidden="true">
                {name}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

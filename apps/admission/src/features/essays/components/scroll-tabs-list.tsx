"use client"

import { cn, TabsList } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react"

/** A tab strip that scrolls sideways when the tabs do not fit and fades the edge that hides more tabs. */
export function ScrollTabsList({ className, ...props }: ComponentProps<typeof TabsList>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [start, setStart] = useState(false)
  const [end, setEnd] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setStart(el.scrollLeft > 1)
    setEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  // Keep the active tab visible: on load and whenever the active tab changes.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reveal = () =>
      el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      })
    reveal()
    const observer = new MutationObserver(reveal)
    observer.observe(el, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] })
    return () => observer.disconnect()
  }, [])

  const mask = `linear-gradient(to right, ${start ? "transparent, black 2rem" : "black, black"}, ${
    end ? "black calc(100% - 2rem), transparent" : "black, black"
  })`
  return (
    <TabsList
      ref={ref}
      onScroll={measure}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className={cn("w-full max-w-full justify-start overflow-x-auto [scrollbar-width:none]", className)}
      {...props}
    />
  )
}

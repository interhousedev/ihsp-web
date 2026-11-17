import { useEffect, useState } from "react"

export type TargetRect = { top: number; left: number; width: number; height: number }

/** The visible sidebar link to a page; the phone sidebar is a closed sheet, so there is nothing to find there. */
function findTarget(href: string): HTMLElement | null {
  for (const link of document.querySelectorAll<HTMLElement>(`[data-slot="sidebar-content"] a[href="${href}"]`)) {
    const rect = link.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return link
  }
  return null
}

/** Viewport rect of the sidebar link to `href`, kept current on resize, scroll and late rendering. */
export function useTargetRect(href: string | null): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(null)
  useEffect(() => {
    if (!href) {
      setRect(null)
      return
    }
    const measure = () => {
      const el = findTarget(href)
      if (!el) return setRect(null)
      const r = el.getBoundingClientRect()
      setRect((prev) =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      )
    }
    measure()
    const retry = window.setTimeout(measure, 350)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.clearTimeout(retry)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [href])
  return rect
}

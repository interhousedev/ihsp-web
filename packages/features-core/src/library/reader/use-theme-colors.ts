"use client"

import { useEffect, useState, type RefObject } from "react"

export type ThemeColors = { foreground: string; background: string; link: string }

const FALLBACK: ThemeColors = { foreground: "#111111", background: "#ffffff", link: "#2563eb" }

function resolve(element: HTMLElement): ThemeColors {
  const style = getComputedStyle(element)
  const root = getComputedStyle(document.documentElement)
  const background = style.backgroundColor
  return {
    foreground: style.color || FALLBACK.foreground,
    // A transparent element has no colour of its own: take the page's.
    background:
      background && background !== "rgba(0, 0, 0, 0)" && background !== "transparent"
        ? background
        : getComputedStyle(document.body).backgroundColor || FALLBACK.background,
    link: root.getPropertyValue("--primary").trim() || FALLBACK.link,
  }
}

/**
 * The colours of the app's current theme as the browser resolved them, for content that lives in its own document (the
 * chapters of an EPUB are iframes and cannot use the app's CSS variables). It reads them again when the theme changes.
 */
export function useThemeColors(ref: RefObject<HTMLElement | null>): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const read = () =>
      setColors((current) => {
        const next = resolve(element)
        return next.foreground === current.foreground &&
          next.background === current.background &&
          next.link === current.link
          ? current
          : next
      })
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] })
    const media = window.matchMedia?.("(prefers-color-scheme: dark)")
    media?.addEventListener?.("change", read)
    return () => {
      observer.disconnect()
      media?.removeEventListener?.("change", read)
    }
  }, [ref])
  return colors
}

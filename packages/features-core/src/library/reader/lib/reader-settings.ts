"use client"

import type { AnnotationColor } from "@ihsp/api"
import { useCallback, useEffect, useState } from "react"
import { isAnnotationColor } from "./colors"

// Reader settings are remembered per device in `localStorage`. The theme is not
// here: the reader follows the app's theme. Every read and write is in try/catch (private windows, blocked storage).

export type PageFit = "width" | "page" | "custom"
export type EpubFlow = "paginated" | "scrolled"

export type ReaderSettings = {
  /** Reflowable text (EPUB, Markdown, text): percent of the base size. */
  fontSize: number
  /** Reflowable text: line height as a multiplier. */
  lineHeight: number
  /** PDF: fit the page width, the whole page, or the custom zoom. */
  pageFit: PageFit
  /** PDF: zoom multiplier used when `pageFit` is `custom`. */
  zoom: number
  /** EPUB: pages or one long scroll. */
  flow: EpubFlow
  /** The colour of the last highlight; the next one starts with it. */
  color: AnnotationColor
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 100,
  lineHeight: 1.5,
  pageFit: "width",
  zoom: 1,
  flow: "paginated",
  color: "yellow",
}

export const FONT_SIZE_RANGE = { min: 70, max: 220, step: 10 } as const
export const LINE_HEIGHTS = [1.3, 1.5, 1.8] as const
export const ZOOM_RANGE = { min: 0.5, max: 3, step: 0.25 } as const

const STORAGE_KEY = "ihsp.library.reader-settings"

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function number(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : fallback
}

/** Keeps only valid values of a stored object (a hand-edited or old record never breaks the reader). */
export function sanitizeSettings(raw: unknown): ReaderSettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    fontSize: number(source.fontSize, DEFAULT_SETTINGS.fontSize, FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max),
    lineHeight: number(source.lineHeight, DEFAULT_SETTINGS.lineHeight, 1, 2.4),
    pageFit: source.pageFit === "page" || source.pageFit === "custom" ? source.pageFit : "width",
    zoom: number(source.zoom, DEFAULT_SETTINGS.zoom, ZOOM_RANGE.min, ZOOM_RANGE.max),
    flow: source.flow === "scrolled" ? "scrolled" : "paginated",
    color: isAnnotationColor(source.color) ? source.color : DEFAULT_SETTINGS.color,
  }
}

export function readSettings(): ReaderSettings {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY)
    return sanitizeSettings(text ? JSON.parse(text) : null)
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeSettings(settings: ReaderSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // The settings only live for this page view then.
  }
}

/** The settings of this device; changing one saves all. The first render uses the defaults (static export), then the stored values. */
export function useReaderSettings(): [ReaderSettings, (patch: Partial<ReaderSettings>) => void] {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  useEffect(() => setSettings(readSettings()), [])
  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((current) => {
      const next = sanitizeSettings({ ...current, ...patch })
      writeSettings(next)
      return next
    })
  }, [])
  return [settings, update]
}

export function stepZoom(zoom: number, direction: 1 | -1): number {
  return clamp(Math.round((zoom + direction * ZOOM_RANGE.step) * 100) / 100, ZOOM_RANGE.min, ZOOM_RANGE.max)
}

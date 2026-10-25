"use client"

import type { PassageItem } from "@ihsp/api"
import { useEffect, useRef, useState, type RefObject } from "react"
import { usePassage } from "../api"

const PULSE_MS = 2000
/** Safety net: stop loading pages after this many (60 passages each) and fall back to the passage itself. */
const MAX_PAGES_TO_SEARCH = 30

type PassagePages = {
  pageCount: number
  isSuccess: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
}

type Options = {
  notebookId: string
  /** The passage a citation points at. */
  passageId: string | null | undefined
  items: readonly PassageItem[]
  pages: PassagePages
  containerRef: RefObject<HTMLElement | null>
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Brings the cited passage into view: loads pages until the passage is in the list, scrolls it to the middle of the
 * pane once and pulses it for 2 s. When it cannot be found (the source was synced since the answer), `changed` is
 * true and `nearby` holds what the server still knows about it.
 */
export function usePassageFocus({ notebookId, passageId, items, pages, containerRef }: Options) {
  const target = passageId ?? null
  const found = target !== null && items.some((item) => item.id === target)
  const [pulsing, setPulsing] = useState(false)
  const scrolledTo = useRef<string | null>(null)

  const searchExhausted = !pages.hasNextPage || pages.pageCount >= MAX_PAGES_TO_SEARCH
  const changed = target !== null && !found && pages.isSuccess && searchExhausted
  const nearby = usePassage(notebookId, changed ? target : null)

  const { hasNextPage, isFetchingNextPage, pageCount, fetchNextPage } = pages
  useEffect(() => {
    if (target === null || found || !hasNextPage || isFetchingNextPage || pageCount >= MAX_PAGES_TO_SEARCH) return
    void fetchNextPage()
  }, [target, found, hasNextPage, isFetchingNextPage, pageCount, fetchNextPage])

  useEffect(() => {
    if (target === null || !found || scrolledTo.current === target) return
    const element = containerRef.current?.querySelector<HTMLElement>(`[data-passage-id="${target}"]`)
    if (!element) return
    scrolledTo.current = target
    element.scrollIntoView?.({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" })
    setPulsing(true)
  }, [target, found, containerRef])

  useEffect(() => {
    if (!pulsing) return
    const timer = setTimeout(() => setPulsing(false), PULSE_MS)
    return () => clearTimeout(timer)
  }, [pulsing])

  return {
    highlightedId: found ? target : null,
    pulsing,
    changed,
    nearby: nearby.data ?? null,
  }
}

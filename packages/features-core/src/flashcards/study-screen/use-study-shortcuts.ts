"use client"

import type { ReviewRating } from "@ihsp/api"
import { useEffect, useRef } from "react"
import { isConfirmKey, isInteractiveTarget, isTypingTarget, ratingForKey } from "../utils/study-keys"

/** Space and Enter pressed twice in a row must not answer a card by accident. */
const CONFIRM_DELAY_MS = 250

export type StudyShortcuts = {
  /** Whether there is a card to answer. */
  active: boolean
  revealed: boolean
  onReveal: () => void
  onRate: (rating: ReviewRating) => void
}

/**
 * Anki's keys: Space or Enter shows the answer and, once it is shown, answers "Good"; 1 to 4 answer Again, Hard,
 * Good and Easy. Keys typed into fields and Space or Enter on a focused button or link are left alone.
 */
export function useStudyShortcuts(shortcuts: StudyShortcuts): void {
  const latest = useRef(shortcuts)
  const revealedAt = useRef(0)
  useEffect(() => {
    if (shortcuts.revealed) revealedAt.current = Date.now()
  }, [shortcuts.revealed])
  useEffect(() => {
    latest.current = shortcuts
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { active, revealed, onReveal, onRate } = latest.current
      if (!active || event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target))
        return
      if (isConfirmKey(event)) {
        if (isInteractiveTarget(event.target)) return
        event.preventDefault()
        if (!revealed) onReveal()
        else if (Date.now() - revealedAt.current >= CONFIRM_DELAY_MS) onRate("medium")
        return
      }
      const rating = ratingForKey(event.key)
      if (rating && revealed) {
        event.preventDefault()
        onRate(rating)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}

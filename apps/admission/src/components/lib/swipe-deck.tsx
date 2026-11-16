"use client"

import { cn } from "@ihsp/ui"
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"

export type SwipeDirection = "left" | "right"

const THRESHOLD = 110
const MAX_ROTATION = 14

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

export type SwipeDeckProps<T> = {
  items: readonly T[]
  getKey: (item: T) => string
  renderCard: (item: T) => ReactNode
  onSwipe: (item: T, direction: SwipeDirection) => void
  /** Stamp shown while dragging right / left. */
  rightStamp: string
  leftStamp: string
  label: string
  empty: ReactNode
  className?: string
}

/**
 * A stack of cards swiped by pointer drag or the arrow keys (right = yes, left = no). The next card peeks out behind
 * the top one. Adapted from the Deck component of the library, with no animation dependency.
 */
export function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  onSwipe,
  rightStamp,
  leftStamp,
  label,
  empty,
  className,
}: SwipeDeckProps<T>) {
  const [dx, setDx] = useState(0)
  const start = useRef<number | null>(null)
  const top = items[0]
  const next = items[1]
  const swipeRef = useRef({ top, onSwipe })
  swipeRef.current = { top, onSwipe }

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (isEditable(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      const direction = event.key === "ArrowRight" ? "right" : event.key === "ArrowLeft" ? "left" : null
      const { top: current, onSwipe: swipe } = swipeRef.current
      if (!direction || current === undefined) return
      event.preventDefault()
      swipe(current, direction)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function down(event: PointerEvent<HTMLDivElement>) {
    start.current = event.clientX
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (start.current !== null) setDx(event.clientX - start.current)
  }
  function end() {
    if (start.current === null) return
    const distance = dx
    start.current = null
    setDx(0)
    if (top !== undefined && Math.abs(distance) >= THRESHOLD) onSwipe(top, distance > 0 ? "right" : "left")
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  if (top === undefined) return <div className={className}>{empty}</div>
  const progress = Math.min(Math.abs(dx) / THRESHOLD, 1)
  return (
    <div role="group" aria-roledescription="carousel" aria-label={label} className={cn("relative", className)}>
      {next !== undefined ? (
        <div key={getKey(next)} aria-hidden className="pointer-events-none absolute inset-0 scale-[0.96] opacity-70">
          {renderCard(next)}
        </div>
      ) : null}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- pointer drag is an enhancement; the arrow keys (window listener) and the card's own buttons are the keyboard path */}
      <div
        key={getKey(top)}
        role="group"
        aria-roledescription="swipeable card"
        data-testid="deck-top"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={key}
        style={{
          transform: `translateX(${dx}px) rotate(${(dx / 300) * MAX_ROTATION}deg)`,
          touchAction: "pan-y",
        }}
        className={cn(
          "relative h-full cursor-grab select-none active:cursor-grabbing",
          start.current === null
            ? "transition-transform duration-[180ms] ease-out motion-reduce:transition-none"
            : "transition-none",
        )}
      >
        {renderCard(top)}
        {dx !== 0 ? (
          <span
            aria-hidden
            style={{ opacity: progress }}
            className={cn(
              "pointer-events-none absolute top-6 rounded-md border-4 px-3 py-1 text-lg font-bold uppercase",
              dx > 0
                ? "border-success text-success left-6 -rotate-12"
                : "border-destructive text-destructive right-6 rotate-12",
            )}
          >
            {dx > 0 ? rightStamp : leftStamp}
          </span>
        ) : null}
      </div>
    </div>
  )
}

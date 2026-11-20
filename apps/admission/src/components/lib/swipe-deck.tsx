"use client"

import { cn } from "@ihsp/ui"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"

export type SwipeDirection = "left" | "right"

const THRESHOLD = 110
const MAX_ROTATION = 14
/** How long a swiped card takes to leave: translate, blur and fade together. */
const EXIT_MS = 320

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

export type SwipeDeckProps<T> = {
  items: readonly T[]
  getKey: (item: T) => string
  renderCard: (item: T) => ReactNode
  onSwipe: (item: T, direction: SwipeDirection) => void
  /** The direction a card left in when it was decided outside the deck (the buttons); defaults to the last swipe. */
  getExitDirection?: (item: T) => SwipeDirection | undefined
  /** Stamp shown while dragging right / left. */
  rightStamp: string
  leftStamp: string
  label: string
  empty: ReactNode
  className?: string
}

type Leaving<T> = { id: number; item: T; direction: SwipeDirection; from: number }

/** A card on its way out: it starts where the drag left it, then slides off while it blurs and fades. */
function LeavingCard({ direction, from, children, onDone }: { direction: SwipeDirection; from: number; children: ReactNode; onDone: () => void }) {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setGone(true)))
    const timer = setTimeout(onDone, EXIT_MS + 120)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [onDone])
  const sign = direction === "right" ? 1 : -1
  const style: CSSProperties = gone
    ? {
        transform: `translateX(${sign * 70}%) rotate(${sign * MAX_ROTATION}deg)`,
        opacity: 0,
        filter: "blur(12px)",
        transition: `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out, filter ${EXIT_MS}ms ease-out`,
      }
    : { transform: `translateX(${from}px) rotate(${(from / 300) * MAX_ROTATION}deg)`, opacity: 1, filter: "blur(0px)" }
  return (
    <div aria-hidden data-testid="deck-leaving" data-direction={direction} style={style} className="pointer-events-none absolute inset-0 z-20">
      {children}
    </div>
  )
}

/**
 * A stack of cards swiped by pointer drag or the arrow keys (right = yes, left = no). The next card peeks out behind
 * the top one. The drag holds the pointer (`setPointerCapture`), so it goes on when the pointer leaves the card, the deck
 * or the window; a decided card leaves with a blur, a fade and a slide (instantly with reduced motion).
 * Adapted from the Deck component of the library, with no animation dependency.
 */
export function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  onSwipe,
  getExitDirection,
  rightStamp,
  leftStamp,
  label,
  empty,
  className,
}: SwipeDeckProps<T>) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState<Leaving<T>[]>([])
  const drag = useRef<{ pointerId: number; startX: number; dx: number } | null>(null)
  const lastExit = useRef<{ direction: SwipeDirection; from: number }>({ direction: "left", from: 0 })
  const shown = useRef<T | undefined>(undefined)
  const nextId = useRef(0)
  const top = items[0]
  const next = items[1]
  const swipeRef = useRef({ top, onSwipe })
  swipeRef.current = { top, onSwipe }
  const keyOf = useRef(getKey)
  keyOf.current = getKey
  const exitOf = useRef(getExitDirection)
  exitOf.current = getExitDirection
  const itemsRef = useRef(items)
  itemsRef.current = items

  // A card that is no longer in the deck leaves visibly, whoever decided it (drag, key, button).
  useLayoutEffect(() => {
    const previous = shown.current
    shown.current = top
    if (previous === undefined || previous === top) return
    const key = keyOf.current(previous)
    if (itemsRef.current.some((item) => keyOf.current(item) === key)) return
    if (prefersReducedMotion()) return
    const { direction, from } = lastExit.current
    const decided = exitOf.current?.(previous) ?? direction
    setLeaving((current) => [...current, { id: nextId.current++, item: previous, direction: decided, from }])
    lastExit.current = { direction: decided, from: 0 }
  }, [top])

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (isEditable(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      const direction = event.key === "ArrowRight" ? "right" : event.key === "ArrowLeft" ? "left" : null
      const { top: current, onSwipe: swipe } = swipeRef.current
      if (!direction || current === undefined) return
      event.preventDefault()
      lastExit.current = { direction, from: 0 }
      swipe(current, direction)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // While a card is held, nothing on the page may turn into a text selection.
  useEffect(() => {
    if (!dragging) return
    const body = document.body
    const previous = body.style.userSelect
    body.style.userSelect = "none"
    body.style.setProperty("-webkit-user-select", "none")
    window.getSelection()?.removeAllRanges()
    return () => {
      body.style.userSelect = previous
      body.style.removeProperty("-webkit-user-select")
    }
  }, [dragging])

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || drag.current) return
    if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select")) return
    if (event.pointerType === "mouse") event.preventDefault()
    drag.current = { pointerId: event.pointerId, startX: event.clientX, dx: 0 }
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    current.dx = event.clientX - current.startX
    setDx(current.dx)
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
    setDx(0)
    if (top !== undefined && event.type !== "pointercancel" && Math.abs(current.dx) >= THRESHOLD) {
      const direction = current.dx > 0 ? "right" : "left"
      lastExit.current = { direction, from: current.dx }
      onSwipe(top, direction)
    }
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
  }
  const settle = useCallback((id: number) => setLeaving((current) => current.filter((entry) => entry.id !== id)), [])

  const progress = Math.min(Math.abs(dx) / THRESHOLD, 1)
  return (
    <div role="group" aria-roledescription="carousel" aria-label={label} className={cn("relative", className)}>
      {top === undefined ? <div className="h-full">{empty}</div> : null}
      {next !== undefined ? (
        <div key={getKey(next)} aria-hidden className="pointer-events-none absolute inset-0 scale-[0.96] opacity-70">
          {renderCard(next)}
        </div>
      ) : null}
      {leaving.map((entry) => (
        <LeavingCard key={entry.id} direction={entry.direction} from={entry.from} onDone={() => settle(entry.id)}>
          {renderCard(entry.item)}
        </LeavingCard>
      ))}
      {top !== undefined ? (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- pointer drag is an enhancement; the arrow keys (window listener) and the card's own buttons are the keyboard path
        <div
          key={getKey(top)}
          role="group"
          aria-roledescription="swipeable card"
          data-testid="deck-top"
          data-dragging={dragging}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={key}
          onDragStart={(event) => event.preventDefault()}
          style={{
            transform: `translateX(${dx}px) rotate(${(dx / 300) * MAX_ROTATION}deg)`,
            touchAction: "pan-y",
          }}
          className={cn(
            "relative h-full cursor-grab select-none active:cursor-grabbing",
            dragging ? "transition-none" : "transition-transform duration-[180ms] ease-out motion-reduce:transition-none",
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
      ) : null}
    </div>
  )
}

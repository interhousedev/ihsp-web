"use client"

import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { useMotionReduced } from "./motion-presence"

const HANDLE = 44
const THRESHOLD = 0.9

/**
 * A horizontal slider the user drags to the end to agree (to a statement, a submission). Keyboard and switch users
 * press Enter or Space on the handle instead, and with reduced motion the handle jumps instead of gliding.
 * `label` is the text on the track; `doneLabel` replaces it once agreed.
 */
export function SlideToAgree({
  label,
  doneLabel,
  onAgree,
  disabled,
  className,
}: {
  label: string
  doneLabel: string
  onAgree: () => void
  disabled?: boolean
  className?: string
}) {
  const reduced = useMotionReduced()
  const track = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [done, setDone] = useState(false)
  const x = useMotionValue(0)
  const max = Math.max(width - HANDLE - 8, 0)
  const fill = useTransform(x, (value) => value + HANDLE + 4)

  useEffect(() => {
    const element = track.current
    if (!element) return
    const measure = () => setWidth(element.getBoundingClientRect().width)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function settle(to: number) {
    if (reduced) x.set(to)
    else animate(x, to, { type: "spring", stiffness: 500, damping: 40 })
  }

  function agree() {
    if (done || disabled) return
    setDone(true)
    settle(max)
    onAgree()
  }

  function onDragEnd() {
    if (max > 0 && x.get() >= max * THRESHOLD) agree()
    else settle(0)
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      agree()
    }
  }

  return (
    <div
      ref={track}
      className={cn(
        "bg-muted relative flex h-[52px] w-full items-center overflow-hidden rounded-full p-1 select-none",
        disabled && "opacity-50",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="bg-primary/15 absolute inset-y-0 left-0 rounded-full"
        style={{ width: fill }}
      />
      <span className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center px-14 text-center text-sm font-medium">
        {done ? doneLabel : label}
      </span>
      <motion.button
        type="button"
        aria-label={done ? doneLabel : label}
        disabled={disabled || done}
        drag={disabled || done ? false : "x"}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x, width: HANDLE, height: HANDLE }}
        onDragEnd={onDragEnd}
        onKeyDown={onKeyDown}
        className="bg-primary text-primary-foreground relative flex shrink-0 cursor-grab touch-none items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
      >
        {done ? <Icons.check className="size-5" /> : <Icons.chevronsRight className="size-5" />}
      </motion.button>
    </div>
  )
}

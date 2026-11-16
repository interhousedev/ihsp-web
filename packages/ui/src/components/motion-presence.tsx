"use client"

import { AnimatePresence, MotionConfig, motion, useReducedMotion, type HTMLMotionProps } from "motion/react"
import type { ReactNode } from "react"

/**
 * Wraps a subtree so every `motion` component inside honours `prefers-reduced-motion`: transforms and layout
 * animations are skipped, opacity changes stay. Put it once near the root of an app that animates with `motion`.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

/** `true` when the user asked the system for less motion (and on the server's first render). */
export function useMotionReduced(): boolean {
  return useReducedMotion() ?? false
}

const OFFSET = 8

/** A block that fades (and slides up by 8 px) in and out; with reduced motion it only fades. */
export function Reveal({ children, ...props }: HTMLMotionProps<"div">) {
  const reduced = useMotionReduced()
  const y = reduced ? 0 : OFFSET
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y }}
      transition={{ duration: reduced ? 0.01 : 0.18, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Mounts and unmounts `children` with an exit animation. The child has to be a keyed `Reveal` (or any `motion`
 * element with `exit`); `mode="wait"` swaps the old content out before the new one comes in (steps, tabs).
 */
export function AnimatedPresence({
  children,
  mode = "popLayout",
  initial = false,
}: {
  children: ReactNode
  mode?: "sync" | "wait" | "popLayout"
  /** Animate the children present at the first render too. */
  initial?: boolean
}) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  )
}

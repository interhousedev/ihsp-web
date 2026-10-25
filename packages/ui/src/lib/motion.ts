/**
 * Shared open/close motion for overlays and collapsibles: 150-200 ms CSS transitions
 * (fade plus scale or slide). Every class that animates is paired with its
 * `motion-reduce:` override so `prefers-reduced-motion` removes the animation.
 */
export const REDUCED_MOTION = "motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0"

export const MOTION = {
  /** Popovers, dropdowns, tooltips, dialogs: 150 ms. */
  popup: `duration-150 ${REDUCED_MOTION}`,
  /** Sheets and the sidebar slide: 200 ms. */
  slide: `duration-200 ${REDUCED_MOTION}`,
  /** Accordion and collapsible height: 200 ms. */
  collapse: `duration-200 ${REDUCED_MOTION}`,
  /** Toasts. */
  toast: REDUCED_MOTION,
} as const

/** Runtime check for code that animates outside CSS (safe on the server). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false
}

/** Returns `classes` unless the user prefers reduced motion. */
export function motionClass(classes: string, reduced: boolean = prefersReducedMotion()): string {
  return reduced ? "" : classes
}

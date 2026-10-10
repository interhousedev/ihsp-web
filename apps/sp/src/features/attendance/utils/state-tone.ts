import type { MarkedState } from "./lesson-states"

/**
 * The colours of the attendance states, the same on the lesson blocks, the calendar dots and the legend: absent is dark
 * red, late is dark orange, present is green.
 */
export const STATE_TONE: Record<MarkedState, { block: string; dot: string }> = {
  absent: {
    block:
      "border-red-800 bg-red-800/15 text-red-950 hover:bg-red-800/25 dark:border-red-500 dark:bg-red-950/60 dark:text-red-100 dark:hover:bg-red-950/80",
    dot: "bg-red-800 dark:bg-red-500",
  },
  late: {
    block:
      "border-orange-700 bg-orange-700/15 text-orange-950 hover:bg-orange-700/25 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-100 dark:hover:bg-orange-950/80",
    dot: "bg-orange-700 dark:bg-orange-500",
  },
  present: {
    block:
      "border-green-700/60 bg-green-600/10 text-green-950 hover:bg-green-600/20 dark:border-green-500/60 dark:bg-green-900/30 dark:text-green-100 dark:hover:bg-green-900/50",
    dot: "bg-green-600 dark:bg-green-500",
  },
}

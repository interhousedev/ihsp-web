import type { MarkedState } from "./lesson-states"

/**
 * The colours of the attendance states, the same on the lesson blocks, the calendar dots and the legend: absent is dark
 * red, late is dark orange, present is green.
 */
export const STATE_TONE: Record<MarkedState, { block: string; dot: string }> = {
  absent: {
    block: "border-destructive bg-destructive-muted text-destructive hover:bg-destructive-muted/70",
    dot: "bg-destructive",
  },
  late: {
    block: "border-warning bg-warning-muted text-warning hover:bg-warning-muted/70",
    dot: "bg-warning",
  },
  present: {
    block: "border-success bg-success-muted text-success hover:bg-success-muted/70",
    dot: "bg-success",
  },
}

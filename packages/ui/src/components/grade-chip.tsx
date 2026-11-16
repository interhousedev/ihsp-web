import { cn } from "../lib/utils"

/** Letter grades, worst to best. The letter is always shown: colour alone never carries the grade. */
export const GRADES = ["E", "D", "C", "B", "A"] as const
export type Grade = (typeof GRADES)[number]

const TONE: Record<Grade, string> = {
  A: "bg-success-muted text-success",
  B: "bg-info-muted text-info",
  C: "bg-warning-muted text-warning",
  D: "bg-warning-muted text-warning",
  E: "bg-destructive/10 text-destructive",
}

/** A grade as a small round chip: the letter on a tinted background. `label` is the accessible name ("Grade A"). */
export function GradeChip({ grade, label, className }: { grade: Grade; label: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        TONE[grade],
        className,
      )}
    >
      <span aria-hidden>{grade}</span>
    </span>
  )
}

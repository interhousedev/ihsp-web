import { cn } from "../lib/utils"

const TONES: Record<2 | 3 | 4 | 5, string> = {
  2: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  4: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  5: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

/** 2–5 scale tone for a mark; averages (4.3) use the nearest whole mark. */
export function markTone(mark: number): 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(2, Math.round(mark))) as 2 | 3 | 4 | 5
}

/** A mark as a coloured chip (2 red, 3 amber, 4 blue, 5 green); no mark shows a muted dash. */
export function MarkBadge({
  mark,
  size = "md",
  className,
}: {
  mark: number | null | undefined
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizes = { sm: "min-w-6 px-1.5 text-xs", md: "min-w-8 px-2 text-sm", lg: "min-w-10 px-2.5 text-base" }
  if (mark === null || mark === undefined) {
    return (
      <span
        className={cn(
          "bg-muted text-muted-foreground inline-flex items-center justify-center rounded-md py-0.5 font-medium",
          sizes[size],
          className,
        )}
      >
        –
      </span>
    )
  }
  return (
    <span
      data-mark={markTone(mark)}
      className={cn(
        "inline-flex items-center justify-center rounded-md py-0.5 font-semibold tabular-nums",
        TONES[markTone(mark)],
        sizes[size],
        className,
      )}
    >
      {Number.isInteger(mark) ? mark : mark.toFixed(1)}
    </span>
  )
}

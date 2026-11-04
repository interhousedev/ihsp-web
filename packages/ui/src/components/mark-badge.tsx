import { cn } from "../lib/utils"

/** The `--mark-*` tokens (theme.css): 5 success, 4 info, 3 warning, 2 destructive. */
const TONES: Record<2 | 3 | 4 | 5, string> = {
  2: "bg-mark-2-muted text-mark-2",
  3: "bg-mark-3-muted text-mark-3",
  4: "bg-mark-4-muted text-mark-4",
  5: "bg-mark-5-muted text-mark-5",
}

/** 2–5 scale tone for a mark; averages (4.3) use the nearest whole mark. */
export function markTone(mark: number): 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(2, Math.round(mark))) as 2 | 3 | 4 | 5
}

/** Background and text classes of a mark's tone, for cells and chips that are not a `MarkBadge`. */
export function markToneClass(mark: number): string {
  return TONES[markTone(mark)]
}

/** A mark as a coloured chip on the `--mark-*` tokens; no mark shows a muted dash. */
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
        markToneClass(mark),
        sizes[size],
        className,
      )}
    >
      {Number.isInteger(mark) ? mark : mark.toFixed(1)}
    </span>
  )
}

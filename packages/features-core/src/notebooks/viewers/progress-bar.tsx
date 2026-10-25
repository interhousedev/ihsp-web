"use client"

import { cn } from "@ihsp/ui"

type ViewerProgressProps = {
  value: number
  max: number
  /** Text alternative, for example "Card 3 of 20". */
  label: string
  className?: string
}

/** A thin progress bar shared by the flash cards and the quiz (`role="progressbar"`, never colour alone: the counter sits next to it). */
export function ViewerProgress({ value, max, label, className }: ViewerProgressProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

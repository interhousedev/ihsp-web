"use client"

import { useT } from "@ihsp/i18n"
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@ihsp/ui"

/** A GPA or mark with one decimal at most. */
function formatGpa(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/**
 * The GPA counting temporary marks not yet in EMIS, as a superscript beside the main value.
 * Renders nothing when there is none (`null` or `undefined`).
 */
export function TemporaryGpa({ value, className }: { value: number | null | undefined; className?: string }) {
  const t = useT("common")
  if (value === null || value === undefined) return null
  const label = t("withTemporaryMarks")
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <sup
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard users need to reach the tooltip
            tabIndex={0}
            aria-label={`${formatGpa(value)}: ${label}`}
            data-testid="temporary-gpa"
            className={cn(
              "text-muted-foreground ml-0.5 cursor-help align-super text-[0.65em] font-medium tabular-nums",
              className,
            )}
          />
        }
      >
        {formatGpa(value)}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

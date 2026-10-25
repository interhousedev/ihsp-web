"use client"

import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@ihsp/ui"
import { IconAlertTriangle, IconSparkles } from "@ihsp/ui"

type StatusIconProps = {
  /** The tooltip text; it also names the icon for assistive technology. */
  label: string
  className?: string
}

/** The AI sparkle of a source the model is still reading; hover or tap shows the label. */
export function AiReadingIcon({ label, className }: StatusIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- tap and keyboard users reach the tooltip
          <span role="img" aria-label={label} tabIndex={0} className="inline-flex shrink-0 outline-none" />
        }
      >
        <IconSparkles
          aria-hidden
          className={cn("text-primary size-3.5 animate-pulse motion-reduce:animate-none", className)}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** The warning of a source without readable text; hover or tap shows the label. */
export function NoTextIcon({ label, className }: StatusIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- tap and keyboard users reach the tooltip
          <span role="img" aria-label={label} tabIndex={0} className="inline-flex shrink-0 outline-none" />
        }
      >
        <IconAlertTriangle aria-hidden className={cn("mt-px size-3.5 text-amber-700 dark:text-amber-400", className)} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

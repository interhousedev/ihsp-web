"use client"

import { Button, cn } from "@ihsp/ui"
import type { Icon } from "@ihsp/ui"
import type { ComponentProps } from "react"

type ToolbarButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant" | "size"> & {
  icon: Icon
  label: string
  /** On phones show only the icon (the label stays as the accessible name). */
  compact?: boolean
}

/** An outline button with an icon and a label for the toolbars of the viewers (>= 44 px on touch screens). */
export function ToolbarButton({
  icon: IconComponent,
  label,
  compact = false,
  className,
  ...props
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("min-h-11 gap-1.5 md:min-h-9", compact && "min-w-11 px-0 md:min-w-0 md:px-3", className)}
      {...props}
    >
      <IconComponent aria-hidden className="size-4" />
      <span className={cn(compact && "sr-only md:not-sr-only")}>{label}</span>
    </Button>
  )
}

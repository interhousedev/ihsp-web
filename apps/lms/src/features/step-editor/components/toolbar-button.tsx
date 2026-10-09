"use client"

import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger } from "@ihsp/ui"
import type { ComponentType } from "react"
import { type Shortcut, shortcutAria, shortcutLabel } from "../utils/shortcut-label"

/**
 * A formatting button of the editor toolbars: an icon with its name (and shortcut) as label and tooltip, pressed while
 * the format is on. A press never takes the focus or the selection away from the text (44 px on touch screens).
 */
export function ToolbarButton({
  label,
  icon: Icon,
  onPress,
  pressed,
  shortcut,
  disabled,
}: {
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  onPress: () => void
  /** `undefined` for buttons that are not toggles (they insert something). */
  pressed?: boolean
  shortcut?: Shortcut
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={pressed}
            aria-keyshortcuts={shortcut ? shortcutAria(shortcut) : undefined}
            disabled={disabled}
            data-toolbar-item=""
            onMouseDown={(event) => event.preventDefault()}
            onClick={onPress}
            className="aria-pressed:bg-primary/10 aria-pressed:text-primary size-11 shrink-0 md:pointer-fine:size-8"
          />
        }
      >
        <Icon aria-hidden className="size-4" />
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut ? <Kbd>{shortcutLabel(shortcut)}</Kbd> : null}
      </TooltipContent>
    </Tooltip>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Popover, PopoverContent, PopoverTrigger, useIsMobile } from "@ihsp/ui"
import { ColorPicker } from "./color-picker"

/**
 * The palette button of the selected tile. It opens the colour swatches in a popover anchored to that button, so the
 * colour is picked on the tile it changes. On a phone the swatches open below the button; on a desktop they open beside
 * the tile (to the right, top-aligned with the button), so they cover no text of the tile itself. The gap to the button is
 * 8px. Escape or a click outside closes the popover and focus goes back to the button; the popover is kept inside the
 * viewport (it flips or shifts when the tile is near an edge).
 */
export function TileColor({
  color,
  onColor,
  className,
}: {
  color: string | null
  onColor: (color: string | null) => void
  className?: string
}) {
  const t = useT("today.dashboard")
  const isMobile = useIsMobile()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("color")}
            className={cn("bg-card size-11 md:size-8", className)}
          />
        }
      >
        <Icons.palette aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
        sideOffset={8}
        aria-label={t("color")}
      >
        <ColorPicker value={color} onChange={onColor} />
      </PopoverContent>
    </Popover>
  )
}

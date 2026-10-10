"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { ICON_SIZES } from "../icons"
import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

const sizeToIcon = { sm: ICON_SIZES.sm, md: ICON_SIZES.sm, lg: ICON_SIZES.md } as const

const iconButtonVariants = cva("shrink-0", {
  variants: {
    size: { sm: "size-7", md: "size-8", lg: "size-10" },
  },
  defaultVariants: { size: "md" },
})

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "size" | "children" | "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    /** Required: names the button for screen readers and is the tooltip text. */
    "aria-label": string
    icon: React.ComponentType<{ size?: number; stroke?: number; "aria-hidden"?: boolean }>
  }

function IconButton({ icon: Icon, size = "md", variant = "ghost", className, "aria-label": label, ...props }: IconButtonProps) {
  const px = sizeToIcon[size ?? "md"]
  return (
    <TooltipProvider>
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size="icon"
            data-slot="icon-button"
            aria-label={label}
            className={cn(iconButtonVariants({ size }), className)}
            {...props}
          />
        }
      >
        <Icon size={px} stroke={1.75} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
    </TooltipProvider>
  )
}

export { IconButton, iconButtonVariants }
export type { IconButtonProps }

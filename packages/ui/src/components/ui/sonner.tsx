"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

import { useIsMobile } from "../../hooks/use-mobile"
import { MOTION } from "../../lib/motion"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const mobile = useIsMobile()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={`toaster group ${MOTION.toast}`}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      position={mobile ? "top-center" : "bottom-right"}
      mobileOffset={{ top: "calc(var(--header-height) + var(--safe-top, 0px) + 0.5rem)" }}
      {...props}
    />
  )
}

export { Toaster }

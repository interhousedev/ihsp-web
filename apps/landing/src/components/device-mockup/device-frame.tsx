"use client"

import { cn } from "@ihsp/ui"
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { DeviceShell } from "./device-shell"
import { SHELLS } from "./devices"
import "./device-mockup.css"

export type DeviceKind = "laptop" | "phone" | "tablet"

/** The device finish follows the `dark` class of `<html>` (set by the theme script). */
function useFinish(): "light" | "dark" {
  const [finish, setFinish] = useState<"light" | "dark">("light")
  useEffect(() => {
    const root = document.documentElement
    const read = () => setFinish(root.classList.contains("dark") ? "dark" : "light")
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])
  return finish
}

/**
 * One device (adapted from the component library's `media/device-mockup`): the shell in its natural px, scaled to the
 * width of the parent. The screen holds React content laid out at the device's own viewport and scaled to the glass,
 * so the screens are the real UI components, not pictures.
 */
export function DeviceFrame({
  device,
  label,
  children,
  className,
}: {
  device: DeviceKind
  /** Already translated description of what the device shows. */
  label: string
  children: ReactNode
  className?: string
}) {
  const finish = useFinish()
  const geometry = SHELLS[device]
  const { footprint, viewport, screen } = geometry
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    const measure = () => setScale(element.clientWidth / footprint.width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [footprint.width])

  const fit = screen.width / viewport.width

  return (
    <div
      ref={box}
      role="img"
      aria-label={label}
      className={cn("relative w-full select-none", className)}
      style={{ aspectRatio: `${footprint.width} / ${footprint.height}` }}
    >
      <div
        className="dv-live absolute top-0 left-0 origin-top-left"
        style={{
          width: footprint.width,
          height: footprint.height,
          transform: `scale(${scale})`,
          visibility: scale ? undefined : "hidden",
        }}
      >
        <DeviceShell shell={device} finish={finish}>
          <div
            aria-hidden
            inert
            className="bg-background text-foreground origin-top-left overflow-hidden text-sm"
            style={{ width: viewport.width, height: viewport.height, transform: `scale(${fit})` }}
          >
            {children}
          </div>
        </DeviceShell>
      </div>
    </div>
  )
}

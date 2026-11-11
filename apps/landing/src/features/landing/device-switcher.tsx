"use client"

import { useT } from "@ihsp/i18n"
import { cn, IconDeviceLaptop, IconDeviceMobile, IconDeviceTablet, IconLayoutBoardSplit } from "@ihsp/ui"
import { useLayoutEffect, useRef, useState, type ComponentType, type KeyboardEvent } from "react"
import type { DeviceKind } from "../../components/device-mockup/device-frame"
import { DEVICE_SPRING } from "../../components/device-mockup/device-stage"
import { useReducedMotion } from "./reveal"

const OPTIONS: readonly { id: DeviceKind; Icon: ComponentType<{ "aria-hidden"?: boolean; className?: string }> }[] = [
  { id: "phone", Icon: IconDeviceMobile },
  { id: "tablet", Icon: IconDeviceTablet },
  { id: "laptop", Icon: IconDeviceLaptop },
  { id: "foldable", Icon: IconLayoutBoardSplit },
]

/** A segmented radiogroup: roving tabindex, arrows/Home/End move and select. */
export function DeviceSwitcher({ value, onChange }: { value: DeviceKind; onChange: (device: DeviceKind) => void }) {
  const t = useT("landing.hero.devices")
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const group = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null)
  const [ready, setReady] = useState(false)

  // The pill follows the selected button (and keeps following when the labels appear or the row is resized).
  useLayoutEffect(() => {
    const button = refs.current[value]
    const node = group.current
    if (!button || !node) return
    const measure = () => setPill({ x: button.offsetLeft, width: button.offsetWidth })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    observer.observe(button)
    return () => observer.disconnect()
  }, [value])
  useLayoutEffect(() => {
    if (!pill) return
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [pill])

  const onKeyDown = (event: KeyboardEvent) => {
    const index = OPTIONS.findIndex((option) => option.id === value)
    let next = index
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % OPTIONS.length
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + OPTIONS.length) % OPTIONS.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = OPTIONS.length - 1
    else return
    event.preventDefault()
    const option = OPTIONS[next]
    if (!option) return
    onChange(option.id)
    refs.current[option.id]?.focus()
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={t("label")}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="bg-muted relative mx-auto inline-flex max-w-full gap-1 overflow-x-auto rounded-full border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pill && (
        <span
          aria-hidden
          className="bg-background pointer-events-none absolute top-1 bottom-1 left-0 rounded-full shadow-sm"
          style={{
            width: pill.width,
            transform: `translateX(${pill.x}px)`,
            transition:
              ready && !reduced
                ? `transform ${DEVICE_SPRING.duration}ms ${DEVICE_SPRING.easing}, width ${DEVICE_SPRING.duration}ms ${DEVICE_SPRING.easing}`
                : "none",
          }}
        />
      )}
      {OPTIONS.map(({ id, Icon }) => {
        const checked = id === value
        return (
          <button
            key={id}
            ref={(node) => {
              refs.current[id] = node
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t(id)}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              "relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
              checked ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            <span className="hidden sm:inline">{t(id)}</span>
          </button>
        )
      })}
    </div>
  )
}

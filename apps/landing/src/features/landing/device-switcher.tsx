"use client"

import { useT } from "@ihsp/i18n"
import { cn, IconDeviceLaptop, IconDeviceMobile, IconDeviceTablet, IconLayoutBoardSplit } from "@ihsp/ui"
import { useRef, type ComponentType, type KeyboardEvent } from "react"
import type { DeviceKind } from "../../components/device-mockup/device-frame"

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
      role="radiogroup"
      aria-label={t("label")}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="bg-muted mx-auto inline-flex gap-1 rounded-full border p-1"
    >
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
              "inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
              checked ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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

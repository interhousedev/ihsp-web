"use client"

import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import { useRef, type KeyboardEvent } from "react"
import type { AttendanceMark, Mark } from "../utils/marks"

const OPTIONS: { value: AttendanceMark; icon: typeof Icons.check; active: string }[] = [
  { value: "present", icon: Icons.check, active: "border-green-700 bg-green-600 text-white" },
  { value: "late", icon: Icons.clock, active: "border-orange-700 bg-orange-600 text-white" },
  { value: "absent", icon: Icons.close, active: "border-red-800 bg-red-700 text-white" },
]

/**
 * Present / Late / Absent as one radio group: one tap sets the state, the arrow keys move and select, the active
 * option is coloured (green, orange, red) and every option has an icon, so colour is never the only cue. With
 * `clearable` (students without a subgroup) nothing is selected at first and the parent clears the mark when the
 * active option is tapped again.
 */
export function AttendanceSegmented({
  name,
  mark,
  disabled = false,
  clearable = false,
  onMark,
}: {
  name: string
  mark: Mark
  disabled?: boolean
  clearable?: boolean
  onMark: (mark: AttendanceMark) => void
}) {
  const t = useT("lessonDetail.attendance")
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selected = OPTIONS.findIndex((option) => option.value === mark)

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + OPTIONS.length) % OPTIONS.length
    refs.current[next]?.focus()
    onMark(OPTIONS[next]!.value)
  }

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="grid w-full shrink-0 grid-cols-3 gap-1 sm:w-auto"
      data-mark={mark}
    >
      {OPTIONS.map((option, index) => {
        const checked = option.value === mark
        const Icon = option.icon
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t(option.value)}
            disabled={disabled}
            tabIndex={checked || (selected < 0 && index === 0) ? 0 : -1}
            className={cn(
              "focus-visible:ring-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-medium outline-none focus-visible:ring-2 md:min-h-8 md:px-3",
              checked ? option.active : "bg-background text-muted-foreground hover:bg-accent",
            )}
            onClick={() => onMark(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{t(option.value)}</span>
          </button>
        )
      })}
    </div>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconArrowLeft,
  IconArrowRight,
  IconButton,
} from "@ihsp/ui"
import { useRef, useState } from "react"
import { useHistoryStack, type HistoryEntry } from "./use-history-stack"

const LONG_PRESS_MS = 450

type StepButtonProps = {
  direction: "back" | "forward"
  label: string
  target: HistoryEntry | null
  recent: { entry: HistoryEntry; index: number }[]
  onStep: () => void
  onGoTo: (index: number) => void
}

function StepButton({ direction, label, target, recent, onStep, onGoTo }: StepButtonProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | null>(null)
  const longPressed = useRef(false)
  const disabled = target === null
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  const openList = () => {
    if (recent.length > 0) setOpen(true)
  }
  return (
    <DropdownMenu open={open} onOpenChange={(next) => !next && setOpen(false)}>
      <DropdownMenuTrigger
        render={
          <IconButton
            data-slot={`history-${direction}`}
            icon={direction === "back" ? IconArrowLeft : IconArrowRight}
            aria-label={target ? `${label}: ${target.title}` : label}
            disabled={disabled}
          />
        }
        onClick={() => {
          if (longPressed.current) {
            longPressed.current = false
            return
          }
          onStep()
        }}
        onPointerDown={() => {
          longPressed.current = false
          clear()
          timer.current = window.setTimeout(() => {
            longPressed.current = true
            openList()
          }, LONG_PRESS_MS)
        }}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={(event) => {
          event.preventDefault()
          openList()
        }}
      />
      <DropdownMenuContent align="start" className="max-w-72">
        {recent.map(({ entry, index }) => (
          <DropdownMenuItem key={index} onClick={() => onGoTo(index)}>
            <span className="truncate">{entry.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Back and forward through this tab's own page history; long-press or right-click lists the last 10 pages. */
export function HistoryButtons() {
  const t = useT()
  const h = useHistoryStack()
  return (
    <div data-slot="history-buttons" className="flex items-center">
      <StepButton
        direction="back"
        label={t("nav.back")}
        target={h.backEntry}
        recent={h.recentBack}
        onStep={h.back}
        onGoTo={h.goTo}
      />
      <StepButton
        direction="forward"
        label={t("nav.forward")}
        target={h.forwardEntry}
        recent={h.recentForward}
        onStep={h.forward}
        onGoTo={h.goTo}
      />
    </div>
  )
}

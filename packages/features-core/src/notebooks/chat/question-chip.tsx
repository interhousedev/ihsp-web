"use client"

import { cn } from "@ihsp/ui"
import { IconCornerDownRight } from "@tabler/icons-react"

type QuestionChipProps = {
  text: string
  disabled?: boolean
  onAsk: (text: string) => void
  /** `pill` for follow-ups under an answer, `card` for the summary questions (text with a ↳ in the corner). */
  variant?: "pill" | "card"
  className?: string
}

const BASE =
  "focus-visible:ring-ring text-start text-sm outline-hidden transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"

const VARIANTS = {
  pill: "hover:bg-muted min-h-11 rounded-2xl border px-3 py-2 md:min-h-9 md:py-1.5",
  card: "bg-muted/50 hover:bg-muted flex h-full min-h-11 w-full flex-col justify-between gap-2 rounded-2xl p-3",
} as const

/** A suggested or follow-up question; a click sends it as the next question. */
export function QuestionChip({ text, disabled, onAsk, variant = "pill", className }: QuestionChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAsk(text)}
      className={cn(BASE, VARIANTS[variant], className)}
    >
      {text}
      {variant === "card" ? (
        <IconCornerDownRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
      ) : null}
    </button>
  )
}

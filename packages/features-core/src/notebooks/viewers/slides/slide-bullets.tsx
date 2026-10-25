"use client"

import { cn } from "@ihsp/ui"
import { IconCheck } from "@ihsp/ui"
import type { TextTier } from "./slide-deck-state"

/** Type size of the running text of a slide by how much text the slide has (see `textTier`). */
export const BODY_SIZE: Record<TextTier, string> = {
  0: "text-[length:3.4cqw]",
  1: "text-[length:2.9cqw]",
  2: "text-[length:2.4cqw]",
}

type SlideBulletsProps = {
  bullets: readonly string[]
  tier: TextTier
  /** `check` puts a check mark in front of each line (summary), `dot` a round bullet. */
  marker?: "dot" | "check"
  /** For text on the primary colour. */
  inverse?: boolean
  className?: string
}

/** The bullet list of a slide. */
export function SlideBullets({ bullets, tier, marker = "dot", inverse = false, className }: SlideBulletsProps) {
  if (bullets.length === 0) return null
  return (
    <ul className={cn("flex flex-col gap-[1.4cqw]", BODY_SIZE[tier], className)}>
      {bullets.map((bullet, index) => (
        <li key={index} className="flex items-baseline gap-[1.6cqw] leading-snug">
          {marker === "check" ? (
            <IconCheck className="text-primary size-[2.6cqw] shrink-0 translate-y-[0.3cqw]" stroke={3} aria-hidden />
          ) : (
            <span
              aria-hidden
              className={cn(
                "size-[1cqw] shrink-0 -translate-y-[0.3cqw] rounded-full",
                inverse ? "bg-primary-foreground" : "bg-primary",
              )}
            />
          )}
          <span className="min-w-0 [overflow-wrap:anywhere]">{bullet}</span>
        </li>
      ))}
    </ul>
  )
}

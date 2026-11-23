"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { fraction } from "../utils/engagement"

export type LevelRingProps = {
  level: number
  /** XP earned inside the current level. */
  into: number
  /** XP the current level spans (to reach the next one). */
  forNext: number
  /** Diameter in pixels. */
  size?: number
  className?: string
}

/** A ring around the level number that fills as the learner nears the next level. */
export function LevelRing({ level, into, forNext, size = 72, className }: LevelRingProps) {
  const t = useT("engagement")
  const stroke = Math.max(4, Math.round(size / 12))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const share = fraction(into, forNext)
  return (
    <div
      role="meter"
      data-testid="level-ring"
      aria-valuemin={0}
      aria-valuemax={forNext}
      aria-valuenow={Math.min(into, forNext)}
      aria-label={t("levelRing", { level, into, next: forNext })}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          className="stroke-primary transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <span aria-hidden className="absolute flex max-w-[75%] flex-col items-center leading-none">
        <span className="text-muted-foreground max-w-full truncate text-[10px] uppercase">{t("levelShort")}</span>
        <span className="text-xl font-bold tabular-nums">{level}</span>
      </span>
    </div>
  )
}

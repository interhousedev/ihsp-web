"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** A circular percentage; the arc animates when the value changes. */
export function ReadinessRing({
  percent,
  size = 128,
  className,
}: {
  percent: number
  size?: number
  className?: string
}) {
  const t = useT("home.readiness")
  const value = Math.max(0, Math.min(100, percent))
  return (
    <div
      role="progressbar"
      aria-label={t("title")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  )
}

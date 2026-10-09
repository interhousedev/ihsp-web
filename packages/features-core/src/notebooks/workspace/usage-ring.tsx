"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useNotebookUsage, usageRatio } from "../api"
import { useOptionalWorkspace } from "../workspace-context"

const RADIUS = 12
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const WARNING_FROM = 80

export type UsageLevel = "ok" | "warning" | "full"

export function usageLevel(ratio: number): UsageLevel {
  if (ratio >= 100) return "full"
  return ratio >= WARNING_FROM ? "warning" : "ok"
}

const TONE: Record<UsageLevel, string> = {
  ok: "text-primary",
  warning: "text-amber-500",
  full: "text-destructive",
}

/**
 * The header button of the usage dialog: a progress ring of the larger used share of the two token budgets, amber
 * from 80 % and red at 100 %. The percentage is written inside, so the colour is never the only signal. A failing
 * usage request leaves an empty ring.
 */
export function UsageRing({ onOpen }: { onOpen: () => void }) {
  const t = useT("notebooks")
  const usage = useNotebookUsage(useOptionalWorkspace()?.notebookId)
  const ratio = usageRatio(usage.data)
  const level = usageLevel(ratio)
  const offset = CIRCUMFERENCE * (1 - ratio / 100)

  return (
    <button
      type="button"
      aria-label={t("usage.open")}
      title={usage.data ? t("workspace.usageTitle", { percent: ratio }) : t("usage.open")}
      data-level={level}
      className="hover:bg-muted focus-visible:ring-ring relative inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 md:size-9"
      onClick={onOpen}
    >
      <svg viewBox="0 0 32 32" aria-hidden className="size-8 -rotate-90 md:size-7">
        <circle cx="16" cy="16" r={RADIUS} fill="none" strokeWidth="3" className="stroke-muted-foreground/25" />
        <circle
          cx="16"
          cy="16"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-[stroke-dashoffset] motion-reduce:transition-none", TONE[level])}
        />
      </svg>
      {usage.data ? (
        <span aria-hidden className="absolute text-[9px] leading-none font-semibold tabular-nums">
          {ratio}
        </span>
      ) : null}
    </button>
  )
}

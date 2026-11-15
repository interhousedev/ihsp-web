"use client"

import { useT } from "@ihsp/i18n"
import { IconCheck } from "@ihsp/ui"

export type IndicatorStep = { key: string; label: string; state: "done" | "current" | "upcoming" }

/** "Step 1 of 2" with one dot per step; the text carries the state for screen readers. */
export function StepIndicator({ steps }: { steps: IndicatorStep[] }) {
  const t = useT("onboarding")
  const index = Math.max(
    0,
    steps.findIndex((step) => step.state === "current"),
  )
  return (
    <nav aria-label={t("steps")} className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">{t("stepOf", { current: index + 1, total: steps.length })}</p>
      <ol className="flex items-center gap-2">
        {steps.map((step) => (
          <li
            key={step.key}
            aria-current={step.state === "current" ? "step" : undefined}
            className={`flex min-w-0 flex-1 items-center gap-2 border-t-4 pt-2 text-sm ${
              step.state === "upcoming" ? "border-muted text-muted-foreground" : "border-primary"
            } ${step.state === "current" ? "font-semibold" : ""}`}
          >
            {step.state === "done" ? <IconCheck aria-hidden className="size-4 shrink-0" /> : null}
            <span className="truncate">{step.label}</span>
            {step.state === "done" ? <span className="sr-only">{t("stepDone")}</span> : null}
            {step.state === "current" ? <span className="sr-only">{t("stepCurrent")}</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import { Progress, cn } from "@ihsp/ui"
import { IconCheck } from "@ihsp/ui"
import type { StepId } from "./material-values"

/**
 * "Step 2 of 5: About the material" with a progress bar on phones, and the numbered list of all steps on wide
 * screens. The current step carries `aria-current="step"`.
 */
export function StepIndicator({ steps, current }: { steps: readonly StepId[]; current: number }) {
  const t = useT("library.upload.steps")
  const name = t(steps[current] ?? "details")
  return (
    <nav aria-label={t("label")} className="flex flex-col gap-2">
      <p className="text-sm font-medium md:sr-only" data-testid="step-progress">
        {t("progress", { current: current + 1, total: steps.length, name })}
      </p>
      <Progress
        value={((current + 1) / steps.length) * 100}
        aria-label={t("progress", { current: current + 1, total: steps.length, name })}
        className="md:hidden"
      />
      <ol className="hidden items-center gap-2 md:flex">
        {steps.map((step, index) => {
          const done = index < current
          return (
            <li
              key={step}
              aria-current={index === current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-sm",
                index === current ? "font-semibold" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs",
                  index === current && "bg-primary text-primary-foreground border-primary",
                  done && "border-primary text-primary",
                )}
                aria-hidden
              >
                {done ? <IconCheck className="size-4" /> : index + 1}
              </span>
              <span>{t(step)}</span>
              {index < steps.length - 1 ? <span className="bg-border mx-1 h-px w-6" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

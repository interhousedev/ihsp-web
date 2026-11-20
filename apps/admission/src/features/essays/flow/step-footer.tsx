"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"
import type { FlowStepId } from "./steps"

/** The foot of an open step: the single way on to the next one. */
export function StepFooter({ next, onNext, hint }: { next: FlowStepId; onNext?: () => void; hint?: ReactNode }) {
  const t = useT("essayFlow")
  if (!onNext) return null
  return (
    <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">{hint}</p>
      <Button type="button" onClick={onNext} className="min-h-11 sm:min-h-9" data-testid="essay-flow-next">
        {t("next", { step: t(`steps.${next}.title`) })}
        <Icons.arrowRight aria-hidden />
      </Button>
    </div>
  )
}

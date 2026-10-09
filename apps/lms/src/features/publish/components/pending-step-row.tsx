"use client"

import type { PendingChanges } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { StepDiffLoader } from "./step-diff-loader"

type PendingStep = PendingChanges["steps"][number]

const VARIANT = { added: "default", changed: "secondary", removed: "destructive" } as const

/** One pending change: the step, what happened to it and, for added and changed steps, a side-by-side diff. */
export function PendingStepRow({ step }: { step: PendingStep }) {
  const t = useT("publish")
  const [open, setOpen] = useState(false)
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3" data-change={step.change}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={VARIANT[step.change]}>{t(`changes.${step.change}`)}</Badge>
        {step.via_mcp ? <Badge variant="outline">{t("viaMcp")}</Badge> : null}
        {step.via_ai ? <Badge variant="outline">{t("viaAi")}</Badge> : null}
        <span className="min-w-0 flex-1 text-sm font-medium break-words">{step.title}</span>
        {step.change !== "removed" ? (
          <Button
            variant="outline"
            size="sm"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="min-h-11 md:min-h-7"
          >
            <Icons.chevronDown className={open ? "rotate-180" : undefined} aria-hidden />
            {open ? t("hideDiff") : t("showDiff")}
          </Button>
        ) : null}
      </div>
      {open ? <StepDiffLoader stepId={step.step_id} /> : null}
    </li>
  )
}

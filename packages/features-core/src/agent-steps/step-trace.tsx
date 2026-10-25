"use client"

import type { AgentStep } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconChevronDown, IconLoader2, cn } from "@ihsp/ui"
import { useId, useState } from "react"
import { runningStep } from "./merge-steps"
import { formatDuration } from "./step-label"
import { StepRow, useStepText } from "./step-row"

export type StepTraceProps = {
  steps: readonly AgentStep[] | undefined
  /** The answer is being written: the collapsed line names the step that runs now. */
  live?: boolean
}

/**
 * What the assistant did while answering (AI-STEPS): a quiet grey line above the answer, collapsed by default,
 * that opens into a timeline of small rows (a file it read, a search, a tool it used).
 */
export function StepTrace({ steps, live = false }: StepTraceProps) {
  const t = useT("assistant.steps")
  const text = useStepText()
  const [open, setOpen] = useState(false)
  const listId = useId()
  if (!steps || steps.length === 0) return null

  const current = live ? runningStep(steps) : undefined
  const total = steps.reduce((sum, step) => sum + (step.duration_ms ?? 0), 0)
  const duration = total > 0 ? formatDuration(total) : ""

  return (
    <div className="text-muted-foreground flex w-full flex-col text-xs">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("toggle")}
        onClick={() => setOpen((value) => !value)}
        className="hover:text-foreground flex min-h-8 items-center gap-1.5 self-start rounded-md"
      >
        {current ? <IconLoader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        <span>{current ? text(current) : t("summary", { count: steps.length })}</span>
        {!current && duration ? <span className="tabular-nums">· {duration}</span> : null}
        <IconChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <ol
          id={listId}
          aria-label={t("list")}
          className="before:bg-border relative ms-2.5 flex flex-col ps-0 before:absolute before:inset-y-2 before:start-2.5 before:w-px"
        >
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>
      ) : null}
    </div>
  )
}

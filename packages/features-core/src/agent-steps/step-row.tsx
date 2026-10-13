"use client"

import type { AgentStep } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  IconAlertCircle,
  IconChecks,
  IconChevronDown,
  IconEye,
  IconFileText,
  IconLoader2,
  IconSearch,
  IconSparkles,
  IconTool,
  IconWorld,
  cn,
} from "@ihsp/ui"
import { useId, useState, type ComponentType } from "react"
import { formatDuration, stepLabel } from "./step-label"

const KIND_ICONS: Record<AgentStep["kind"], ComponentType<{ className?: string }>> = {
  read_file: IconFileText,
  web_search: IconWorld,
  retrieve: IconSearch,
  open_view: IconEye,
  create: IconSparkles,
  tool: IconTool,
  think: IconChecks,
}

function StepIcon({ step }: { step: AgentStep }) {
  if (step.status === "running") return <IconLoader2 className="size-3.5 animate-spin" aria-hidden />
  if (step.status === "failed") return <IconAlertCircle className="text-destructive size-3.5" aria-hidden />
  const Icon = KIND_ICONS[step.kind]
  return <Icon className="size-3.5" />
}

/** The translated name of a step (`assistant.steps.*`), the tool name when a tool has no translation. */
export function useStepText(): (step: AgentStep) => string {
  const t = useT("assistant.steps")
  return (step) => {
    const label = stepLabel(step)
    if (t.has(label.key)) return t(label.key, label.values)
    return label.fallback ?? step.label
  }
}

/** One quiet grey row of the trace; a step with a target opens to show it as a chip. */
export function StepRow({ step }: { step: AgentStep }) {
  const t = useT("assistant.steps")
  const text = useStepText()
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const duration = formatDuration(step.duration_ms)
  const expandable = Boolean(step.target)

  const line = (
    <>
      <span className="bg-background relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full">
        <StepIcon step={step} />
      </span>
      <span className="min-w-0 flex-1 truncate">{text(step)}</span>
      {step.status === "failed" ? <span className="text-destructive">{t("failed")}</span> : null}
      {duration ? <span className="tabular-nums">{duration}</span> : null}
      {expandable ? (
        <IconChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      ) : null}
    </>
  )

  return (
    <li data-step-kind={step.kind} data-step-status={step.status} className="flex flex-col">
      {expandable ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((value) => !value)}
          className="hover:text-foreground flex min-h-7 w-full items-center gap-2 text-start"
        >
          {line}
        </button>
      ) : (
        <div className="flex min-h-7 items-center gap-2">{line}</div>
      )}
      {expandable && open ? (
        <div id={detailId} className="ps-7 pb-1">
          <span
            title={step.target ?? undefined}
            className="bg-muted text-foreground inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5"
          >
            <IconFileText className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{step.target}</span>
          </span>
        </div>
      ) : null}
    </li>
  )
}

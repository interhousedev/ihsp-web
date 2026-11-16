"use client"

import { useT } from "@ihsp/i18n"
import { Pill, PillIndicator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ihsp/ui"

type Tone = "neutral" | "primary" | "success" | "warning" | "danger"

const STATUS_TONE: Record<string, Tone> = {
  planned: "neutral",
  in_progress: "primary",
  in_review: "warning",
  blocked: "danger",
  done: "success",
}

const PRIORITY_TONE: Record<string, Tone> = { low: "neutral", medium: "warning", high: "danger" }

/** The status of a task as a coloured pill. */
export function StatusPill({ status }: { status: string }) {
  const t = useT("tasks")
  const tone = STATUS_TONE[status] ?? "neutral"
  return (
    <Pill tone={tone}>
      <PillIndicator tone={tone} />
      {t(`status.${status}`)}
    </Pill>
  )
}

/** The priority of a task as a pill. */
export function PriorityPill({ priority }: { priority: string }) {
  const t = useT("tasks")
  return <Pill tone={PRIORITY_TONE[priority] ?? "neutral"}>{t(`priority.${priority}`)}</Pill>
}

/** The "Overdue" badge of a task past its deadline. */
export function OverdueBadge() {
  const t = useT("tasks")
  return <Pill tone="danger">{t("overdue")}</Pill>
}

export const ALL = "all"

/** A select over backend option ids; `allLabel` adds an "all" entry that maps to `undefined`. */
export function OptionSelect({
  value,
  onChange,
  options,
  label,
  allLabel,
  className,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
  options: { value: string; label: string }[]
  label: string
  allLabel?: string
  className?: string
}) {
  const current = value ?? ALL
  const all = allLabel ? [{ value: ALL, label: allLabel }] : []
  const items = [...all, ...options]
  return (
    <Select value={current} onValueChange={(next) => next && onChange(next === ALL ? undefined : String(next))}>
      <SelectTrigger aria-label={label} className={className ?? "min-h-11 w-full md:min-h-8 md:w-auto"}>
        <SelectValue>{(selected: string | null) => items.find((item) => item.value === selected)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

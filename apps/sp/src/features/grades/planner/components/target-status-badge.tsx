"use client"

import type { PlannerTargetStatus } from "@ihsp/api"
import { Badge, cn } from "@ihsp/ui"
import { usePlannerLabels } from "../hooks/use-planner-labels"

const TONES: Record<PlannerTargetStatus, string> = {
  secured: "border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  needed: "border-amber-500/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  not_reachable: "border-red-500/60 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  unknown: "",
}

/** Secured, needs marks, out of reach or not known yet, in words (the colour only backs the words up). */
export function TargetStatusBadge({ status }: { status: PlannerTargetStatus }) {
  const labels = usePlannerLabels()
  return (
    <Badge variant={status === "unknown" ? "secondary" : "outline"} className={cn(TONES[status])}>
      {labels.status(status)}
    </Badge>
  )
}

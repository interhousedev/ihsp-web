"use client"

import type { PlannerTargetStatus } from "@ihsp/api"
import { Badge, cn } from "@ihsp/ui"
import { usePlannerLabels } from "../hooks/use-planner-labels"

const TONES: Record<PlannerTargetStatus, string> = {
  secured: "border-success bg-success-muted text-success",
  needed: "border-warning bg-warning-muted text-warning",
  not_reachable: "border-destructive bg-destructive-muted text-destructive",
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

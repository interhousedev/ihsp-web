"use client"

import { getNotebookUsageOfQuery, getNotebookUsageQuery, type NotebookUsage } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useLoadedNotebook } from "./use-notebooks"

/**
 * Budget (session and day) and quotas; refreshed after every turn and generation. With the id of a notebook that
 * belongs to a course the course pool of the staff member is read (`/v1/notebooks/{id}/usage`), otherwise the
 * student's own budget.
 */
export function useNotebookUsage(notebookId?: string | null) {
  const notebook = useLoadedNotebook(notebookId ?? null)
  const courseId = notebook.data?.course_id ?? null
  const forCourse = notebookId != null && notebookId !== "" && courseId !== null
  return useQuery(forCourse ? getNotebookUsageOfQuery(notebookId) : getNotebookUsageQuery())
}

export type NotebookLimit = { reached: false } | { reached: true; scope: "session" | "day"; resetsAt: string | null }

/**
 * Whether a token budget is used up (chat and generation are blocked; reading continues). When both are used up the
 * later reset time wins.
 */
export function notebookLimit(usage: NotebookUsage | undefined): NotebookLimit {
  if (!usage) return { reached: false }
  const { session, day } = usage.budget
  const sessionFull = session.limit > 0 && session.used >= session.limit
  const dayFull = day.limit > 0 && day.used >= day.limit
  if (!sessionFull && !dayFull) return { reached: false }
  if (sessionFull && dayFull) {
    return Date.parse(session.resets_at ?? "") > Date.parse(day.resets_at ?? "")
      ? { reached: true, scope: "session", resetsAt: session.resets_at }
      : { reached: true, scope: "day", resetsAt: day.resets_at }
  }
  return sessionFull
    ? { reached: true, scope: "session", resetsAt: session.resets_at }
    : { reached: true, scope: "day", resetsAt: day.resets_at }
}

/** The largest used share of the two budgets, 0 to 100 (the header ring turns amber at 80 and red at 100). */
export function usageRatio(usage: NotebookUsage | undefined): number {
  if (!usage) return 0
  const ratios = [usage.budget.session, usage.budget.day].map((part) => (part.limit > 0 ? part.used / part.limit : 0))
  return Math.min(100, Math.round(Math.max(...ratios) * 100))
}

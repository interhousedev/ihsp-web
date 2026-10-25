"use client"

import { getAiUsageQuery, getNotebookUsageOfQuery, getNotebookUsageQuery, type NotebookUsage } from "@ihsp/api"
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

export type NotebookLimit =
  | { reached: false }
  | { reached: true; scope: "session" | "day"; resetsAt: string | null }
  | { reached: true; scope: "access"; resetsAt: null }

/** The limit state of a user whom Administration revoked the notebook AI from (no chat, no Studio). */
export const NOTEBOOK_ACCESS_REVOKED: NotebookLimit = { reached: true, scope: "access", resetsAt: null }

/**
 * Whether Administration revoked the notebook AI from the signed-in user. It reads the AI usage report, which carries
 * the flag (`ai_notebooks_blocked`); a user without the flag, or a report not loaded yet, is not blocked.
 */
export function useNotebookAiBlocked(): boolean {
  return useQuery(getAiUsageQuery()).data?.ai_notebooks_blocked === true
}

/**
 * Whether a token budget is used up (chat and generation are blocked; reading continues). When both are used up the
 * later reset time wins.
 */
export function notebookLimit(usage: NotebookUsage | undefined): NotebookLimit {
  if (!usage) return { reached: false }
  const { session, day } = usage.budget
  const sessionFull = session.limit !== null && session.limit > 0 && session.used >= session.limit
  const dayFull = day.limit !== null && day.limit > 0 && day.used >= day.limit
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
  const ratios = [usage.budget.session, usage.budget.day].map((part) =>
    part.limit !== null && part.limit > 0 ? part.used / part.limit : 0,
  )
  return Math.min(100, Math.round(Math.max(...ratios) * 100))
}

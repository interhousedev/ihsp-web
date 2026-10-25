"use client"

import type { ArtifactKind, NotebookDetail, NotebookUsage } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { useOnline } from "@ihsp/ui"
import { useCallback } from "react"
import { quotaKeyFor, quotaReached } from "../lib/artifact-kinds"
import { notebookLimit, useNotebookAiBlocked, useNotebookUsage } from "../api/use-notebook-usage"

export type GateReason = "offline" | "readonly" | "access" | "limit" | "quota"
export type Gate = { reason: GateReason; message: string }

/**
 * Why generation is blocked right now: the browser is offline, a token budget is used up, or the daily count of that kind is used up. `null` means free to go.
 */
export function useStudioGate(notebook: NotebookDetail) {
  const t = useT("notebooks")
  const root = useT()
  const format = useFormatters()
  const online = useOnline()
  const usage = useNotebookUsage(notebook.id)
  const data = usage.data
  const aiBlocked = useNotebookAiBlocked()

  const general = useCallback((): Gate | null => {
    if (!online) return { reason: "offline", message: root("state.offlineTitle") }
    if (notebook.can_write === false) return { reason: "readonly", message: t("course.readOnlyStudio") }
    if (aiBlocked) return { reason: "access", message: t("limit.access") }
    const limit = notebookLimit(data)
    if (limit.reached) {
      const time = limit.resetsAt ? format.time(limit.resetsAt) : "—"
      return {
        reason: "limit",
        message: t(limit.scope === "session" ? "limit.session" : "limit.day", {
          time,
        }),
      }
    }
    return null
  }, [online, notebook.can_write, aiBlocked, data, format, t, root])

  const forKind = useCallback(
    (kind: ArtifactKind): Gate | null => {
      const blocked = general()
      if (blocked) return blocked
      if (!quotaReached(data, kind)) return null
      const overall = data?.quotas.artifacts
      const overallFull = overall !== undefined && overall.limit !== null && overall.used >= overall.limit
      const label = overallFull || quotaKeyFor(kind) === "artifacts" ? t("kind.artifacts") : t(`kind.${kind}`)
      return { reason: "quota", message: t("limit.quota", { kind: label }) }
    },
    [general, data, t],
  )

  return { usage, forKind }
}

/** True when the study materials count of today is above 70 % of the daily limit (the hint under the tiles). */
export function quotaHintVisible(usage: NotebookUsage | undefined): boolean {
  if (!usage) return false
  const { used, limit } = usage.quotas.artifacts
  return limit !== null && limit > 0 && used / limit > 0.7
}

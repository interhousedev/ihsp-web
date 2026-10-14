"use client"

import { getErrorParam, getMeSyncQuery, isApiError, keys, postMeSync, type MeSyncStatus } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const POLL_MS = 3000

function isActive(state: MeSyncStatus | null | undefined): boolean {
  return state?.status === "queued" || state?.status === "running"
}

function isNumber(value: unknown): value is number {
  return typeof value === "number"
}

/** Re-sync teachers, lessons (with plans) and marks from EMIS; the backend allows one sync per ten minutes. */
export function EmisSyncSection() {
  const t = useT("settings.emisSync")
  const errorMessage = useErrorMessage()
  const format = useFormatters()
  const client = useQueryClient()
  const state = useQuery({
    ...getMeSyncQuery(),
    refetchInterval: (query) => (isActive(query.state.data) ? POLL_MS : false),
  })
  const sync = useMutation({
    mutationFn: () => postMeSync(),
    onSuccess: (queued) => client.setQueryData(keys.me.sync(), queued),
  })
  const current = state.data
  const active = isActive(current)

  function failure(error: unknown): string {
    if (isApiError(error) && error.status === 429) {
      const seconds = getErrorParam(error, "retry_after", isNumber) ?? 600
      return t("rateLimited", { minutes: Math.max(1, Math.ceil(seconds / 60)) })
    }
    return errorMessage(error)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="min-h-11 self-start md:min-h-8"
        disabled={active || sync.isPending}
        onClick={() => sync.mutate()}
      >
        {t("button")}
      </Button>
      {current ? (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {current.status === "queued" ? t("queued") : null}
          {current.status === "running" ? t("running") : null}
          {current.status === "done" && current.finished_at
            ? t("lastSynced", { time: format.dateTime(current.finished_at) })
            : null}
          {current.status === "failed" ? t("failed") : null}
        </p>
      ) : null}
      {sync.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {failure(sync.error)}
        </p>
      ) : null}
    </div>
  )
}

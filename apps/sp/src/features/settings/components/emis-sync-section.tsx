"use client"

import { getMeSyncQuery, keys, postMeSync, type MeSyncStatus } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const POLL_MS = 3000

function isActive(state: MeSyncStatus | null | undefined): boolean {
  return state?.status === "pending" || state?.status === "running"
}

/** Re-sync teachers, lessons, subgroup and marks from EMIS; shows the durable sync record (attempts, reason, what was synced). */
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
    onSuccess: (job) => client.setQueryData(keys.me.sync(), job),
  })
  const current = state.data
  const stateLabel = (status: MeSyncStatus["status"]): string => {
    switch (status) {
      case "pending":
        return t("states.pending")
      case "running":
        return t("states.running")
      case "succeeded":
        return t("states.succeeded")
      case "failed":
        return t("states.failed")
    }
  }
  const active = isActive(current)

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
        <div className="text-muted-foreground flex flex-col gap-1 text-sm" aria-live="polite">
          <p>
            {t("status")}: {stateLabel(current.status)}
            {current.status === "failed" || current.status === "pending" || current.status === "running"
              ? ` · ${t("attempts", { n: current.attempts, max: current.max_attempts ?? current.attempts })}`
              : null}
          </p>
          {current.status === "succeeded" && current.finished_at ? (
            <p>{t("finishedAt", { time: format.dateTime(current.finished_at) })}</p>
          ) : null}
          {current.status === "succeeded" ? (
            <p>
              {t("subgroup", { value: current.subgroup ?? t("noSubgroup") })} ·{" "}
              {t("marks", { n: current.marks_count ?? 0 })}
            </p>
          ) : null}
          {current.status === "failed" && current.last_error ? (
            <p>{t("lastError", { error: current.last_error })}</p>
          ) : null}
          {current.status === "failed" && current.attempts >= (current.max_attempts ?? 0) ? (
            <p>{t("gaveUp", { max: current.max_attempts ?? 0 })}</p>
          ) : null}
        </div>
      ) : null}
      {sync.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(sync.error)}
        </p>
      ) : null}
    </div>
  )
}

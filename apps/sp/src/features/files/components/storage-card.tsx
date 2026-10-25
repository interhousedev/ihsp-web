"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, Progress, StateView } from "@ihsp/ui"
import { useStorage } from "../hooks/use-my-files"
import { formatBytes, quotaPercent } from "../utils/format-bytes"

/** Quota bar ("640 MB of 1.5 GB") and the date this term's files are cleared (FILE-5, FILE-6). */
export function StorageCard() {
  const t = useT("files.storage")
  const format = useFormatters()
  const storage = useStorage()

  if (storage.isPending) return <StateView state="loading" rows={1} />
  if (storage.isError) return <StateView state="error" error={storage.error} onRetry={() => void storage.refetch()} />

  const { used_bytes, quota_bytes, expires_on } = storage.data
  const percent = quotaPercent(used_bytes, quota_bytes)
  const full = percent >= 90

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium">
            {t("used", { used: formatBytes(used_bytes), quota: formatBytes(quota_bytes) })}
          </p>
          <span className={`text-xs ${full ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {percent}%
          </span>
        </div>
        <Progress
          value={percent}
          aria-label={t("label")}
          className={full ? "[&_[data-slot=progress-indicator]]:bg-destructive" : undefined}
        />
        {full ? <p className="text-destructive text-xs">{t("almostFull")}</p> : null}
        {expires_on ? (
          <p className="text-muted-foreground text-xs">{t("clearedOn", { date: format.date(expires_on) })}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

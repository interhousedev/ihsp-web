"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Progress } from "@ihsp/ui"
import { QueryState } from "../../shared/components/query-state"
import { formatBytes } from "../../shared/utils/format-bytes"
import { useStorage } from "../hooks/use-profile"
import { ProfileCard } from "./profile-card"

/** Storage used of the quota and the date the files of the term are cleared (UF-WEB-16 step 4). */
export function StorageCard() {
  const t = useT("profile.storage")
  const f = useFormatters()
  const query = useStorage()
  return (
    <ProfileCard title={t("title")}>
      <QueryState query={query} rows={1}>
        {(storage) => {
          const percent =
            storage.quota_bytes > 0 ? Math.min(100, Math.round((storage.used_bytes / storage.quota_bytes) * 100)) : 0
          return (
            <div className="flex flex-col gap-2">
              <Progress
                value={percent}
                aria-label={t("used", {
                  used: formatBytes(storage.used_bytes),
                  quota: formatBytes(storage.quota_bytes),
                })}
              />
              <p className="text-sm">
                {t("used", { used: formatBytes(storage.used_bytes), quota: formatBytes(storage.quota_bytes) })}
              </p>
              {storage.expires_on ? (
                <p className="text-muted-foreground text-xs">{t("clearedOn", { date: f.date(storage.expires_on) })}</p>
              ) : null}
            </div>
          )
        }}
      </QueryState>
    </ProfileCard>
  )
}

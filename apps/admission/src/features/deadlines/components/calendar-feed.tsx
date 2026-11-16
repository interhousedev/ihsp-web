"use client"

import { getConfig } from "@ihsp/config"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, StateView } from "@ihsp/ui"
import { useCalendarFeed, useIssueCalendarFeed, useRevokeCalendarFeed } from "../calendar-api"

/** The private URL is shown once and disappears when revoked. Never persist it in browser storage. */
export function CalendarFeed() {
  const t = useT("deadlines")
  const errorMessage = useErrorMessage()
  const status = useCalendarFeed()
  const issue = useIssueCalendarFeed()
  const revoke = useRevokeCalendarFeed()
  const pending = issue.isPending || revoke.isPending
  const error = issue.error ?? revoke.error
  const url = issue.data && status.data?.active ? `${getConfig().API_URL.replace(/\/+$/, "")}${issue.data.path}` : null
  if (status.isPending) return <StateView state="loading" rows={1} />
  if (status.isError) return <StateView state="error" error={status.error} onRetry={() => void status.refetch()} />
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-lg border p-3">
      <h3 className="font-medium">{t("calendar.feedTitle")}</h3>
      <p className="text-muted-foreground text-sm">{t("calendar.feedPrivate")}</p>
      {url ? (
        <Input readOnly value={url} aria-label={t("calendar.feedUrl")} onFocus={(event) => event.target.select()} />
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => issue.mutate()}>
          {t(status.data?.active ? "calendar.rotate" : "calendar.subscribe")}
        </Button>
        {status.data?.active ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => revoke.mutate(undefined, { onSuccess: () => issue.reset() })}
          >
            {t("calendar.revoke")}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

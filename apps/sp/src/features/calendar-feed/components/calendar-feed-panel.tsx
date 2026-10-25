"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, CopyButton, Icons, Input } from "@ihsp/ui"
import { useState } from "react"
import { LinkButton } from "../../shared/components/link-button"
import { useCalendarToken } from "../hooks/use-calendar-token"
import { googleCalendarUrl, webcalUrl } from "../utils/feed-links"

/**
 * The private iCal feed of the student's lessons (WEB-6, UF-WEB-04). The URL is shown once, right after it was made;
 * making a new one disables the old one, so a second press asks first.
 */
export function CalendarFeedPanel() {
  const t = useT("calendarFeed")
  const errorMessage = useErrorMessage()
  const token = useCalendarToken()
  const [url, setUrl] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  function create() {
    token.mutate(undefined, {
      onSuccess: (result) => {
        setUrl(result.url)
        setConfirming(false)
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{t("intro")}</p>
      {url ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{t("shownOnce")}</p>
          <div className="flex items-center gap-2">
            <Input readOnly value={url} aria-label={t("feedUrl")} onFocus={(event) => event.currentTarget.select()} />
            <CopyButton value={url} />
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={googleCalendarUrl(url)} target="_blank" rel="noopener noreferrer">
              <Icons.calendarEvent aria-hidden />
              {t("google")}
            </LinkButton>
            <LinkButton href={webcalUrl(url)}>
              <Icons.calendar aria-hidden />
              {t("apple")}
            </LinkButton>
          </div>
          <Button variant="ghost" className="min-h-11 self-start md:min-h-8" onClick={() => setConfirming(true)}>
            {t("regenerate")}
          </Button>
        </div>
      ) : (
        <Button className="min-h-11 self-start md:min-h-8" disabled={token.isPending} onClick={create}>
          {t("create")}
        </Button>
      )}
      {token.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(token.error)}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("regenerateTitle")}
        description={t("regenerateText")}
        confirmLabel={t("regenerateConfirm")}
        destructive
        loading={token.isPending}
        onConfirm={create}
      />
    </div>
  )
}

"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  buttonVariants,
} from "@ihsp/ui"
import Link from "next/link"
import { browseHref, myHref } from "../utils/hrefs"
import { classifyUploadError, numberParam, stringParam } from "./upload-errors"

/**
 * Shown instead of the wizard when the server refuses every upload of this user for now:
 * `library/banned` (with the end date in `params.until` when there is one) or `library/rate-limited`
 * (`params.limit` uploads and `params.resets_at`, the time the limit is lifted).
 */
export function UploadBlocked({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT("library.upload.blocked")
  const format = useFormatters()
  const banned = classifyUploadError(error) === "banned"
  const until = stringParam(error, "until")
  const resets = stringParam(error, "resets_at")
  const limit = numberParam(error, "limit")

  let text: string
  if (banned) text = until ? t("bannedUntil", { date: format.date(until) }) : t("bannedForever")
  else if (resets)
    text = limit
      ? t("rateLimitedAt", { limit, time: format.dateTime(resets) })
      : t("resetsAt", { time: format.dateTime(resets) })
  else text = t("rateLimitedLater")

  return (
    <Empty className="border" role="alert" data-blocked={banned ? "banned" : "rate-limited"}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{banned ? <Icons.lock aria-hidden /> : <Icons.clock aria-hidden />}</EmptyMedia>
        <EmptyTitle>{banned ? t("bannedTitle") : t("rateLimitedTitle")}</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
        {banned ? <EmptyDescription>{t("bannedHint")}</EmptyDescription> : null}
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center gap-2">
        {!banned && onRetry ? (
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onRetry}>
            {t("retry")}
          </Button>
        ) : null}
        <Link href={myHref("uploads")} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
          {t("myUploads")}
        </Link>
        <Link href={browseHref()} className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}>
          {t("browse")}
        </Link>
      </EmptyContent>
    </Empty>
  )
}

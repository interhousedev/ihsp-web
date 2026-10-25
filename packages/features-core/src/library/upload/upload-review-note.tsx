"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Icons, cn } from "@ihsp/ui"
import { useReasonText } from "./reason-text"

/**
 * The reviewer's reason and message for an upload (changes requested, rejected, held, removed). It is a status, not an
 * error, so it uses a polite note. Renders nothing when there is neither a reason nor a message.
 */
export function UploadReviewNote({
  reason,
  message,
  className,
}: {
  reason: string | null
  message: string | null
  className?: string
}) {
  const t = useT("library.item")
  const reasonText = useReasonText()(reason)
  if (!reasonText && !message) return null
  return (
    <Alert
      role="note"
      className={cn("border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40", className)}
    >
      <Icons.info aria-hidden />
      <AlertTitle>{t("reviewerMessage")}</AlertTitle>
      <AlertDescription className="text-foreground flex flex-col gap-1">
        {message ? <span>{message}</span> : null}
        {reasonText ? (
          <span>
            <span className="font-medium">{t("reason")}:</span> {reasonText}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

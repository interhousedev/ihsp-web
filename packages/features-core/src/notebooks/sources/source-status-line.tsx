"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconAlertTriangle } from "@ihsp/ui"
import { AiReadingIcon, NoTextIcon } from "./ai-status-icon"
import { useFailureText } from "./use-failure-text"

type SourceStatusLineProps = {
  source: Pick<SourceItem, "status" | "failure"> & { ai_unsupported?: boolean }
  className?: string
}

/**
 * The line under a title when a source is not `ready`: Waiting… / Reading… (spinner), Could not read: reason,
 * Not available, Outdated. Renders nothing for a ready source. Icons and words, never colour alone.
 */
export function SourceStatusLine({ source, className }: SourceStatusLineProps) {
  const t = useT("notebooks")
  const failureText = useFailureText()
  const reason = failureText(source.failure)

  const unsupported = source.ai_unsupported ? (
    <span
      data-testid="ai-unsupported"
      className={cn("flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400", className)}
    >
      <IconAlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0">{t("status.aiUnsupported")}</span>
    </span>
  ) : null

  switch (source.status) {
    case "ready":
      return unsupported
    case "pending":
    case "processing":
      return (
        <span className={cn("text-muted-foreground flex items-center gap-1 text-xs", className)}>
          <AiReadingIcon label={t("row.aiReading")} />
          {t(`status.${source.status}`)}
        </span>
      )
    case "failed":
      return (
        <span className={cn("flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400", className)}>
          {source.failure === "no_text" ? (
            <NoTextIcon label={t("row.noText")} />
          ) : (
            <IconAlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
          )}
          <span className="min-w-0">{reason ? t("status.failedReason", { reason }) : t("status.failed")}</span>
        </span>
      )
    case "unavailable":
      return (
        <span className={cn("flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400", className)}>
          <IconAlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
          <span className="min-w-0">
            {reason ? t("status.unavailableReason", { reason }) : t("status.unavailable")}
          </span>
        </span>
      )
    case "stale":
      return (
        <>
          <span className={cn("text-muted-foreground text-xs", className)}>{t("status.stale")}</span>
          {unsupported}
        </>
      )
  }
}

"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Progress, Spinner } from "@ihsp/ui"
import { IconAlertTriangle } from "@ihsp/ui"
import { isActive } from "../lib/artifact-kinds"

/** Text of a failed item: the reason for its error code (`notebooks.artifactError.<code>`, else the generic one). */
export function useFailureText(item: Pick<ArtifactItem, "error">): string {
  const t = useT("notebooks")
  const code = item.error?.code
  return code && t.has(`artifactError.${code}`) ? t(`artifactError.${code}`) : t("artifactError.generic")
}

/** The second line of a Studio row: "3 sources · 5 min ago", "Generating…" with progress, the failure or "Canceled". */
export function ItemStatus({ item }: { item: ArtifactItem }) {
  const t = useT("notebooks")
  const format = useFormatters()
  const failure = useFailureText(item)

  if (isActive(item)) {
    const percent = item.progress === null ? null : Math.round(Math.min(1, Math.max(0, item.progress)) * 100)
    return (
      <div className="text-muted-foreground flex flex-col gap-1 text-xs">
        <span className="flex items-start gap-1.5">
          <Spinner className="mt-0.5 size-3.5 shrink-0 motion-reduce:animate-none" aria-hidden />
          <span>{t("item.generating")}</span>
        </span>
        {percent !== null ? <Progress value={percent} aria-label={t("studio.progress")} className="gap-0" /> : null}
      </div>
    )
  }
  if (item.status === "failed") {
    return (
      <span className="text-destructive flex items-start gap-1.5 text-xs">
        <IconAlertTriangle role="img" aria-label={t("item.failed")} className="mt-0.5 size-3.5 shrink-0" />
        <span>{failure}</span>
      </span>
    )
  }
  if (item.status === "canceled") return <span className="text-muted-foreground text-xs">{t("studio.canceled")}</span>
  return (
    <span className="text-muted-foreground text-xs">
      {t("studio.itemSubtitle", { count: item.source_count, time: format.relative(item.created_at) })}
    </span>
  )
}

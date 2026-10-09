"use client"

import type { ArtifactKind, ReportFormat } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useCallback } from "react"

/**
 * Name of an artifact type for titles and fallbacks: a conspect is "Conspect", another report is named after its
 * format ("Study guide"), a report without a format is "Reports", every other kind has its own name.
 */
export function useKindLabel(): (item: { kind: ArtifactKind; format?: ReportFormat | null }) => string {
  const t = useT("notebooks")
  return useCallback(
    ({ kind, format }) => {
      if (kind !== "report") return t(`kind.${kind}`)
      if (format === "conspect") return t("kind.conspect")
      return format ? t(`format.${format}`) : t("kind.report")
    },
    [t],
  )
}

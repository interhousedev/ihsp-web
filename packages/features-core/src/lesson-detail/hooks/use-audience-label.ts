"use client"

import type { AudienceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useCallback } from "react"

/**
 * Text for the audience of a lesson: `2TN2` for a whole group, `2TN2 · subgroup 1` for a subgroup, and the parts
 * joined with `+` for lessons merged from several groups (ACA-6).
 */
export function useAudienceLabel(): (audience: readonly AudienceItem[]) => string {
  const t = useT("lessonDetail.audience")
  return useCallback(
    (audience) =>
      audience
        .map((item) =>
          item.subgroup === null ? item.group_name : t("subgroup", { group: item.group_name, number: item.subgroup }),
        )
        .join(" + "),
    [t],
  )
}

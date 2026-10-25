"use client"

import { useT } from "@ihsp/i18n"
import { useCallback } from "react"

type LooseTranslator = { (key: string): string; has: (key: string) => boolean }

const CODE = /^[a-z][a-z_]*$/

/**
 * Text for the `reason` of an upload row. A librarian's reason is free text and is shown as written. A machine code
 * (`withdrawn_by_owner`, `reported`, or a report reason such as `personal_data`) gets a translated sentence when we
 * know it; an unknown code is shown as it came.
 */
export function useReasonText(): (reason: string | null) => string | null {
  const t = useT("library") as unknown as LooseTranslator
  return useCallback(
    (reason) => {
      if (!reason) return null
      if (!CODE.test(reason)) return reason
      for (const key of [`myUploads.reasonCode.${reason}`, `report.reason.${reason}`]) {
        if (t.has(key)) return t(key)
      }
      return reason
    },
    [t],
  )
}

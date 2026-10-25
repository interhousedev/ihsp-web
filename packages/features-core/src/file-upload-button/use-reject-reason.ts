"use client"

import { useT } from "@ihsp/i18n"
import { useCallback } from "react"

/** next-intl types keys from a message file; here the key depends on what the backend sent. */
type LooseTranslator = { (key: string): string; has: (key: string) => boolean }

/**
 * Text for `FileItem.reject_reason`: an API error type (`files/type-not-allowed`) uses `errors.*`, a short code
 * (`type_mismatch`, `infected`) uses `files.reasons.*`, anything unknown is shown as the backend wrote it.
 */
export function useRejectReason(): (reason: string | null) => string {
  const t = useT() as unknown as LooseTranslator
  return useCallback(
    (reason) => {
      if (!reason) return t("files.reasons.unknown")
      const key = reason.includes("/") ? `errors.${reason.split("/").join(".")}` : `files.reasons.${reason}`
      return t.has(key) ? t(key) : reason
    },
    [t],
  )
}

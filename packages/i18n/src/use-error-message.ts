"use client"

import { useTranslations } from "next-intl"
import { useCallback } from "react"

type ErrorLike = { type?: unknown; params?: unknown }

/** next-intl types keys from a message file; here keys are built at run time. */
type LooseTranslator = {
  (key: string, values?: Record<string, string | number>): string
  has: (key: string) => boolean
}

function errorType(error: unknown): string | null {
  const type = typeof error === "object" && error !== null ? (error as ErrorLike).type : null
  return typeof type === "string" && type.length > 0 ? type : null
}

/**
 * Message for a failed request: `errors.<type with / replaced by .>` (for example `common/conflict` →
 * `errors.common.conflict`), the API error's `params` as ICU values, and `errors.generic` for unknown types.
 * Works with any object that has a `type` string, so it needs no import from `@ihsp/api`.
 */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations() as unknown as LooseTranslator
  return useCallback(
    (error: unknown) => {
      const type = errorType(error)
      const key = type ? `errors.${type.split("/").join(".")}` : "errors.generic"
      const params = (error as ErrorLike | null)?.params
      const values = typeof params === "object" && params !== null ? (params as Record<string, string | number>) : {}
      return t.has(key) ? t(key, values) : t("errors.generic")
    },
    [t],
  )
}

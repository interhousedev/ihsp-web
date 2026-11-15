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

/** Fallback for any `emis/*` problem without its own copy: the fault is on EMIS's side. */
const EMIS_UPSTREAM_KEY = "errors.emis.upstream"

/**
 * Message for a failed request: `errors.<type with / replaced by .>` (for example `common/conflict` →
 * `errors.common.conflict`), the API error's `params` as ICU values. An `emis/*` type without its own copy gets
 * `errors.emis.upstream`; other unknown types get `errors.generic`.
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
      if (t.has(key)) return t(key, values)
      return t(type?.startsWith("emis/") ? EMIS_UPSTREAM_KEY : "errors.generic")
    },
    [t],
  )
}

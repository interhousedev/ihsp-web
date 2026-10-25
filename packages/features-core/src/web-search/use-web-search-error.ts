"use client"

import { getErrorParam, isApiError } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"

/** The failures of a request sent with the web switch on (backend `web-search/*`). */
export type WebSearchFailure = "disabled" | "quota-exceeded" | "unavailable"

const TYPES: Record<string, WebSearchFailure> = {
  "web-search/disabled": "disabled",
  "web-search/quota-exceeded": "quota-exceeded",
  "web-search/unavailable": "unavailable",
}

/** Which web search failure an error is, or `null` for any other error. */
export function webSearchFailure(error: unknown): WebSearchFailure | null {
  return isApiError(error) ? (TYPES[error.type] ?? null) : null
}

const isString = (value: unknown): value is string => typeof value === "string"

/**
 * Text of a web search failure (the reset time is formatted for `quota-exceeded`), or `null` when `error` is
 * something else, so callers fall back to their own error text.
 */
export function useWebSearchErrorMessage(): (error: unknown) => string | null {
  const t = useT("errors.web-search")
  const composer = useT("assistant.composer")
  const format = useFormatters()
  return (error) => {
    const failure = webSearchFailure(error)
    if (failure === null) return null
    if (failure === "disabled") return t("disabled")
    if (failure === "unavailable") return t("unavailable")
    const resetsAt = isApiError(error) ? getErrorParam(error, "resets_at", isString) : undefined
    return resetsAt ? composer("webNone", { time: format.time(resetsAt) }) : t("quota-exceeded")
  }
}

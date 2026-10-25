"use client"

import { getErrorParam, isApiError } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"

const isString = (value: unknown): value is string => typeof value === "string"

/**
 * Text for a failed notebook request. The limit errors get their own sentences with the reset time
 * (`notebooks/limit-reached`, `notebooks/quota-exceeded`, `notebooks/busy`); everything else goes through
 * `errors.<type>`.
 */
export function useNotebookErrorMessage(): (error: unknown) => string {
  const t = useT("notebooks")
  const format = useFormatters()
  const generic = useErrorMessage()
  return (error) => {
    if (!isApiError(error)) return generic(error)
    const resetsAt = getErrorParam(error, "resets_at", isString)
    const time = resetsAt ? format.time(resetsAt) : "—"
    if (error.type === "notebooks/limit-reached") {
      return getErrorParam(error, "scope", isString) === "session"
        ? t("limit.session", { time })
        : t("limit.day", { time })
    }
    if (error.type === "notebooks/quota-exceeded") {
      const kind = getErrorParam(error, "kind", isString) ?? "artifacts"
      const label = t.has(`kind.${kind}`) ? t(`kind.${kind}`) : kind
      return t("limit.quota", { kind: label })
    }
    if (error.type === "notebooks/busy") return t("limit.busy")
    return generic(error)
  }
}

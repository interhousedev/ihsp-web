import { errorMessageKey, isApiError, isNetworkError } from "@ihsp/api"

/**
 * Message key for an API error: the id app's own `idErrors.<type>` first (`auth/locked` -> `idErrors.auth.locked`),
 * then the shared `errors.*` keys, then `idErrors.generic`.
 */
export function idErrorKey(error: unknown, has: (key: string) => boolean): string {
  if (isNetworkError(error)) return "idErrors.network"
  if (!isApiError(error)) return "idErrors.generic"
  if (error.type === "auth/otp-invalid" && typeof error.params.attempts_left !== "number") {
    return "idErrors.auth.otp-invalid-plain"
  }
  const own = `idErrors.${error.type.split("/").join(".")}`
  if (has(own)) return own
  const shared = errorMessageKey(error, has)
  return shared === "errors.generic" ? "idErrors.generic" : shared
}

/** ICU values every `idErrors.*` message may use. */
export function idErrorValues(error: unknown): { minutes: number; seconds: number; attempts: number } {
  const params = isApiError(error) ? error.params : {}
  const retry = typeof params.retry_after === "number" ? params.retry_after : 0
  const attempts = typeof params.attempts_left === "number" ? params.attempts_left : 0
  return { minutes: Math.max(1, Math.ceil(retry / 60)), seconds: retry, attempts }
}

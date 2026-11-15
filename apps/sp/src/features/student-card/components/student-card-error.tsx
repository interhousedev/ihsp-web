"use client"

import { isApiError } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"

/** The problem type of an EMIS login that was refused (the backend answers it with HTTP 409). */
export const EMIS_AUTH_FAILED = "emis/auth-failed"

/** Whether the card could not load because the stored EMIS login no longer works. */
export function needsRelink(error: unknown): boolean {
  return isApiError(error) && error.type === EMIS_AUTH_FAILED
}

/** Retry only server hiccups: a 4xx (EMIS refused the login, no card) answers the same every time. */
export function retryCardQuery(count: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false
  return count < 2
}

/**
 * The student card could not load. `inline` is a compact row under the identity header; otherwise a full state for the
 * sheet. Both offer "Try again", and a refused EMIS login adds the hint and the link to renew it.
 */
export function StudentCardError({
  error,
  onRetry,
  inline = false,
}: {
  error: unknown
  onRetry: () => void
  inline?: boolean
}) {
  const t = useT("studentCard")
  const common = useT("common")
  const relink = needsRelink(error)
  const relinkLink = relink ? (
    <LinkButton href={`${getConfig().ID_URL}/security/emis/`} variant="default">
      {t("relinkAction")}
    </LinkButton>
  ) : null

  if (!inline) {
    return (
      <StateView
        state="error"
        error={error}
        title={t("loadFailed")}
        description={relink ? t("relinkHint") : undefined}
        onRetry={onRetry}
        action={relinkLink}
      />
    )
  }
  return (
    <div role="alert" className="text-destructive flex flex-wrap items-center gap-x-3 gap-y-1 px-3 text-sm">
      <span className="flex min-w-0 items-center gap-1.5">
        <Icons.warning aria-hidden className="size-4 shrink-0" />
        {relink ? t("relinkHint") : t("loadFailed")}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {common("retry")}
      </Button>
      {relinkLink}
    </div>
  )
}

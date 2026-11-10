"use client"

import { isApiError } from "@ihsp/api"
import { ErrorAlert, useTr } from "@ihsp/features-core/id-account"
import { clientUrl } from "../../shared/utils/client-url"

/** A failed login step; when the role is missing it also links back to the app the user came from. */
export function LoginError({ error, clientId }: { error: unknown; clientId: string }) {
  const t = useTr()
  if (!error) return null
  const backUrl = isApiError(error) && error.type === "auth/role-missing" ? clientUrl(clientId) : null
  return (
    <div className="grid gap-2">
      <ErrorAlert error={error} />
      {backUrl ? (
        <a href={backUrl} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          {t("login.backToApp")}
        </a>
      ) : null}
    </div>
  )
}

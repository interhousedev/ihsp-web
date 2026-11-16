"use client"

import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, buttonVariants } from "@ihsp/ui"
import Link from "next/link"

/** The error of an AI helper: missing consent links to the settings, a spent quota says so. */
export function CoachError({ error }: { error: unknown }) {
  const t = useT("essays")
  const errorMessage = useErrorMessage()
  if (!error) return null
  const err = error instanceof ApiError ? error : null
  if (err?.type === "admission/consent_required")
    return (
      <Alert>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          {t("coach.consent")}
          <Link href="/settings/#consent" className={buttonVariants({ size: "sm" })}>
            {t("coach.consentLink")}
          </Link>
        </AlertDescription>
      </Alert>
    )
  if (err?.type === "admission/quota_exceeded" || err?.status === 429)
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("coach.quota")}</AlertDescription>
      </Alert>
    )
  return (
    <p role="alert" className="text-destructive text-sm">
      {errorMessage(error)}
    </p>
  )
}

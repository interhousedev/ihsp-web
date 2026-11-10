"use client"

import { Alert, AlertDescription, AlertTitle } from "@ihsp/ui"
import { useTr } from "../../shared/hooks/use-tr"
import { LinkButton } from "../../shared/components/link-button"

/** ID-8: EMIS rejected the saved password; the student enters the new one. */
export function EmisReauthBanner() {
  const t = useTr()
  return (
    <Alert variant="destructive">
      <AlertTitle>{t("security.emisBanner.title")}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <span>{t("security.emisBanner.description")}</span>
        <span>
          <LinkButton href="/security/emis/" variant="outline">
            {t("security.emisBanner.action")}
          </LinkButton>
        </span>
      </AlertDescription>
    </Alert>
  )
}

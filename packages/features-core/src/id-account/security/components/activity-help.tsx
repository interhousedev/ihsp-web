"use client"

import { Alert, AlertDescription, AlertTitle } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** UF-ID-14 step 2: unknown activity leads straight to the fixes. */
export function ActivityHelp() {
  const t = useTr()
  return (
    <Alert>
      <AlertTitle>{t("security.activity.helpTitle")}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <span>{t("security.activity.helpDescription")}</span>
        <span className="flex flex-wrap gap-2">
          <LinkButton href="/security/password/" variant="outline">
            {t("security.activity.changePassword")}
          </LinkButton>
          <LinkButton href="/security/sessions/" variant="outline">
            {t("security.activity.logOutEverywhere")}
          </LinkButton>
        </span>
      </AlertDescription>
    </Alert>
  )
}

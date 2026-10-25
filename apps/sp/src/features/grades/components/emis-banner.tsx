"use client"

import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Icons } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"

/** Shown when the EMIS password stopped working: old marks stay visible, the banner leads to the fix (UF-WEB-09 1b). */
export function EmisBanner() {
  const t = useT("grades.emis")
  const { session } = useSession()
  if (session?.user.emis_status !== "needs_reauth") return null
  return (
    <Alert>
      <Icons.warning aria-hidden />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        {t("text")}
        <LinkButton href={`${getConfig().ID_URL}/security/emis/`}>{t("action")}</LinkButton>
      </AlertDescription>
    </Alert>
  )
}

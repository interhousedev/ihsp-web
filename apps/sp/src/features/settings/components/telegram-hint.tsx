"use client"

import { getIdMeTelegramQuery } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { LinkButton } from "../../shared/components/link-button"

/** Without a linked Telegram the settings still work, but notifications arrive only on the web (UF-WEB-17 2a). */
export function TelegramHint() {
  const t = useT("settings.notifications")
  const accounts = useQuery(getIdMeTelegramQuery()).data
  if (!accounts || accounts.length > 0) return null
  return (
    <Alert className="mb-4">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        {t("noTelegram")}
        <LinkButton href={`${getConfig().ID_URL}/security/telegram/`}>{t("linkTelegram")}</LinkButton>
      </AlertDescription>
    </Alert>
  )
}

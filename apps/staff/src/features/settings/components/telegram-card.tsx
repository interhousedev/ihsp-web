"use client"

import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"

/**
 * Telegram link status (STF-10, UF-STF-01): lesson links and the end-of-lesson prompt come through the bot, so the
 * teacher links Telegram in the account security app. Without it notifications arrive only on the web.
 */
export function TelegramCard() {
  const t = useT("settings.telegram")
  const { session } = useSession()
  if (!session) return null
  const accounts = session.user.telegram
  const href = `${getConfig().ID_URL}/security/telegram/`

  return (
    <div className="flex flex-col gap-3">
      {accounts.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("notLinked")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {accounts.map((account) => (
            <li key={account.telegram_user_id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                {account.username ? `@${account.username}` : account.telegram_user_id}
              </span>
              {account.blocked ? (
                <Badge variant="destructive">{t("blocked")}</Badge>
              ) : (
                <Badge variant="secondary">{t("linked")}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      <LinkButton href={href} className="w-fit">
        {accounts.length === 0 ? t("link") : t("manage")}
      </LinkButton>
    </div>
  )
}

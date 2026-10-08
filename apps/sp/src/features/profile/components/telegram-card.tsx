"use client"

import type { TelegramAccount } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useFormatters, useT } from "@ihsp/i18n"
import { LinkButton } from "../../shared/components/link-button"
import { ProfileCard } from "./profile-card"

/** Linked Telegram accounts; "Manage" opens the ID service (UF-WEB-16 step 3). */
export function TelegramCard({ accounts }: { accounts: TelegramAccount[] }) {
  const t = useT("profile.telegram")
  const f = useFormatters()
  return (
    <ProfileCard
      title={t("title")}
      action={
        <LinkButton href={`${getConfig().ID_URL}/security/telegram/`}>
          {accounts.length > 0 ? t("manage") : t("link")}
        </LinkButton>
      }
    >
      {accounts.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("none")}</p>
      ) : (
        <ul className="divide-y">
          {accounts.map((account) => (
            <li
              key={account.telegram_user_id}
              className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-1 text-sm"
            >
              <span className="font-medium">
                {account.username ? `@${account.username}` : account.telegram_user_id}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("linkedOn", { date: f.date(account.linked_at) })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  )
}

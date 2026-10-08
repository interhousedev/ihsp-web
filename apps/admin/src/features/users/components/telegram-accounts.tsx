"use client"

import type { TelegramAccount } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** Telegram accounts linked to a user (read-only). */
export function TelegramAccounts({ accounts }: { accounts: TelegramAccount[] }) {
  const t = useT("account")
  const f = useFormatters()
  if (accounts.length === 0) return <p className="text-muted-foreground text-sm">{t("noTelegram")}</p>
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {accounts.map((account) => (
        <li key={account.telegram_user_id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium">{account.username ? `@${account.username}` : account.telegram_user_id}</p>
            <p className="text-muted-foreground text-xs">{t("linkedAt", { date: f.date(account.linked_at) })}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {account.otp_delivery ? <Badge variant="secondary">{t("otpDelivery")}</Badge> : null}
            {account.blocked ? <Badge variant="destructive">{t("botBlocked")}</Badge> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

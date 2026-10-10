"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { buttonVariants } from "@ihsp/ui"
import { IconBrandTelegram } from "@ihsp/ui"

/** The Telegram mini app is the other way in: no install, the same portal inside the bot. */
export function TelegramLink() {
  const t = useT("pwa")
  const bot = getConfig().BOT_USERNAME
  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={`https://t.me/${bot}`}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "outline", className: "h-12 w-full text-base" })}
      >
        <IconBrandTelegram aria-hidden />
        {t("telegram.open")}
      </a>
      <p className="text-muted-foreground text-center text-xs">{t("telegram.hint")}</p>
    </div>
  )
}

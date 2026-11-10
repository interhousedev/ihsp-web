"use client"

import { getConfig } from "@ihsp/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, QrCode } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** UF-ID-04: **Link Telegram** opens the bot (`t.me/<bot>`); on a desktop the QR code opens it on the phone. */
export function LinkTelegramCard() {
  const t = useTr()
  const url = `https://t.me/${getConfig().BOT_USERNAME}`
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.telegram.linkTitle")}</CardTitle>
        <CardDescription>{t("security.telegram.linkDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <LinkButton href={url} newTab>
          {t("security.telegram.link")}
        </LinkButton>
        <div className="hidden md:block">
          <QrCode value={url} size={128} label={t("security.telegram.qr")} />
        </div>
      </CardContent>
    </Card>
  )
}

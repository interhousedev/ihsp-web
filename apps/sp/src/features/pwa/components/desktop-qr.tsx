"use client"

import { useT } from "@ihsp/i18n"
import { QrCode } from "@ihsp/ui"
import { installAppUrl } from "../utils/app-mode"

/** On a computer the app is installed from a phone: a QR code opens this address there. */
export function DesktopQr() {
  const t = useT("pwa")
  const address = `${installAppUrl() ?? window.location.origin}/`
  return (
    <section className="flex flex-col items-center gap-3 text-center" aria-labelledby="pwa-platform-title">
      <h2 id="pwa-platform-title" className="text-base font-semibold">
        {t("desktop.title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("desktop.scan")}</p>
      <QrCode value={address} size={192} label={t("desktop.qrLabel")} />
      <p className="text-muted-foreground text-sm">{t("desktop.address", { url: address })}</p>
    </section>
  )
}

"use client"

import { isMiniApp } from "@ihsp/telegram/core"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import type { MouseEvent } from "react"
import { LICENSE_PACKAGES_PATH, PROJECT_LICENSE, SOURCE_CODE_BACKEND_URL, SOURCE_CODE_WEB_URL } from "./project-license"

const LINK = "focus-visible:ring-ring rounded-sm underline-offset-4 outline-hidden hover:underline focus-visible:ring-2"

/**
 * In the Telegram mini app the link leaves through the Telegram SDK (a plain new tab does not work there); everywhere
 * else the browser follows the anchor's `target="_blank"`.
 */
function leaveForTelegram(event: MouseEvent<HTMLAnchorElement>) {
  if (!isMiniApp()) return
  event.preventDefault()
  const url = new URL(event.currentTarget.href).href
  void import("@ihsp/telegram").then(({ openExternalLink }) => {
    if (!openExternalLink(url)) window.open(url, "_blank", "noopener,noreferrer")
  })
}

/** The AGPL notice with the links to the source of both repositories, and the link to the open source packages page. */
export function LicenseSection() {
  const t = useT("license")
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-sm">
          <p>{t("projectNotice", { license: PROJECT_LICENSE })}</p>
          <ul className="flex flex-col gap-1">
            <li>
              <a href={SOURCE_CODE_WEB_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                {t("webApps")}
              </a>
            </li>
            <li>
              <a href={SOURCE_CODE_BACKEND_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                {t("backend")}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <a
            href={LICENSE_PACKAGES_PATH}
            target="_blank"
            rel="noopener noreferrer"
            onClick={leaveForTelegram}
            className={`${LINK} inline-flex min-h-11 items-center text-sm font-medium md:min-h-8`}
          >
            {t("packagesShow")}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

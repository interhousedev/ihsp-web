"use client"

import { readConfig } from "@ihsp/config"
import { useEffect, useState } from "react"

export type LandingLinks = {
  /** Telegram bot (`https://t.me/<IHSP_BOT_USERNAME>`): /start offers applicants the guest mode. */
  bot: string
  sp: string
  staff: string
  lms: string
  library: string
  securityContact?: string
}

/** Production addresses, used in the static HTML and when `/env.js` is missing or invalid. */
export const DEFAULT_LINKS: LandingLinks = {
  bot: "https://t.me/ihspbot",
  sp: "https://my.ihsu.uz",
  staff: "https://staff.ihsu.uz",
  lms: "https://lms.ihsu.uz",
  library: "https://lib.ihsu.uz",
}

export function botUrl(username: string): string {
  return `https://t.me/${encodeURIComponent(username.replace(/^@/, ""))}`
}

/** Links from the runtime config (`window.__ENV__`), read after mount so the static HTML never depends on env.js. */
export function useLandingLinks(): LandingLinks {
  const [links, setLinks] = useState(DEFAULT_LINKS)
  useEffect(() => {
    const result = readConfig()
    if (!result.ok) return
    const config = result.config
    setLinks({
      bot: botUrl(config.BOT_USERNAME),
      sp: config.SP_URL,
      staff: config.STAFF_URL,
      lms: config.LMS_URL,
      library: config.LIBRARY_URL ?? DEFAULT_LINKS.library,
      securityContact: config.SECURITY_CONTACT,
    })
  }, [])
  return links
}

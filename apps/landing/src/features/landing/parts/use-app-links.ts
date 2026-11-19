"use client"

import { readConfig } from "@ihsp/config"
import { BRAND } from "@ihsp/config/brand"
import { useEffect, useState } from "react"
import { useLandingLinks } from "../links"

export type AppKey = "sp" | "staff" | "lms" | "library" | "admission" | "share" | "admin" | "id"

/**
 * Addresses of every app. The four of `useLandingLinks` and the admission host are known in the static HTML; the others
 * come from the runtime config after mount, so until then they are absent (the tile renders without a link).
 */
export function useAppLinks(): Partial<Record<AppKey, string>> {
  const landing = useLandingLinks()
  const [extra, setExtra] = useState<Partial<Record<AppKey, string>>>({ admission: `https://${BRAND.admissionHost}` })
  useEffect(() => {
    const result = readConfig()
    if (!result.ok) return
    const config = result.config
    setExtra({
      admission: config.ADMISSION_URL ?? `https://${BRAND.admissionHost}`,
      share: config.SHARE_URL,
      admin: config.ADMIN_URL,
      id: config.ID_URL,
    })
  }, [])
  return { sp: landing.sp, staff: landing.staff, lms: landing.lms, library: landing.library, ...extra }
}

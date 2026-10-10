"use client"

import { useT } from "@ihsp/i18n"

export function StaffBrand() {
  const t = useT("app")
  return (
    <div className="flex items-center gap-2 px-2 py-1 font-semibold">
      {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public (a 64 px PNG: the SVG weighs 1 MB) */}
      <img src="/icons/logo-64.png" alt="" width={24} height={24} className="size-6 shrink-0 rounded-full" />
      <span className="truncate group-data-[collapsible=icon]:hidden">{t("name")}</span>
    </div>
  )
}

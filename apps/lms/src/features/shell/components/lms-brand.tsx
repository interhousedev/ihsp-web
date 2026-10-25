"use client"

import { useT } from "@ihsp/i18n"

export function LmsBrand() {
  const t = useT("app")
  return (
    <div className="flex items-center gap-2 px-2 py-1 font-semibold">
      {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
      <img src="/icons/logo.svg" alt="" width={24} height={24} className="size-6 shrink-0 rounded-md" />
      <span className="truncate group-data-[collapsible=icon]:hidden">{t("name")}</span>
    </div>
  )
}

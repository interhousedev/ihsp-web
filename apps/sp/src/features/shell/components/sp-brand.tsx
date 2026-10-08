"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"

export function SpBrand() {
  const t = useT("app")
  return (
    <div className="flex items-center gap-2 px-2 py-1 font-semibold">
      <Icons.logo aria-hidden />
      <span className="truncate group-data-[collapsible=icon]:hidden">{t("name")}</span>
    </div>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import { SidebarBrand } from "@ihsp/ui"

export function AdminBrand() {
  const t = useT("app")
  return (
    <SidebarBrand
      name={t("name")}
      // oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public
      logo={<img src="/icons/logo.svg" alt="" width={24} height={24} className="rounded-md" />}
    />
  )
}

"use client"

import { BRAND } from "@ihsp/config/brand"
import { useT } from "@ihsp/i18n"
import { SidebarBrand } from "@ihsp/ui"

export function StaffBrand() {
  const t = useT("app")
  return (
    <SidebarBrand
      name={t("name")}
      // oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public
      logo={<img src={BRAND.logos.png64} alt="" width={24} height={24} />}
    />
  )
}

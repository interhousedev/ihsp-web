"use client"

import { useT } from "@ihsp/i18n"
import { SidebarBrand } from "@ihsp/ui"

export function AdmissionBrand() {
  const t = useT("app")
  return <SidebarBrand name={t("name")} platform="admission" />
}

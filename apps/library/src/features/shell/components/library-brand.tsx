"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"

export function LibraryBrand() {
  const t = useT("app")
  return (
    <Link href="/" className="flex items-center gap-2 px-2 py-1 font-semibold">
      <Icons.logo aria-hidden />
      <span className="truncate group-data-[collapsible=icon]:hidden">{t("name")}</span>
    </Link>
  )
}

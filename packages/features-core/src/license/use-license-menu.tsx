"use client"

import { useT } from "@ihsp/i18n"
import type { UserMenuItem } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { LicenseDialog } from "./license-dialog"

/**
 * Profile-menu entry "License and source code" that opens the license dialog. Render `dialog` next to the menu; it
 * stays closed until the item is chosen.
 */
export function useLicenseMenu(): { items: UserMenuItem[]; dialog: ReactNode } {
  const t = useT("license")
  const [open, setOpen] = useState(false)
  const items: UserMenuItem[] = [{ key: "license", title: t("menu"), icon: "info", onSelect: () => setOpen(true) }]
  return {
    items,
    dialog: <LicenseDialog open={open} onOpenChange={setOpen} />,
  }
}

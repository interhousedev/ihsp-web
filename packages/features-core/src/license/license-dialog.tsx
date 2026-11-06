"use client"

import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { LicenseSection } from "./license-section"

export type LicenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The license notice and source links in a dialog, for apps that have no settings page. */
export function LicenseDialog({ open, onOpenChange }: LicenseDialogProps) {
  const t = useT("license")
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("menu")}>
      <LicenseSection />
    </ResponsiveDialog>
  )
}

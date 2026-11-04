"use client"

import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ihsp/ui"
import { LicenseSection } from "./license-section"

export type LicenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The license notice and source links in a dialog, for apps that have no settings page. */
export function LicenseDialog({ open, onOpenChange }: LicenseDialogProps) {
  const t = useT("license")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("menu")}</DialogTitle>
        </DialogHeader>
        <LicenseSection />
      </DialogContent>
    </Dialog>
  )
}

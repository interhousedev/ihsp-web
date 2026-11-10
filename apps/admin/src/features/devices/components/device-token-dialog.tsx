"use client"

import type { DeviceCreatedOut } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { TOUCH } from "../../shared/utils/touch"

/** The token of a new device. It is shown here once and never fetched again, so the dialog says to copy it now. */
export function DeviceTokenDialog({ device, onClose }: { device: DeviceCreatedOut; onClose: () => void }) {
  const t = useT("devices")
  const tCommon = useT("common")
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(device.token)
    setCopied(true)
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("tokenTitle", { name: device.name })}
      size="sm"
      disablePointerDismissal
      footer={
        <Button type="button" className={TOUCH} onClick={onClose}>
          {t("tokenDone")}
        </Button>
      }
    >
      <div className="grid gap-3">
        <p role="alert" className="text-sm">
          {t("tokenWarning")}
        </p>
        <code aria-label={t("tokenLabel")} className="bg-muted block rounded-md p-3 font-mono text-sm break-all">
          {device.token}
        </code>
        <Button type="button" variant="outline" className={TOUCH} onClick={() => void copy()}>
          <Icons.copy aria-hidden />
          {copied ? t("copied") : tCommon("copy")}
        </Button>
      </div>
    </ResponsiveDialog>
  )
}

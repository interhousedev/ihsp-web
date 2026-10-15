"use client"

import { postAdminUserResetPasswordLink } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  CopyButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  QrCode,
} from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/**
 * Generate the reset password link of any user (same token and expiry as the emailed reset) and show it as a
 * link with a copy button and a QR code. Nothing is emailed (ADM-5).
 */
export function ResetLinkButton({ userId }: { userId: string }) {
  const t = useT("users.resetLink")
  const [link, setLink] = useState<string | null>(null)

  const generate = useAdminMutation({
    mutationFn: () => postAdminUserResetPasswordLink(userId),
    onSuccess: (data) => setLink(data.activation_url),
  })

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className={TOUCH}
        disabled={generate.isPending}
        onClick={() => generate.mutate()}
      >
        {t("button")}
      </Button>
      <Dialog open={link !== null} onOpenChange={(open) => (open ? undefined : setLink(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              readOnly
              value={link ?? ""}
              aria-label={t("title")}
              className={TOUCH}
              onFocus={(event) => event.currentTarget.select()}
            />
            <CopyButton value={link ?? ""} />
          </div>
          {link ? (
            <div className="flex justify-center">
              <QrCode value={link} label={t("qrAlt")} />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" className={TOUCH} onClick={() => setLink(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

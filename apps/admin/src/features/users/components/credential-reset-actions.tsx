"use client"

import { postAdminUserResetOtp, postAdminUserResetPassword } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  CopyButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { toast } from "sonner"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/**
 * Reset the password (shows a one-time activation link to hand over) or the OTP of another Administration member
 * (ADM-5, ID-23).
 */
export function CredentialResetActions({ userId, name }: { userId: string; name: string }) {
  const t = useT("users.reset")
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  const resetPassword = useAdminMutation({
    mutationFn: () => postAdminUserResetPassword(userId),
    onSuccess: (data) => {
      setPasswordOpen(false)
      setLink(data.activation_url)
    },
  })
  const resetOtp = useAdminMutation({
    mutationFn: () => postAdminUserResetOtp(userId),
    onSuccess: () => {
      setOtpOpen(false)
      toast.success(t("otpDone", { name }))
    },
  })

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className={TOUCH} onClick={() => setPasswordOpen(true)}>
        {t("password")}
      </Button>
      <Button type="button" variant="outline" className={TOUCH} onClick={() => setOtpOpen(true)}>
        {t("otp")}
      </Button>
      <ConfirmDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        title={t("passwordTitle", { name })}
        description={t("passwordDescription")}
        confirmLabel={t("password")}
        loading={resetPassword.isPending}
        onConfirm={() => resetPassword.mutate()}
      />
      <ConfirmDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        title={t("otpTitle", { name })}
        description={t("otpDescription")}
        confirmLabel={t("otp")}
        loading={resetOtp.isPending}
        onConfirm={() => resetOtp.mutate()}
      />
      <Dialog open={link !== null} onOpenChange={(open) => (open ? undefined : setLink(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("linkTitle")}</DialogTitle>
            <DialogDescription>{t("linkDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              readOnly
              value={link ?? ""}
              aria-label={t("linkTitle")}
              className={TOUCH}
              onFocus={(event) => event.currentTarget.select()}
            />
            <CopyButton value={link ?? ""} />
          </div>
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

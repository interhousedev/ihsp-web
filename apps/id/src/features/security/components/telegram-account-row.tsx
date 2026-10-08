"use client"

import { deleteTelegram, keys, patchTelegram, type TelegramAccount, type UserMe } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, ConfirmDialog, Switch } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

/** ID-21: OTP delivery per account (switch) and **Unlink**; unlinking the last OTP channel warns first (UF-ID-05 2b). */
export function TelegramAccountRow({ account, user }: { account: TelegramAccount; user: UserMe }) {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const switchId = useId()
  const [confirming, setConfirming] = useState(false)
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.id.telegram() }),
      queryClient.invalidateQueries({ queryKey: keys.id.me() }),
    ])
  const toggle = useMutation({
    mutationFn: (otpDelivery: boolean) => patchTelegram(account.telegram_user_id, { otp_delivery: otpDelivery }),
    onSuccess: refresh,
  })
  const unlink = useMutation({
    mutationFn: () => deleteTelegram(account.telegram_user_id),
    onSuccess: async () => {
      await refresh()
      setConfirming(false)
    },
  })
  const channels = user.telegram.filter((item) => item.otp_delivery).length + (user.otp_via_email ? 1 : 0)
  const lastChannel = user.otp_enabled && account.otp_delivery && channels <= 1
  const name = account.username ? `@${account.username}` : String(account.telegram_user_id)

  return (
    <Card>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{name}</span>
              {account.blocked ? <Badge variant="destructive">{t("security.telegram.blocked")}</Badge> : null}
            </div>
            <span className="text-muted-foreground text-sm">
              {t("security.telegram.linkedAt", { when: format.date(account.linked_at) })}
            </span>
          </div>
          <Button type="button" variant="outline" className="h-11" onClick={() => setConfirming(true)}>
            {t("security.telegram.unlink")}
          </Button>
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <label htmlFor={switchId} className="text-sm">
            {t("security.telegram.otpDelivery")}
          </label>
          <Switch
            id={switchId}
            checked={account.otp_delivery}
            disabled={toggle.isPending}
            onCheckedChange={(checked) => toggle.mutate(checked === true)}
          />
        </div>
        <ErrorAlert error={toggle.error} />
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("security.telegram.unlinkTitle", { name })}
        description={lastChannel ? t("security.telegram.unlinkLastChannel") : t("security.telegram.unlinkDescription")}
        confirmLabel={t("security.telegram.unlink")}
        destructive
        loading={unlink.isPending}
        onConfirm={() => unlink.mutate()}
      >
        <ErrorAlert error={unlink.error} />
      </ConfirmDialog>
    </Card>
  )
}

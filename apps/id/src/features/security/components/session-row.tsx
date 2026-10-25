"use client"

import { deleteSession, keys, type SessionItem } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Card, CardContent, LoadingButton } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"
import { describeDevice } from "../../shared/utils/describe-device"

const AMR_KEYS: Record<string, string> = {
  pwd: "security.sessions.amr.pwd",
  otp: "security.sessions.amr.otp",
  tg: "security.sessions.amr.tg",
  hwk: "security.sessions.amr.hwk",
}

/** One session: device, IP, login method, last activity; the current one is marked and cannot be revoked here. */
export function SessionRow({ session }: { session: SessionItem }) {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const revoke = useMutation({
    mutationFn: () => deleteSession(session.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.id.sessions() }),
  })
  const device = describeDevice(session.user_agent)
  const deviceText =
    device.browser && device.os
      ? t("security.sessions.deviceOn", { browser: device.browser, os: device.os })
      : (device.browser ?? device.os ?? t("security.sessions.unknownDevice"))
  const methods = session.amr.map((method) => (AMR_KEYS[method] ? t(AMR_KEYS[method]) : method)).join(" + ")

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{deviceText}</span>
            {session.current ? <Badge variant="secondary">{t("security.sessions.current")}</Badge> : null}
          </div>
          <p className="text-muted-foreground text-sm">{[session.ip, methods].filter(Boolean).join(" · ")}</p>
          <p className="text-muted-foreground text-sm" title={format.dateTime(session.last_seen_at)}>
            {t("security.sessions.lastSeen", { when: format.relative(session.last_seen_at) })}
          </p>
          <ErrorAlert error={revoke.error} />
        </div>
        {session.current ? null : (
          <LoadingButton
            type="button"
            variant="outline"
            className="h-11"
            loading={revoke.isPending}
            loadingLabel={t("idCommon.working")}
            onClick={() => revoke.mutate()}
          >
            {t("security.sessions.revoke")}
          </LoadingButton>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { deleteMePrivacyErasure, type ErasureRequest, keys } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingButton,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

/** The open erasure request: an administrator reviews it, and the user may withdraw it until then. */
export function ErasurePendingCard({ request }: { request: ErasureRequest }) {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const cancel = useMutation({
    mutationFn: () => deleteMePrivacyErasure(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.privacy.erasure() }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.delete.pendingTitle")}</CardTitle>
        <CardDescription>{t("security.delete.pendingDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Alert role="status">
          <AlertTitle>{t("security.delete.pendingStatus")}</AlertTitle>
          <AlertDescription>
            {t("security.delete.pendingSince", { date: format.dateTime(request.requested_at) })}
          </AlertDescription>
        </Alert>
        <ErrorAlert error={cancel.error} />
        <div>
          <LoadingButton
            type="button"
            variant="outline"
            loading={cancel.isPending}
            loadingLabel={t("idCommon.working")}
            onClick={() => cancel.mutate()}
          >
            {t("security.delete.cancelRequest")}
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  )
}

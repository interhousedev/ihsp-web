"use client"

import {
  type DataExport,
  getMePrivacyExportDownload,
  getMePrivacyExportsQuery,
  keys,
  postMePrivacyExport,
} from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, LoadingButton } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { openFileUrl } from "../../../file-item/open-file-url"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

const POLL_MS = 5000

type ExportState = "preparing" | "ready" | "expired" | "failed"

/** The export as the user sees it: a ready file past its expiry is expired. */
export function exportState(item: DataExport, now = Date.now()): ExportState {
  if (item.status === "failed") return "failed"
  if (item.status !== "ready") return "preparing"
  return item.expires_at && Date.parse(item.expires_at) <= now ? "expired" : "ready"
}

/** "Download my data": request an export, follow its status and download it when ready. */
export function DataExportCard() {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const exports = useQuery({
    ...getMePrivacyExportsQuery(),
    refetchInterval: (query) =>
      query.state.data?.items.some((item) => item.status === "queued" || item.status === "running") ? POLL_MS : false,
  })
  const latest = exports.data?.items[0]
  const state = latest ? exportState(latest) : null
  const request = useMutation({
    mutationFn: () => postMePrivacyExport(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.privacy.exports() }),
  })
  const download = useMutation({
    mutationFn: async (id: string) => openFileUrl((await getMePrivacyExportDownload(id)).url),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.export.title")}</CardTitle>
        <CardDescription>{t("security.export.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {latest && state ? (
          <p className="flex flex-wrap items-center gap-2 text-sm" role="status">
            <Badge variant={state === "failed" ? "destructive" : "secondary"}>{t(`security.export.${state}`)}</Badge>
            <span className="text-muted-foreground">
              {t("security.export.requested", { date: format.dateTime(latest.created_at) })}
              {state === "ready" && latest.expires_at
                ? ` · ${t("security.export.until", { date: format.dateTime(latest.expires_at) })}`
                : ""}
            </span>
          </p>
        ) : null}
        <ErrorAlert error={request.error ?? download.error ?? (exports.isError ? exports.error : null)} />
        <div className="flex flex-wrap gap-2">
          {latest && state === "ready" ? (
            <LoadingButton
              type="button"
              loading={download.isPending}
              loadingLabel={t("idCommon.working")}
              onClick={() => download.mutate(latest.id)}
            >
              {t("security.export.download")}
            </LoadingButton>
          ) : null}
          {state !== "preparing" ? (
            <LoadingButton
              type="button"
              variant={state === "ready" ? "outline" : "default"}
              loading={request.isPending}
              loadingLabel={t("idCommon.working")}
              disabled={exports.isPending}
              onClick={() => request.mutate()}
            >
              {t("security.export.request")}
            </LoadingButton>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

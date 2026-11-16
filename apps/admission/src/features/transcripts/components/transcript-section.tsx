"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Skeleton, StateView } from "@ihsp/ui"
import { toast } from "sonner"
import { FilePickButton } from "../../documents/components/file-pick-button"
import { useCancelTranscript, useMyTranscripts, useUploadScan, type Transcript } from "../api"
import { RequestDialog } from "./request-dialog"
import { TranscriptStatus } from "./transcript-status"

function TranscriptCard({ item }: { item: Transcript }) {
  const t = useT("transcripts")
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const cancel = useCancelTranscript()
  const scan = useUploadScan()
  const onError = (error: unknown) => toast.error(errorMessage(error))
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{item.destination_note || t("noDestination")}</span>
        <TranscriptStatus status={item.status} />
      </div>
      {item.requested_at && (
        <span className="text-muted-foreground text-xs">{t("requestedOn", { date: date(item.requested_at) })}</span>
      )}
      {item.status === "ready" && item.pickup_location && (
        <p className="text-sm">{t("pickupAt", { place: item.pickup_location })}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {item.status === "ready" && !item.document_id && (
          <FilePickButton
            size="sm"
            label={t("uploadScan")}
            disabled={scan.isPending}
            onPick={(file) => scan.mutate({ id: item.id, file }, { onError })}
          />
        )}
        {item.status === "ready" && item.document_id && <span className="text-xs">{t("scanUploaded")}</span>}
        {item.status === "requested" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(item.id, { onError })}
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </li>
  )
}

/** My transcript requests (a paper copy from the lyceum), with the pickup place from the API. */
export function TranscriptSection() {
  const t = useT("transcripts")
  const query = useMyTranscripts()
  let body
  if (query.isPending) body = <Skeleton className="h-24 w-full" />
  else if (query.isError) body = <StateView state="error" onRetry={() => void query.refetch()} />
  else if (query.data.length === 0) body = <StateView state="empty" title={t("empty")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {query.data.map((item) => (
          <TranscriptCard key={item.id} item={item} />
        ))}
      </ul>
    )
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <RequestDialog />
      </div>
      {body}
    </section>
  )
}

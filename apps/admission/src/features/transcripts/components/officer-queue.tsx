"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Skeleton, StateView } from "@ihsp/ui"
import { toast } from "sonner"
import { useNow } from "../../../lib/use-now"
import { useOfficerDone, useOfficerTranscripts, useOfficerUndo, type Transcript } from "../api"
import { TranscriptStatus } from "./transcript-status"

function OfficerRow({ item }: { item: Transcript }) {
  const t = useT("transcripts")
  const { date, dateTime } = useFormatters()
  const errorMessage = useErrorMessage()
  const done = useOfficerDone()
  const undo = useOfficerUndo()
  const now = useNow()
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const canUndo = item.status === "ready" && item.undo_until !== null && new Date(item.undo_until).getTime() > now
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-medium">{item.student_name}</span>
          <span className="text-muted-foreground text-xs">
            {item.class_name}
            {item.requested_at ? ` · ${date(item.requested_at)}` : ""}
          </span>
        </div>
        <TranscriptStatus status={item.status} />
      </div>
      {item.destination_note && <p className="text-sm">{item.destination_note}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {item.status === "requested" && (
          <Button
            type="button"
            size="sm"
            disabled={done.isPending}
            onClick={() => done.mutate({ id: item.id, lockVersion: item.lock_version }, { onError })}
          >
            {t("done")}
          </Button>
        )}
        {canUndo && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={undo.isPending}
              onClick={() => undo.mutate(item.id, { onError })}
            >
              {t("undo")}
            </Button>
            <span className="text-muted-foreground text-xs">
              {t("undoUntil", { time: dateTime(item.undo_until as string) })}
            </span>
          </>
        )}
      </div>
    </li>
  )
}

/** The transcript officer's request list: Done, then Undo for a short while. */
export function OfficerQueue() {
  const t = useT("transcripts")
  const query = useOfficerTranscripts()
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <StateView state="error" onRetry={() => void query.refetch()} />
  if (query.data.length === 0) return <StateView state="empty" title={t("officerEmpty")} />
  return (
    <ul className="flex flex-col gap-2">
      {query.data.map((item) => (
        <OfficerRow key={item.id} item={item} />
      ))}
    </ul>
  )
}

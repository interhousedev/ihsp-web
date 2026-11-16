"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Skeleton, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { ScrollFade } from "../../../components/scroll-fade"
import { useNow } from "../../../lib/use-now"
import { useOfficerDone, useOfficerTranscripts, useOfficerUndo, type Transcript } from "../api"
import { TranscriptStatus } from "./transcript-status"
import { QueryError } from "../../shell/components/query-error"

const FILTERS = ["requested", "ready", "cancelled"] as const

const ROW_EDGE = {
  requested: "border-l-info",
  ready: "border-l-success",
  cancelled: "border-l-muted-foreground",
} as const

function OfficerRow({ item }: { item: Transcript }) {
  const t = useT("transcripts")
  const { date, dateTime } = useFormatters()
  const errorMessage = useErrorMessage()
  const done = useOfficerDone()
  const undo = useOfficerUndo()
  const now = useNow()
  const [confirming, setConfirming] = useState(false)
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const markDone = () =>
    done.mutate(
      { id: item.id, lockVersion: item.lock_version },
      {
        onError,
        onSuccess: (res) => {
          setConfirming(false)
          const until = res.request.undo_until
          toast.success(t("doneToast", { name: item.student_name ?? "" }), {
            action: until ? { label: t("undo"), onClick: () => undo.mutate(item.id, { onError }) } : undefined,
            duration: 8000,
          })
        },
      },
    )
  const canUndo = item.status === "ready" && item.undo_until !== null && new Date(item.undo_until).getTime() > now
  return (
    <li className={`bg-card flex flex-col gap-2 rounded-card border border-l-4 p-3 ${ROW_EDGE[item.status]}`}>
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
          <Button type="button" size="sm" disabled={done.isPending} onClick={() => setConfirming(true)}>
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
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("doneConfirmTitle", { name: item.student_name ?? "" })}
        description={t("doneConfirmText")}
        confirmLabel={t("done")}
        loading={done.isPending}
        onConfirm={markDone}
      />
    </li>
  )
}

/** The transcript officer's request list: Done, then Undo for a short while. */
export function OfficerQueue() {
  const t = useT("transcripts")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("requested")
  const query = useOfficerTranscripts(filter)
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.length === 0)
    body = <StateView state="empty" icon={<Icons.files className="size-8" />} title={t("officerEmpty")} />
  else
    body = (
      <ScrollFade maxHeight="calc(100dvh - 18rem)">
        <ul className="flex flex-col gap-2">
          {query.data.map((item) => (
            <OfficerRow key={item.id} item={item} />
          ))}
        </ul>
      </ScrollFade>
    )
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f}>
              {t(`status.${f}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {body}
    </div>
  )
}

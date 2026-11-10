"use client"

import { getMeExcuseQuery, type Excuse } from "@ihsp/api"
import { BackLink, QueryState } from "@ihsp/features-core"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import { useCancelExcuse } from "../api/use-excuse-mutations"
import { canCancel, isKnownOrigin, templateTitle } from "../utils/excuse-labels"
import { ExcuseDates } from "./excuse-dates"
import { ExcuseMessageForm } from "./excuse-message-form"
import { ExcuseStatusBadge } from "./excuse-status-badge"
import { ExcuseThread } from "./excuse-thread"

/** One excuse: its facts, the decision of the curator, the conversation and the cancel action. */
export function ExcusePage() {
  const t = useT("excuses")
  const [id] = useQueryState("id", parseAsString)
  const query = useQuery({ ...getMeExcuseQuery(id ?? ""), enabled: Boolean(id) })
  return (
    <PageContainer title={t("detail.title")}>
      <BackLink href="/excuses/" label={t("detail.back")} />
      {id ? (
        <QueryState query={query} rows={4}>
          {(excuse) => <ExcuseDetail excuse={excuse} />}
        </QueryState>
      ) : (
        <StateView state="empty" emptyText={t("detail.notFound")} />
      )}
    </PageContainer>
  )
}

function ExcuseDetail({ excuse }: { excuse: Excuse }) {
  const t = useT("excuses")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const cancel = useCancelExcuse(excuse.id)
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <section className="bg-card flex flex-col gap-3 rounded-card border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 flex-1 text-base font-medium break-words">
            {templateTitle(excuse.template, locale) || t("untitled")}
          </h2>
          <ExcuseStatusBadge status={excuse.status} />
        </div>
        <p className="text-sm tabular-nums">
          <ExcuseDates excuse={excuse} />
        </p>
        {isKnownOrigin(excuse.origin) && excuse.origin !== "request" ? (
          <p className="text-muted-foreground text-xs">{t(`origin.${excuse.origin}`)}</p>
        ) : null}
        {excuse.lesson_ids.length > 0 ? (
          <p className="text-muted-foreground text-sm">{t("detail.lessons", { count: excuse.lesson_ids.length })}</p>
        ) : null}
        {excuse.reason ? <p className="text-sm whitespace-pre-line break-words">{excuse.reason}</p> : null}
        {excuse.decision_comment ? (
          <p className="bg-muted rounded-lg p-3 text-sm break-words">
            <span className="font-medium">{t("detail.decision")}: </span>
            {excuse.decision_comment}
          </p>
        ) : null}
        {canCancel(excuse) ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 self-start md:min-h-8"
            disabled={cancel.isPending}
            onClick={() => setConfirming(true)}
          >
            {t("detail.cancel")}
          </Button>
        ) : null}
        {cancel.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(cancel.error)}
          </p>
        ) : null}
      </section>
      <section aria-labelledby="excuse-thread-title" className="flex flex-col gap-3">
        <h2 id="excuse-thread-title" className="text-base font-semibold">
          {t("thread.title")}
        </h2>
        <ExcuseThread messages={excuse.thread} ownerId={excuse.student_id} />
        <ExcuseMessageForm excuseId={excuse.id} />
      </section>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("detail.cancelConfirm")}
        confirmLabel={t("detail.cancel")}
        onConfirm={() => {
          setConfirming(false)
          cancel.mutate()
        }}
      />
    </div>
  )
}

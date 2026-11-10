"use client"

import { getStaffExcuseQuery, type Excuse } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useExcuseActions, type ExcuseDecision } from "../hooks/use-excuse-actions"
import { templateTitle } from "../utils/excuse-labels"
import { ExcuseDecisionDialog } from "./excuse-decision-dialog"
import { ExcuseEndForm } from "./excuse-end-form"
import { ExcuseMessageForm } from "./excuse-message-form"
import { ExcusePeriod } from "./excuse-period"
import { ExcuseStatusBadge } from "./excuse-status-badge"
import { ExcuseThread } from "./excuse-thread"

function Detail({ excuse }: { excuse: Excuse }) {
  const t = useT("excuses")
  const locale = useLocale()
  const actions = useExcuseActions(excuse.id)
  const [decision, setDecision] = useState<ExcuseDecision | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{excuse.student_name}</span>
        <ExcuseStatusBadge status={excuse.status} />
      </div>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">{t("detail.template")}</dt>
        <dd>{templateTitle(excuse.template, locale)}</dd>
        <dt className="text-muted-foreground">{t("detail.period")}</dt>
        <dd>
          <ExcusePeriod excuse={excuse} />
        </dd>
        <dt className="text-muted-foreground">{t("detail.reason")}</dt>
        <dd className="whitespace-pre-wrap">{excuse.reason || t("detail.noReason")}</dd>
        {excuse.decision_comment ? (
          <>
            <dt className="text-muted-foreground">{t("detail.decision")}</dt>
            <dd className="whitespace-pre-wrap">{excuse.decision_comment}</dd>
          </>
        ) : null}
      </dl>
      <div className="flex flex-wrap gap-2">
        {excuse.status === "pending" ? (
          <>
            <Button className="min-h-11 md:min-h-8" onClick={() => setDecision("approve")}>
              {t("actions.approve")}
            </Button>
            <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => setDecision("reject")}>
              {t("actions.reject")}
            </Button>
          </>
        ) : null}
        {excuse.status === "approved" ? (
          <Button variant="destructive" className="min-h-11 md:min-h-8" onClick={() => setDecision("revoke")}>
            {t("actions.revoke")}
          </Button>
        ) : null}
      </div>
      {excuse.status === "approved" ? (
        <ExcuseEndForm
          key={excuse.ends_on ?? "open"}
          excuse={excuse}
          busy={actions.end.isPending}
          onEnd={actions.end.mutateAsync}
        />
      ) : null}
      <section className="flex flex-col gap-3">
        <h3 className="font-medium">{t("thread.title")}</h3>
        <ExcuseThread thread={excuse.thread} />
        <ExcuseMessageForm busy={actions.message.isPending} onSend={actions.message.mutateAsync} />
      </section>
      <ExcuseDecisionDialog
        kind={decision}
        busy={actions.decide.isPending}
        onDecide={(kind, comment) => actions.decide.mutateAsync({ kind, comment })}
        onClose={() => setDecision(null)}
      />
    </div>
  )
}

/** One excuse with its thread and the curator's actions. */
export function ExcuseDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const t = useT("excuses")
  const query = useQuery({ ...getStaffExcuseQuery(id ?? ""), enabled: id !== null })
  return (
    <ResponsiveDialog open={id !== null} onOpenChange={(open) => !open && onClose()} title={t("title")} size="md">
      {id ? <QueryState query={query}>{(excuse) => <Detail excuse={excuse} />}</QueryState> : null}
    </ResponsiveDialog>
  )
}
